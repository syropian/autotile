<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'

import CodeSnippet from './components/CodeSnippet.vue'
import HeaderGridBackdrop from './components/HeaderGridBackdrop.vue'
import { autotile } from '@syropian/autotile/core/autotile'
import { explainMask } from '@syropian/autotile/debug/mask-lookup'
import {
  pathFourWayDirections,
  pathFourWayRuleSet,
} from '@syropian/autotile/profiles/path-fourWay'
import type { PathPiece } from '@syropian/autotile/core/types'

type DemoTile = {
  id: string
  position: [number, number]
  pathType: string
  currentPiece?: PathPiece
  isFlipped?: boolean
}

const width = 5
const height = 5
const repoUrl = 'https://github.com/syropian/autotile'
const sponsorsUrl = 'https://github.com/sponsors/syropian'
const townaramaUrl = 'https://townarama.syropia.net'
const socials = [
  { name: 'GitHub', href: 'https://github.com/syropian', icon: 'mdi:github' },
  {
    name: 'Instagram',
    href: 'https://instagram.com/syropian',
    icon: 'mdi:instagram',
  },
  {
    name: 'Bluesky',
    href: 'https://bsky.app/profile/syropian.bsky.social',
    icon: 'ri:bluesky-fill',
  },
] as const

const initialTiles: DemoTile[] = [
  { id: 'a', position: [2, 0], pathType: 'road' },
  { id: 'b', position: [2, 1], pathType: 'road' },
  { id: 'c', position: [1, 2], pathType: 'road' },
  { id: 'd', position: [2, 2], pathType: 'road' },
  { id: 'e', position: [3, 2], pathType: 'road' },
  { id: 'f', position: [2, 3], pathType: 'road' },
  { id: 'g', position: [2, 4], pathType: 'road' },
]

const tiles = ref<DemoTile[]>(initialTiles)
let nextTileId = initialTiles.length + 1

function toggleTile(x: number, y: number): void {
  const existingIndex = tiles.value.findIndex(
    (tile) => tile.position[0] === x && tile.position[1] === y,
  )

  if (existingIndex >= 0) {
    tiles.value = tiles.value.filter((_, index) => index !== existingIndex)
    return
  }

  tiles.value = [
    ...tiles.value,
    {
      id: `tile-${nextTileId}`,
      position: [x, y],
      pathType: 'road',
    },
  ]
  nextTileId += 1
}

const resolvedTiles = computed(() =>
  autotile(tiles.value, {
    directions: pathFourWayDirections,
    ruleSet: pathFourWayRuleSet,
  }),
)

type DemoCell = {
  key: string
  x: number
  y: number
  occupied: boolean
  glyph: string
  activeDirections: string[]
}

function getRoadGlyph(activeDirections: readonly string[]): string {
  const signature = [...activeDirections].sort().join(',')

  switch (signature) {
    case '':
      return '•'
    case 'north':
      return '│'
    case 'east':
      return '─'
    case 'south':
      return '│'
    case 'west':
      return '─'
    case 'north,south':
      return '│'
    case 'east,west':
      return '─'
    case 'east,north':
      return '└'
    case 'east,south':
      return '┌'
    case 'north,west':
      return '┘'
    case 'south,west':
      return '┐'
    case 'east,north,south':
      return '├'
    case 'east,south,west':
      return '┬'
    case 'north,south,west':
      return '┤'
    case 'east,north,west':
      return '┴'
    case 'east,north,south,west':
      return '┼'
    default:
      return '?'
  }
}

const resolvedByPosition = computed(() => {
  return new Map(
    resolvedTiles.value.map((result) => [
      `${result.tile.position[0]},${result.tile.position[1]}`,
      result,
    ]),
  )
})

const cells = computed(() => {
  return Array.from({ length: width * height }, (_, index): DemoCell => {
    const x = index % width
    const y = Math.floor(index / width)
    const key = `${x},${y}`
    const result = resolvedByPosition.value.get(key)

    if (!result) {
      return {
        key,
        x,
        y,
        occupied: false,
        glyph: '',
        activeDirections: [],
      }
    }

    const explanation = explainMask(
      result.mask,
      pathFourWayDirections,
      pathFourWayRuleSet,
    )

    return {
      key,
      x,
      y,
      occupied: true,
      glyph: getRoadGlyph(explanation.activeDirections),
      activeDirections: explanation.activeDirections,
    }
  })
})

const installProviders = [
  {
    id: 'pnpm',
    label: 'pnpm',
    code: 'pnpm add @syropian/autotile',
    lang: 'bash',
  },
  {
    id: 'npm',
    label: 'npm',
    code: 'npm install @syropian/autotile',
    lang: 'bash',
  },
  {
    id: 'yarn',
    label: 'yarn',
    code: 'yarn add @syropian/autotile',
    lang: 'bash',
  },
  { id: 'bun', label: 'bun', code: 'bun add @syropian/autotile', lang: 'bash' },
] as const

const basicUsageSnippet = `import { autotile } from
  '@syropian/autotile/core/autotile'
import {
  pathFourWayDirections,
  pathFourWayRuleSet,
} from '@syropian/autotile/profiles/path-fourWay'

const resolved = autotile(tiles, {
  directions: pathFourWayDirections,
  ruleSet: pathFourWayRuleSet,
})`

