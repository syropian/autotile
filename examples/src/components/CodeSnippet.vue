<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

type SnippetLang = 'bash' | 'ts'

type ProviderOption = {
  id: string
  label: string
  code: string
  lang?: SnippetLang
}

const props = defineProps<{
  code?: string
  lang?: SnippetLang
  providers?: readonly ProviderOption[]
}>()

const shikiTheme = 'material-theme-palenight'
const selectedProviderId = ref(props.providers?.[0]?.id ?? null)
const highlightedHtml = ref('')
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyTimeout: ReturnType<typeof setTimeout> | null = null
let renderHighlightedCode:
  | ((code: string, lang: SnippetLang) => Promise<string>)
  | null = null

const activeProvider = computed(() => {
  if (!props.providers?.length) return null
  return (
    props.providers.find(
      (provider) => provider.id === selectedProviderId.value,
    ) ?? props.providers[0]
  )
})

const activeCode = computed(
  () => activeProvider.value?.code ?? props.code ?? '',
)
const activeLang = computed<SnippetLang>(
  () => activeProvider.value?.lang ?? props.lang ?? 'ts',
)
const copyIcon = computed(() => {
  if (copyState.value === 'copied') return 'mdi:check'
  if (copyState.value === 'error') return 'mdi:alert-circle-outline'
  return 'mdi:content-copy'
})
const copyLabel = computed(() => {
  if (copyState.value === 'copied') return 'Copied to clipboard'
  if (copyState.value === 'error') return 'Copy failed, try again'
  return 'Copy code to clipboard'
})

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function renderPlainCodeBlock(value: string): string {
  return `<pre><code>${escapeHtml(value)}</code></pre>`
}

function getShikiLanguage(lang: SnippetLang): 'bash' | 'typescript' {
  return lang === 'ts' ? 'typescript' : 'bash'
}

async function getHighlightedCodeRenderer() {
  if (renderHighlightedCode) {
    return renderHighlightedCode
  }

  const [
    { createBundledHighlighter, createSingletonShorthands },
    { createJavaScriptRegexEngine },
    bash,
    typescript,
    theme,
  ] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/langs/bash.mjs'),
    import('shiki/langs/typescript.mjs'),
    import('shiki/themes/material-theme-palenight.mjs'),
  ])

  const createHighlighter = createBundledHighlighter({
    langs: {
      bash: () => Promise.resolve(bash),
      typescript: () => Promise.resolve(typescript),
    },
    themes: {
      [shikiTheme]: () => Promise.resolve(theme),
    },
    engine: createJavaScriptRegexEngine,
  })

  const { codeToHtml } = createSingletonShorthands(createHighlighter)

  renderHighlightedCode = (code, lang) =>
    codeToHtml(code, {
      lang: getShikiLanguage(lang),
      theme: shikiTheme,
    })

  return renderHighlightedCode
}

async function updateHighlight(): Promise<void> {
  const code = activeCode.value

  if (!code) {
    highlightedHtml.value = renderPlainCodeBlock('')
    return
  }

  try {
    const highlight = await getHighlightedCodeRenderer()
    highlightedHtml.value = await highlight(code, activeLang.value)
  } catch {
    highlightedHtml.value = renderPlainCodeBlock(code)
  }
}

async function copyToClipboard(): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(activeCode.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = activeCode.value
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.append(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }

    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }

  if (copyTimeout) {
    clearTimeout(copyTimeout)
  }

  copyTimeout = setTimeout(() => {
    copyState.value = 'idle'
  }, 1800)
}

watch(
  () => props.providers,
  (providers) => {
    if (!providers?.length) {
      selectedProviderId.value = null
      return
    }

    if (
      !providers.some((provider) => provider.id === selectedProviderId.value)
    ) {
      selectedProviderId.value = providers[0]?.id ?? null
    }
  },
  { immediate: true },
)

watch(
  [activeCode, activeLang],
  () => {
    void updateHighlight()
  },
  { immediate: true },
)
</script>

