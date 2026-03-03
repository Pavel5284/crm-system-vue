<script lang="ts" setup>
</script>

<template>
  <aside class="px-5 py-8 bg-gray-800 h-full relative text-white">
    <div class="mb-10 flex justify-center">
      <NuxtLink to="/" >
        <NuxtImg src="/logo.svg" alt="logo" width="100px" />
      </NuxtLink>
    </div>

    <button class="absolute top-2 right-3 transition-colors hover:text-primary">
      <Icon name="line-md:logout" size="22"/>
    </button>
    <LayoutMenu/>
  </aside>
</template>