const tileShapeSnippet = `const tiles = [
  {
    id: 'road-1',
    position: [4, 7],
    pathType: 'road',
  },
]`

const themeSnippet = `import { autotilePathEntities } from
  '@syropian/autotile/profiles/path-fourWay'

const nextEntities = autotilePathEntities(mapEntities, themeEntities)`

const entityShapeSnippet = `const mapEntities = [
  {
    id: 'map-1',
    vector: [4, 7],
    isFlipped: false,
    updatedAt: '0',
    entity: {
      id: 'road-straight',
      pathType: 'road',
      pathPiece: 'straight',
    },
  },
]

const themeEntities = [
  {
    id: 'road-turn-1',
    pathType: 'road',
    pathPiece: 'turn-1',
  },
]`

const customProfileSnippet = `const directions = [
  { name: 'north', dx: 0, dy: -1, bit: 1 },
  { name: 'east', dx: 1, dy: 0, bit: 2 },
  { name: 'south', dx: 0, dy: 1, bit: 4 },
  { name: 'west', dx: -1, dy: 0, bit: 8 },
]

  const ruleSet = {
  5: { piece: 'straight', flip: false },
  10: { piece: 'straight', flip: true },
}`
</script>

<template>
  <main class="page">
    <section class="top-stage">
      <HeaderGridBackdrop />

      <div class="top-stage__content">
        <header class="site-header">
          <nav class="site-nav" aria-label="Primary">
            <a class="site-nav__link" href="#usage">
              <Icon
                class="site-nav__link-icon"
                icon="mdi:book-open-page-variant-outline"
                aria-hidden="true"
              />
              <span>Usage</span>
            </a>
            <a
              class="site-nav__link site-nav__link--repo"
              :href="repoUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon
                class="site-nav__link-icon"
                icon="mdi:github"
                aria-hidden="true"
              />
              <span>GitHub</span>
            </a>
            <a
              class="site-nav__link site-nav__link--sponsor"
              :href="sponsorsUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon
                class="site-nav__link-icon"
                icon="mdi:hand-coin-outline"
                aria-hidden="true"
              />
              <span>Sponsor</span>
            </a>
            <div class="site-nav__socials" aria-label="Social links">
              <a
                v-for="social in socials"
                :key="`header-${social.name}`"
                class="site-nav__social"
                :href="social.href"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="social.name"
                :title="social.name"
              >
                <Icon
                  class="site-nav__social-icon"
                  :icon="social.icon"
                  aria-hidden="true"
                />
              </a>
            </div>
          </nav>
        </header>

        <section class="hero">
          <p class="hero-eyebrow">@syropian/autotile</p>
          <h1 class="hero-title" data-text="Smart tiles for game maps">
            <span>Smart tiles for game maps</span>
          </h1>
          <div class="lede-block">
            <p class="lede">
              Click the grid to place tiles and watch the path resolve itself
              into clean turns, branches, and intersections as neighbours change
              ✨
            </p>
          </div>
        </section>
      </div>
    </section>

    <section class="panel panel--demo">
      <div
        class="grid"
        :style="{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }"
      >
        <button
          v-for="cell in cells"
          :key="cell.key"
          type="button"
          class="cell"
          :class="{ 'cell--active': cell.occupied }"
          :title="
            cell.activeDirections.join(', ') || 'Click to toggle road tile'
          "
          @click="toggleTile(cell.x, cell.y)"
        >
          <span class="coord">{{ cell.x }},{{ cell.y }}</span>
          <strong v-if="cell.occupied" class="road-glyph">{{
            cell.glyph
          }}</strong>
        </button>
      </div>
    </section>

    <section class="panel intro">
      <div class="section-heading">
        <p class="section-kicker">How it works</p>
        <h2>What this package does for you</h2>
        <p class="section-copy">
          <code>@syropian/autotile</code> helps grid-based maps choose the right
          road, path, pipe, or river piece for each tile automatically.
        </p>
      </div>

      <div class="intro-grid">
        <article class="intro-card">
          <h3>You place simple tiles</h3>
          <p>
            Start with basic tile positions. The package looks at each tile's
            neighbors and swaps in the matching shape, like a straight, corner,
            T-junction, or crossing.
          </p>
        </article>

        <article class="intro-card">
          <h3>Bitmasks do the matching</h3>
          <p>
            Behind the scenes, it uses a small number called a bitmask to
            remember which sides connect. That keeps the logic fast and
            consistent without forcing you to hand-author every combination.
          </p>
        </article>

        <article class="intro-card">
          <h3>Good for first maps</h3>
          <p>
            If you are new to game development, think of it as a helper that
            makes connected tiles feel smart while you stay focused on building
            your world.
          </p>
        </article>
      </div>

      <aside class="intro-spotlight">
        <div class="intro-spotlight__copy">
          <h3>Want to see it in a real game?</h3>
          <p>
            Check out
            <span class="intro-spotlight__highlight">Townarama</span> &mdash; an
            isometric city builder made with Vue 3.
          </p>
        </div>
        <a
          class="intro-spotlight__link"
          :href="townaramaUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Visit Townarama</span>
          <Icon icon="mdi:arrow-top-right" aria-hidden="true" />
        </a>
      </aside>
    </section>

    <section id="usage" class="panel docs">
      <div class="section-heading">
        <p class="section-kicker">Documentation</p>
        <h2>Start building connected paths</h2>
        <p class="section-copy">
          If you are building your first game, think of this as the part that
          helps road, pipe, or path tiles snap together automatically.
        </p>
      </div>

      <div class="docs-stack">
        <article class="doc-step">
          <div class="doc-step__marker" aria-hidden="true">1</div>
          <div class="doc-step__body">
            <p class="doc-card__eyebrow">Install</p>
            <h3>Add the package</h3>
            <p>
              Install it in your project so you can start turning simple tile
              positions into clean connected shapes.
            </p>
            <CodeSnippet :providers="installProviders" />
          </div>
        </article>

        <article class="doc-step">
          <div class="doc-step__marker" aria-hidden="true">2</div>
          <div class="doc-step__body">
            <p class="doc-card__eyebrow">Basic usage</p>
            <h3>Feed in your tiles</h3>
            <p>
              Give the library your tile list and it will figure out which piece
              each tile should become based on its neighbors.
            </p>
            <CodeSnippet :code="basicUsageSnippet" lang="ts" />
            <p class="doc-note">
              Each tile needs an <code>id</code>, a grid
              <code>position</code> like <code>[x, y]</code>, and a
              <code>pathType</code> such as <code>road</code> or
              <code>river</code>.
            </p>
            <CodeSnippet :code="tileShapeSnippet" lang="ts" />
          </div>
        </article>

        <article class="doc-step">
          <div class="doc-step__marker" aria-hidden="true">3</div>
          <div class="doc-step__body">
            <p class="doc-card__eyebrow">Built-in profile</p>
            <h3>Use the ready-made road helper</h3>
            <p>
              If you just want a solid starting point for roads or paths, the
              built-in helper gives you a quick shortcut.
            </p>
            <CodeSnippet :code="themeSnippet" lang="ts" />
            <p class="doc-note">
              <code>mapEntities</code> is your placed map data.
              <code>themeEntities</code> is the list of pieces the helper can
              swap in, like straights, corners, caps, and intersections.
            </p>
            <CodeSnippet :code="entityShapeSnippet" lang="ts" />
            <p class="doc-note">
              The built-in four-way tools are
              <code>pathFourWayDirections</code>,
              <code>pathFourWayRuleSet</code>, <code>pathFourWayProfile</code>,
              and <code>autotilePathEntities(...)</code>.
            </p>
          </div>
        </article>

        <article class="doc-step">
          <div class="doc-step__marker" aria-hidden="true">4</div>
          <div class="doc-step__body">
            <p class="doc-card__eyebrow">Custom profiles</p>
            <h3>Make your own profile when you need one</h3>
            <p>
              You can also skip the built-in four-way setup and pass your own
              directions and rule set into
              <code>autotile(...)</code>.
            </p>
            <CodeSnippet :code="customProfileSnippet" lang="ts" />
          </div>
        </article>
      </div>
    </section>

    <footer class="footer">
      <a
        class="footer-chip footer-chip--author"
        href="https://syropia.net"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="footer__badge" aria-hidden="true">
          <Icon class="footer-badge__icon" icon="mdi:cards-heart" />
        </div>
        <div class="footer__copy">
          <span class="footer__label">Built by</span>
          <span class="footer__name">Collin Henderson</span>
        </div>
      </a>
      <a
        class="footer-chip footer-chip--sponsor"
        :href="sponsorsUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="footer__badge footer__badge--sponsor" aria-hidden="true">
          <Icon class="footer-chip__icon" icon="mdi:hand-coin-outline" />
        </div>
        <span>Sponsor</span>
      </a>
      <div class="footer-chip footer-chip--socials" aria-label="Social links">
        <span class="footer-chip__label">Socials</span>
        <div class="footer-socials">
          <a
            v-for="social in socials"
            :key="social.name"
            class="footer-social"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="social.name"
            :title="social.name"
          >
            <Icon
              class="footer-social__icon"
              :icon="social.icon"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
