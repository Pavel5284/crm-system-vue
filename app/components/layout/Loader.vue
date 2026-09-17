<template>
  <div class="loader-wrapper bg-background">
    <NuxtImg src="/loader.svg" alt="loader" width="200"/>
  </div>
</template>

<style scoped>
.loader-wrapper {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>