<template>
  <div class="snippet">
    <div
      v-if="providers?.length"
      class="snippet-tabs"
      role="tablist"
      aria-label="Install command provider"
    >
      <button
        v-for="provider in providers"
        :key="provider.id"
        type="button"
        class="snippet-tab"
        :class="{ 'snippet-tab--active': provider.id === activeProvider?.id }"
        role="tab"
        :aria-selected="provider.id === activeProvider?.id"
        @click="selectedProviderId = provider.id"
      >
        {{ provider.label }}
      </button>
    </div>

    <div class="code-block">
      <button
        type="button"
        class="snippet-copy"
        :class="`snippet-copy--${copyState}`"
        :aria-label="copyLabel"
        :title="copyLabel"
        @click="copyToClipboard"
      >
        <Icon class="snippet-copy__icon" :icon="copyIcon" aria-hidden="true" />
      </button>

      <div class="code-block__content" v-html="highlightedHtml"></div>
    </div>
  </div>
</template>

<style scoped>
.snippet {
  margin-top: 2rem;
}

.snippet-tabs {
  display: inline-flex;
  gap: 0.4rem;
  padding: 0.35rem;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(103, 232, 249, 0.14);
  border-radius: 999px;
  background: rgba(7, 12, 27, 0.56);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.snippet-tab {
  min-width: 4rem;
  padding: 0.42rem 0.8rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition:
    background 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.snippet-tab:hover {
  color: #f8fbff;
  background: rgba(255, 255, 255, 0.05);
}

.snippet-tab--active {
  color: #f8fbff;
  background: linear-gradient(
    135deg,
    rgba(6, 182, 212, 0.24),
    rgba(236, 72, 153, 0.2)
  );
  box-shadow:
    0 8px 20px rgba(15, 23, 42, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.snippet-copy {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  z-index: 1;
  display: inline-grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid rgba(103, 232, 249, 0.14);
  border-radius: 999px;
  background: rgba(7, 12, 27, 0.56);
  color: #e6eef8;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition:
    background 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.snippet-copy__icon {
  width: 0.95rem;
  height: 0.95rem;
  font-size: 0.95rem;
  flex: 0 0 auto;
}

.snippet-copy:hover {
  border-color: rgba(103, 232, 249, 0.24);
  background: rgba(255, 255, 255, 0.06);
}

.snippet-copy--copied {
  border-color: rgba(45, 212, 191, 0.3);
  background: rgba(45, 212, 191, 0.14);
  color: #f8fbff;
}

.snippet-copy--error {
  border-color: rgba(251, 113, 133, 0.28);
  background: rgba(251, 113, 133, 0.12);
  color: #f8fbff;
}

.snippet-copy:focus-visible,
.snippet-tab:focus-visible {
  outline: 2px solid rgba(45, 212, 191, 0.5);
  outline-offset: 3px;
}

.code-block {
  position: relative;
  border: 1px solid rgba(103, 232, 249, 0.14);
  border-radius: 0.95rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 20%),
    rgba(7, 12, 27, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.code-block__content :deep(pre) {
  display: block;
  margin: 0;
  padding: 1rem 4rem 1rem 1rem;
  overflow-x: auto;
  background: transparent !important;
  font-size: 0.88rem;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.code-block__content :deep(code) {
  display: block;
  font-family:
    'SFMono-Regular', 'SF Mono', 'Cascadia Mono', 'Roboto Mono', monospace;
}

.code-block__content :deep(.line) {
  white-space: pre-wrap;
}

@media (max-width: 520px) {
  .snippet-tabs {
    display: flex;
    width: 100%;
    overflow-x: auto;
    margin-bottom: 0.65rem;
  }

  .snippet-tab {
    min-width: 0;
    white-space: nowrap;
  }

  .snippet-copy {
    top: 0.65rem;
    right: 0.65rem;
    width: 2rem;
    height: 2rem;
  }

  .code-block__content :deep(pre) {
    padding: 0.9rem 3.5rem 0.9rem 0.9rem;
    font-size: 0.8rem;
  }
}
</style>