:global(:root) {
  --rgb-white: 255, 255, 255;
  --rgb-slate-900: 15, 23, 42;
  --rgb-slate-400: 148, 163, 184;
  --rgb-sky-400: 56, 189, 248;
  --rgb-cyan-300: 103, 232, 249;
  --rgb-cyan-400: 34, 211, 238;
  --rgb-teal-400: 45, 212, 191;
  --rgb-blue-400: 96, 165, 250;
  --rgb-blue-600: 37, 99, 235;
  --rgb-indigo-400: 129, 140, 248;
  --rgb-violet-400: 192, 132, 252;
  --rgb-violet-600: 124, 58, 237;
  --rgb-pink-300: 249, 168, 212;
  --rgb-pink-400: 244, 114, 182;
  --rgb-pink-500: 236, 72, 153;
  --rgb-pink-700: 217, 70, 239;
  --rgb-rose-400: 251, 113, 133;

  --color-white: rgb(var(--rgb-white));
  --color-slate-900: rgb(var(--rgb-slate-900));
  --color-slate-400: rgb(var(--rgb-slate-400));
  --color-sky-400: rgb(var(--rgb-sky-400));
  --color-cyan-300: rgb(var(--rgb-cyan-300));
  --color-teal-400: rgb(var(--rgb-teal-400));
  --color-violet-400: rgb(var(--rgb-violet-400));
  --color-violet-600: rgb(var(--rgb-violet-600));
  --color-pink-300: rgb(var(--rgb-pink-300));
  --color-pink-500: rgb(var(--rgb-pink-500));
  --color-rose-400: rgb(var(--rgb-rose-400));
  --color-ink-strong: #070816;
  --color-ink-deep: #140b2d;
  --color-ink-panel: #090c1c;
  --color-ink-footer: #080d1f;
  --color-ink-card: #0a1024;
  --color-ink-code: #070c1b;
  --color-slate-300: #cbd5e1;
  --color-text-bright: #e6eef8;
  --color-surface-bright: #f8fbff;
  --color-cyan-500: #06b6d4;

  --color-text: var(--color-text-bright);
  --color-text-muted: var(--color-slate-400);
  --color-text-soft: rgba(230, 238, 248, 0.82);
  --color-bg-accent: rgba(var(--rgb-teal-400), 0.22);
  --color-bg-glow: rgba(var(--rgb-pink-700), 0.18);
  --color-bg-start: var(--color-ink-strong);
  --color-bg-end: var(--color-ink-deep);
  --color-accent: var(--color-teal-400);
  --color-heading-glow: rgba(var(--rgb-cyan-400), 0.28);
  --color-heading-start: var(--color-cyan-300);
  --color-heading-mid: var(--color-violet-400);
  --color-heading-end: var(--color-pink-300);
  --color-heading-echo: rgba(var(--rgb-pink-500), 0.2);
  --color-heading-sheen: rgba(var(--rgb-white), 0.28);
  --color-panel-border: rgba(var(--rgb-blue-400), 0.22);
  --color-panel-bg: rgba(9, 12, 28, 0.66);
  --color-panel-shadow: rgba(var(--rgb-slate-900), 0.52);
  --color-panel-highlight: rgba(var(--rgb-pink-400), 0.12);
  --color-cell-bg: rgba(var(--rgb-slate-900), 0.88);
  --color-cell-border: rgba(var(--rgb-sky-400), 0.18);
  --color-cell-text: var(--color-slate-300);
  --color-cell-active-start: var(--color-cyan-500);
  --color-cell-active-mid: var(--color-violet-600);
  --color-cell-active-end: var(--color-pink-500);
  --color-cell-active-text: var(--color-surface-bright);
  --color-cell-glow: rgba(var(--rgb-pink-500), 0.3);
  --color-cell-hover-shadow: rgba(var(--rgb-sky-400), 0.18);
  --color-focus-outline: rgba(var(--rgb-teal-400), 0.5);
  --color-results-divider: rgba(var(--rgb-slate-400), 0.14);
  --color-selection-bg: rgba(var(--rgb-pink-500), 0.35);
  --color-selection-text: var(--color-surface-bright);
  --color-footer-border: rgba(var(--rgb-cyan-300), 0.16);
  --color-footer-bg: rgba(8, 13, 31, 0.5);
  --color-footer-shadow: rgba(var(--rgb-slate-900), 0.36);
  --color-footer-heart-bg: rgba(var(--rgb-pink-500), 0.16);
  --color-footer-heart: var(--color-rose-400);
  --color-footer-link: var(--color-cyan-300);
  --color-footer-link-hover: var(--color-violet-400);
  --color-doc-card-border: rgba(var(--rgb-indigo-400), 0.24);
  --color-doc-card-bg: rgba(10, 16, 36, 0.72);
  --color-doc-card-shadow: rgba(var(--rgb-slate-900), 0.38);
  --color-code-bg: rgba(7, 12, 27, 0.92);
  --color-code-border: rgba(var(--rgb-cyan-300), 0.14);
  --color-inline-code-bg: rgba(var(--rgb-cyan-300), 0.1);
  --color-inline-code-border: rgba(var(--rgb-cyan-300), 0.18);
  --color-inline-code-text: rgba(248, 251, 255, 0.96);
  --color-lede-border: rgba(var(--rgb-cyan-300), 0.18);
  --color-lede-bg: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04),
    rgba(10, 16, 36, 0.48)
  );
  --color-lede-shadow: rgba(var(--rgb-slate-900), 0.3);
  --color-lede-pill-bg: rgba(7, 12, 27, 0.72);
  --color-lede-pill-border: rgba(var(--rgb-sky-400), 0.18);
  --color-lede-pill-text: var(--color-slate-300);
  --color-nav-bg: rgba(8, 13, 31, 0.44);
  --color-nav-border: rgba(var(--rgb-cyan-300), 0.16);
  --color-nav-shadow: rgba(var(--rgb-slate-900), 0.28);
  --color-nav-link-bg: rgba(255, 255, 255, 0.04);
  --color-nav-link-border: rgba(var(--rgb-cyan-300), 0.14);
  --color-nav-social-bg: rgba(255, 255, 255, 0.04);

  font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: var(--color-text);
  background:
    radial-gradient(circle at top, var(--color-bg-accent), transparent 28%),
    radial-gradient(circle at 80% 20%, var(--color-bg-glow), transparent 24%),
    linear-gradient(180deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  min-height: 100dvh;
  background: transparent;
  overflow-x: hidden;
}

