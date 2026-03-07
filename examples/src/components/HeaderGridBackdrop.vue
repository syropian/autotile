<template>
  <div class="grid-backdrop" aria-hidden="true">
    <div class="grid-backdrop__glow grid-backdrop__glow--left"></div>
    <div class="grid-backdrop__glow grid-backdrop__glow--right"></div>
    <div class="grid-backdrop__plane"></div>
  </div>
</template>

<style scoped>
.grid-backdrop {
  scale: 2;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.88;
  mask-image: radial-gradient(
    circle at 50% 42%,
    rgba(0, 0, 0, 0.95) 0%,
    rgba(0, 0, 0, 0.82) 38%,
    transparent 78%
  );
}

.grid-backdrop__glow,
.grid-backdrop__plane {
  position: absolute;
  inset: auto;
}

.grid-backdrop__glow {
  top: 8%;
  width: 38%;
  height: 58%;
  border-radius: 999px;
  filter: blur(56px);
  opacity: 0.34;
  animation: glow-drift 12s ease-in-out infinite alternate;
}

.grid-backdrop__glow--left {
  left: -6%;
  background: radial-gradient(
    circle,
    rgba(34, 211, 238, 0.34) 0%,
    rgba(34, 211, 238, 0) 72%
  );
}

.grid-backdrop__glow--right {
  right: -4%;
  top: 14%;
  background: radial-gradient(
    circle,
    rgba(236, 72, 153, 0.28) 0%,
    rgba(236, 72, 153, 0) 72%
  );
  animation-duration: 15s;
}

.grid-backdrop__plane {
  left: -20%;
  right: -20%;
  bottom: -12%;
  height: 74%;
  border-top: 1px solid rgba(103, 232, 249, 0.16);
  transform-origin: center top;
  transform: perspective(780px) rotateX(74deg);
  background-image:
    linear-gradient(rgba(103, 232, 249, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(103, 232, 249, 0.18) 1px, transparent 1px);
  background-size:
    100% 28px,
    44px 100%;
  background-position:
    center top,
    center top;
  mask-image: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.96),
    rgba(0, 0, 0, 0.22) 62%,
    transparent
  );
  box-shadow:
    0 -10px 28px rgba(34, 211, 238, 0.06),
    inset 0 12px 30px rgba(168, 85, 247, 0.08);
  animation: grid-scroll 9s linear infinite;
}

@keyframes grid-scroll {
  from {
    background-position:
      center 0,
      center 0;
  }

  to {
    background-position:
      center 28px,
      center 0;
  }
}

@keyframes glow-drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }

  to {
    transform: translate3d(0, 12px, 0) scale(1.08);
  }
}

@media (max-width: 720px) {
  .grid-backdrop {
    transform: translateY(-2.5rem);
  }

  .grid-backdrop__glow {
    width: 52%;
    height: 44%;
    filter: blur(46px);
  }

  .grid-backdrop__plane {
    left: -30%;
    right: -30%;
    bottom: -16%;
    height: 66%;
    background-size:
      100% 22px,
      32px 100%;
  }
}
</style>
