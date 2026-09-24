<template>
  <div class="flex items-center justify-center min-h-screen w-full">
    <div class="rounded bg-sidebar w-full max-w-md mx-4 p-5">
      <div class="flex justify-end mb-2">
        <LayoutLangSwitcher />
      </div>
      <h1 class="text-2xl font-bold text-center mb-5">
        <slot name="title" />
      </h1>
      <slot />
    </div>
  </div>
</template>