:global(html) {
  scroll-behavior: smooth;
  overflow-x: hidden;
}

:global(button),
:global(input),
:global(textarea),
:global(select) {
  font: inherit;
}

:global(#app) {
  min-height: 100dvh;
  overflow-x: clip;
}

:global(::selection) {
  background: var(--color-selection-bg);
  color: var(--color-selection-text);
}

.page {
  position: relative;
  width: min(960px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 3rem 0 4rem;
}

.page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.8) 18%,
    rgba(0, 0, 0, 0.2) 100%
  );
  opacity: 0.22;
}

.top-stage {
  position: relative;
  margin-bottom: 0;
  padding: 1.1rem 1rem 2.9rem;
  isolation: isolate;
}

.top-stage::before {
  content: '';
  position: absolute;
  inset: 0.2rem -1.6rem 0;
  background:
    radial-gradient(
      circle at 50% 8%,
      rgba(var(--rgb-cyan-300), 0.08),
      transparent 26%
    ),
    radial-gradient(
      circle at 50% 42%,
      rgba(var(--rgb-pink-400), 0.07),
      transparent 40%
    );
  filter: blur(22px);
  opacity: 0.95;
  mask-image: radial-gradient(
    circle at 50% 38%,
    rgba(0, 0, 0, 0.95) 0%,
    rgba(0, 0, 0, 0.72) 40%,
    transparent 78%
  );
  z-index: -1;
}

.top-stage__content {
  position: relative;
  z-index: 1;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto 2rem;
  padding: 0.8rem 0.9rem 0.8rem 1rem;
  border: 1px solid var(--color-nav-border);
  border-radius: 1.4rem;
  background:
    linear-gradient(120deg, rgba(var(--rgb-cyan-300), 0.08), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 70%),
    var(--color-nav-bg);
  box-shadow:
    0 18px 42px var(--color-nav-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(18px);
}

.site-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  color: var(--color-text-bright);
  text-decoration: none;
}

.site-header__brand-mark {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgba(var(--rgb-cyan-300), 0.2);
  border-radius: 0.9rem;
  background: linear-gradient(
    135deg,
    rgba(var(--rgb-cyan-300), 0.22),
    rgba(var(--rgb-pink-400), 0.16)
  );
  color: var(--color-text-bright);
  box-shadow:
    0 0 18px rgba(var(--rgb-cyan-300), 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.site-header__brand-mark :deep(svg) {
  width: 1.15rem;
  height: 1.15rem;
  position: relative;
  top: 1px;
  left: 1px;
}

.site-header__brand-copy {
  display: grid;
  gap: 0.08rem;
  min-width: 0;
}

.site-header__brand-label {
  font-family: 'Oxanium', 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--color-text-bright);
}

.site-header__brand-subtitle {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.site-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.site-nav__link {
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
  min-height: 2.4rem;
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--color-nav-link-border);
  border-radius: 999px;
  background: var(--color-nav-link-bg);
  color: var(--color-text-bright);
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition:
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease,
    color 220ms ease;
}

.site-nav__link:hover {
  border-color: rgba(var(--rgb-cyan-300), 0.26);
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    0 10px 24px rgba(var(--rgb-slate-900), 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.site-nav__link--sponsor {
  background: linear-gradient(
    135deg,
    rgba(var(--rgb-cyan-300), 0.12),
    rgba(var(--rgb-pink-400), 0.1)
  );
}

.site-nav__link-icon,
.site-nav__social-icon {
  width: 1rem;
  height: 1rem;
  font-size: 1rem;
  flex: 0 0 auto;
}

.site-nav__socials {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: 0.15rem;
  padding: 0.2rem 0.25rem 0.2rem 0.35rem;
  border: 1px solid var(--color-nav-link-border);
  border-radius: 999px;
  background: rgba(7, 12, 27, 0.42);
}

.site-nav__social {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  color: var(--color-text-soft);
  text-decoration: none;
  background: var(--color-nav-social-bg);
  transition:
    color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease;
}

.site-nav__social:hover {
  color: var(--color-text-bright);
  background: rgba(var(--rgb-cyan-300), 0.14);
  box-shadow:
    0 0 0 1px rgba(var(--rgb-cyan-300), 0.14),
    0 0 18px rgba(var(--rgb-cyan-300), 0.12);
}

.site-nav__link:focus-visible,
.site-nav__social:focus-visible,
.site-header__brand:focus-visible {
  outline: 2px solid var(--color-focus-outline);
  outline-offset: 4px;
}

.hero {
  position: relative;
  margin-bottom: 0;
  padding-top: 1rem;
  z-index: 2;
  text-align: center;
}

.hero-eyebrow {
  display: inline-block;
  margin: 0 0 0.8rem;
  padding: 0.42rem 0.8rem 0.38rem;
  border: 1px solid rgba(var(--rgb-cyan-300), 0.18);
  border-radius: 999px;
  background:
    linear-gradient(
      135deg,
      rgba(var(--rgb-cyan-300), 0.14),
      rgba(var(--rgb-pink-400), 0.12)
    ),
    rgba(7, 12, 27, 0.58);
  box-shadow:
    0 10px 24px rgba(var(--rgb-slate-900), 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--color-heading-start);
  backdrop-filter: blur(5px);
}

.hero h1,
.panel h2,
.doc-step h3 {
  font-family: 'Oxanium', 'Space Grotesk', sans-serif;
  font-weight: 700;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.4rem, 6vw, 4.5rem);
  line-height: 1.02;
  font-weight: 800;
}

.hero-title {
  position: relative;
  display: inline-grid;
  isolation: isolate;
  padding-bottom: 0.18em;
  line-height: 1.08;
  overflow: visible;
  text-wrap: balance;
}

.hero-title::before,
.hero-title::after,
.hero-title span {
  grid-area: 1 / 1;
  text-wrap: balance;
}

.hero-title::before {
  content: attr(data-text);
  color: var(--color-heading-echo);
  transform: translate(0.06em, 0.06em);
  filter: blur(10px);
  pointer-events: none;
  user-select: none;
  z-index: -2;
}

.hero-title::after {
  content: attr(data-text);
  color: transparent;
  background:
    linear-gradient(
      115deg,
      transparent 0%,
      transparent 38%,
      var(--color-heading-sheen) 50%,
      transparent 62%,
      transparent 100%
    ),
    repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.14) 0,
      rgba(255, 255, 255, 0.14) 1px,
      transparent 1px,
      transparent 5px
    );
  background-clip: text;
  -webkit-background-clip: text;
  opacity: 0.5;
  mix-blend-mode: screen;
  pointer-events: none;
  user-select: none;
  z-index: 1;
}

.hero-title span {
  color: transparent;
  background: linear-gradient(
    135deg,
    var(--color-heading-start) 0%,
    var(--color-heading-mid) 48%,
    var(--color-heading-end) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 0 18px var(--color-heading-glow),
    0 0 36px rgba(124, 58, 237, 0.18);
}

.hero-title span::selection {
  color: var(--color-selection-text);
  background: var(--color-selection-bg);
  -webkit-text-fill-color: var(--color-selection-text);
}

.lede-block {
  position: relative;
  display: grid;
  width: min(46rem, 100%);
  margin-top: 1.1rem;
  margin-inline: auto;
  padding: 1rem 1.1rem 1.05rem;
  border: 1px solid var(--color-lede-border);
  border-radius: 1.2rem;
  background: var(--color-lede-bg);
  box-shadow:
    0 14px 36px var(--color-lede-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(14px);
}

.lede {
  width: min(40rem, 100%);
  margin: 0;
  font-size: 1.05rem;
  font-weight: 500;
  line-height: 1.65;
  color: rgba(230, 238, 248, 0.9);
}

.panel {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border: 1px solid var(--color-panel-border);
  border-radius: 1.5rem;
  background:
    linear-gradient(180deg, var(--color-panel-highlight), transparent 28%),
    var(--color-panel-bg);
  backdrop-filter: blur(18px);
  box-shadow:
    0 24px 60px var(--color-panel-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.panel--demo {
  position: relative;
  z-index: 1;
  margin-top: 0;
  padding-top: 2.7rem;
}

.panel--demo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1.1rem;
  right: 1.1rem;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(var(--rgb-cyan-300), 0.18),
    rgba(var(--rgb-pink-400), 0.08)
  );
  opacity: 0.7;
}

.section-heading {
  margin-bottom: 1.25rem;
}

.section-kicker {
  margin: 0 0 0.45rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.section-copy {
  width: min(40rem, 100%);
  margin: 0.65rem 0 0;
  color: var(--color-text-soft);
}

.grid {
  display: grid;
  gap: 0.75rem;
}

.cell {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1 / 1;
  min-height: 7rem;
  padding: 0.8rem;
  border: 1px solid var(--color-cell-border);
  border-radius: 1rem;
  background: var(--color-cell-bg);
  color: var(--color-cell-text);
  cursor: pointer;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease,
    border-color 140ms ease;
  appearance: none;
  text-align: left;
  backdrop-filter: blur(10px);
}

.cell--active {
  border-color: rgba(255, 255, 255, 0.18);
  background: linear-gradient(
    135deg,
    var(--color-cell-active-start) 0%,
    var(--color-cell-active-mid) 52%,
    var(--color-cell-active-end) 100%
  );
  color: var(--color-cell-active-text);
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 24px var(--color-cell-glow),
    0 16px 36px rgba(37, 99, 235, 0.24);
}

.cell:hover {
  box-shadow:
    0 16px 30px var(--color-cell-hover-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.cell:focus-visible {
  outline: 3px solid var(--color-focus-outline);
  outline-offset: 2px;
}

.road-glyph {
  font-family:
    'SFMono-Regular', 'SF Mono', 'Cascadia Mono', 'Roboto Mono', monospace;
  font-size: 3.25rem;
  line-height: 1;
  letter-spacing: -0.08em;
}

.coord {
  position: absolute;
  top: 0.65rem;
  left: 0.75rem;
  font-size: 0.75rem;
  opacity: 0.75;
  color: var(--color-text-muted);
}

.cell--active .coord {
  opacity: 1;
  font-weight: 700;
  color: rgba(248, 251, 255, 0.96);
  text-shadow:
    0 1px 2px rgba(7, 8, 22, 0.13),
    0 0 12px rgba(7, 8, 22, 0.28);
}

.docs-stack {
  display: grid;
  gap: 1.15rem;
}

.docs {
  scroll-margin-top: 1.25rem;
}

.intro-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.intro-card {
  padding: 1.15rem;
  border: 1px solid var(--color-doc-card-border);
  border-radius: 1.15rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 24%),
    var(--color-doc-card-bg);
  box-shadow:
    0 18px 38px var(--color-doc-card-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.intro-card h3 {
  margin: 0;
  font-family: 'Oxanium', 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  line-height: 1.2;
}

.intro-card p {
  margin: 0.8rem 0 0;
  color: var(--color-text-soft);
  line-height: 1.68;
}

.intro-spotlight {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  padding: 1.15rem 1.25rem;
  border: 1px solid rgba(var(--rgb-cyan-300), 0.2);
  border-radius: 1.15rem;
  background:
    linear-gradient(135deg, rgba(var(--rgb-cyan-300), 0.08), transparent 45%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 30%),
    rgba(7, 12, 27, 0.7);
  box-shadow:
    0 18px 38px rgba(var(--rgb-slate-900), 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.intro-spotlight__copy h3 {
  margin: 0;
  font-family: 'Oxanium', 'Space Grotesk', sans-serif;
  font-size: 1.15rem;
  line-height: 1.2;
}

.intro-spotlight__copy p:last-child {
  margin: 0.6rem 0 0;
  color: var(--color-text-soft);
  line-height: 1.68;
}

.intro-spotlight__highlight {
  color: #fff;
  font-weight: bold;
}

.intro-spotlight__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.9rem;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(var(--rgb-cyan-300), 0.22);
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    rgba(var(--rgb-cyan-300), 0.16),
    rgba(var(--rgb-pink-400), 0.14)
  );
  color: var(--color-text-bright);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  white-space: nowrap;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.intro-spotlight__link:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--rgb-cyan-300), 0.34);
  box-shadow:
    0 10px 24px rgba(var(--rgb-cyan-300), 0.12),
    0 0 24px rgba(var(--rgb-pink-500), 0.12);
}

.intro-spotlight__link:focus-visible {
  outline: 2px solid var(--color-focus-outline);
  outline-offset: 4px;
}

.intro-spotlight__link :deep(svg) {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
}

.doc-step {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  min-width: 0;
  padding: 1.15rem;
  border: 1px solid var(--color-doc-card-border);
  border-radius: 1.15rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 24%),
    var(--color-doc-card-bg);
  box-shadow:
    0 18px 38px var(--color-doc-card-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.doc-step__marker {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgba(103, 232, 249, 0.22);
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    rgba(6, 182, 212, 0.26),
    rgba(236, 72, 153, 0.24)
  );
  color: var(--color-cell-active-text);
  font-family: 'Oxanium', 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  box-shadow:
    0 0 20px rgba(34, 211, 238, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.doc-step__body {
  min-width: 0;
}

.doc-card__eyebrow {
  margin: 0 0 0.45rem;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-heading-start);
}

.doc-step h3 {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.15;
}

.doc-step p:not(.doc-card__eyebrow) {
  margin: 2rem 0 0;
  color: var(--color-text-soft);
  line-height: 1.68;
}

.doc-note {
  font-size: 0.95rem;
  margin-top: 1rem;
}

code {
  font-family:
    'SFMono-Regular', 'SF Mono', 'Cascadia Mono', 'Roboto Mono', monospace;
}

p code {
  display: inline-block;
  padding: 0.12rem 0.42rem;
  border: 1px solid var(--color-inline-code-border);
  border-radius: 0.45rem;
  background:
    linear-gradient(180deg, rgba(var(--rgb-white), 0.05), transparent),
    var(--color-inline-code-bg);
  color: var(--color-inline-code-text);
  font-size: 0.92em;
  font-weight: 700;
  line-height: 1.2;
  box-shadow:
    inset 0 1px 0 rgba(var(--rgb-white), 0.04),
    0 0 0 1px rgba(7, 12, 27, 0.08);
}

.footer {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 1.75rem;
}

.footer__badge {
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  background: var(--color-footer-heart-bg);
  color: var(--color-footer-heart);
  box-shadow:
    0 0 22px rgba(251, 113, 133, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.footer__badge--sponsor {
  background: rgba(var(--rgb-cyan-300), 0.12);
  color: var(--color-cyan-300);
  box-shadow:
    0 0 22px rgba(var(--rgb-cyan-300), 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.footer-badge__icon,
.footer-chip__icon,
.footer-social__icon {
  width: 1rem;
  height: 1rem;
  font-size: 1rem;
}

.footer__copy {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
}

.footer-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.1rem;
  padding: 0.45rem 0.8rem;
  line-height: 1;
  border: 1px solid rgba(var(--rgb-cyan-300), 0.14);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 75%),
    var(--color-footer-bg);
  color: var(--color-text-bright);
  text-decoration: none;
  box-shadow:
    0 16px 36px var(--color-footer-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(18px);
  transition:
    border-color 250ms ease,
    background 250ms ease,
    transform 250ms ease,
    box-shadow 250ms ease;
}

.footer-chip--author {
  padding-right: 1rem;
  color: var(--color-text-muted);
}

.footer-chip:hover {
  border-color: rgba(var(--rgb-cyan-300), 0.26);
  background: rgba(255, 255, 255, 0.06);
  box-shadow:
    0 12px 24px rgba(var(--rgb-slate-900), 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.footer-chip:focus-visible,
.footer-social:focus-visible {
  outline: 2px solid var(--color-focus-outline);
  outline-offset: 4px;
}

.footer-chip--socials {
  gap: 0.7rem;
  padding-right: 0.55rem;
}

.footer-chip__icon {
  flex: 0 0 auto;
  color: currentColor;
}

.footer-chip__label {
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.footer-socials {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.footer-social {
  display: inline-grid;
  place-items: center;
  width: 1.95rem;
  height: 1.95rem;
  border-radius: 999px;
  color: var(--color-footer-link);
  text-decoration: none;
  background: rgba(var(--rgb-white), 0.04);
  transition:
    color 250ms ease,
    background 250ms ease,
    box-shadow 250ms ease,
    border-color 250ms ease;
  box-shadow: inset 0 0 0 1px rgba(var(--rgb-cyan-300), 0.06);
}

.footer-social:hover {
  color: var(--color-text-bright);
  background: rgba(var(--rgb-cyan-300), 0.14);
  box-shadow:
    0 0 0 1px rgba(var(--rgb-cyan-300), 0.18),
    0 0 18px rgba(var(--rgb-cyan-300), 0.16);
}

.footer-social__icon {
  flex: 0 0 auto;
  display: block;
}

.footer__label {
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.footer__name {
  color: var(--color-footer-link);
  font-weight: 700;
  text-shadow: 0 0 16px rgba(103, 232, 249, 0.2);
  transition:
    color 250ms ease,
    text-shadow 250ms ease;
}

.footer a {
  color: var(--color-footer-link);
  text-decoration: none;
  font-weight: 700;
  text-shadow: 0 0 16px rgba(103, 232, 249, 0.2);
  transition:
    color 250ms ease,
    text-shadow 250ms ease;
}

.footer-chip--author:hover .footer__name {
  color: var(--color-footer-link-hover);
  text-shadow: 0 0 20px rgba(192, 132, 252, 0.26);
}

.footer-chip,
.footer-social {
  position: static;
}

.footer a:hover {
  color: var(--color-footer-link-hover);
  text-shadow: 0 0 20px rgba(192, 132, 252, 0.26);
}

.footer a:focus-visible {
  outline: 2px solid var(--color-focus-outline);
  outline-offset: 4px;
  border-radius: 0.25rem;
}

@media (max-width: 720px) {
  .page {
    width: min(100% - 1rem, 960px);
    padding-top: 1.5rem;
    padding-bottom: 2rem;
  }

  .site-header {
    width: 100%;
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 1.6rem;
    padding: 0.9rem;
  }

  .site-nav {
    width: 100%;
    justify-content: flex-start;
    gap: 0.65rem;
  }

  .top-stage {
    padding: 0.8rem 0.65rem 4.2rem;
  }

  .panel {
    padding: 1rem;
  }

  .panel--demo {
    margin-top: 1.85rem;
    padding-top: 2.2rem;
  }

  .grid {
    gap: 0.5rem;
  }

  .cell {
    min-height: 4.6rem;
    padding: 0.55rem;
    border-radius: 0.85rem;
  }

  .road-glyph {
    font-size: 2.2rem;
  }

  .coord {
    top: 0.45rem;
    left: 0.55rem;
    font-size: 0.68rem;
  }

  .doc-step {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .intro-grid {
    grid-template-columns: 1fr;
  }

  .intro-spotlight {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .intro-spotlight__link {
    width: 100%;
  }

  .footer {
    display: flex;
    width: 100%;
    border-radius: 1.1rem;
  }
}

@media (max-width: 520px) {
  .top-stage {
    padding-inline: 0.45rem;
    padding-bottom: 3.7rem;
  }

  .site-header {
    margin-bottom: 1.3rem;
    border-radius: 1.15rem;
  }

  .site-header__brand-mark {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.8rem;
  }

  .site-header__brand-label {
    font-size: 0.95rem;
  }

  .site-nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: center;
    gap: 0.55rem;
  }

  .site-nav__link {
    justify-content: center;
    min-height: 2.2rem;
    min-width: 0;
    padding: 0.5rem 0.65rem;
    font-size: 0.8rem;
  }

  .site-nav__socials {
    grid-column: 1 / -1;
    justify-self: center;
    width: auto;
    justify-content: center;
    margin-left: 0;
    padding-inline: 0.3rem;
    gap: 0.3rem;
  }

  .site-nav__social {
    width: 1.9rem;
    height: 1.9rem;
  }

  .hero {
    margin-bottom: 1rem;
  }

  .hero-eyebrow {
    margin-bottom: 0.7rem;
    padding-inline: 0.7rem;
    font-size: 0.69rem;
    letter-spacing: 0.14em;
  }

  .lede-block {
    margin-top: 0.95rem;
    margin-bottom: -1.2rem;
    padding: 0.9rem;
    border-radius: 1rem;
  }

  .lede,
  .section-copy {
    font-size: 0.96rem;
  }

  .panel {
    margin-top: 1rem;
    padding: 0.9rem;
    border-radius: 1.1rem;
  }

  .panel--demo {
    margin-top: -0.35rem;
    padding-top: 1.45rem;
  }

  .grid {
    gap: 0.4rem;
  }

  .cell {
    min-height: 3.95rem;
    padding: 0.45rem;
  }

  .road-glyph {
    font-size: 1.8rem;
  }

  .doc-step {
    padding: 0.95rem;
  }

  .intro-spotlight {
    padding: 1rem;
  }

  .intro-spotlight__copy h3 {
    font-size: 1.05rem;
  }

  .doc-step__marker {
    width: 2rem;
    height: 2rem;
    font-size: 0.88rem;
  }

  .footer {
    gap: 0.7rem;
    margin-top: 1.25rem;
    padding: 0.8rem 0.95rem;
  }
}
</style>
