import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')

function patchPinia() {
  const target = join(root, 'node_modules/@pinia/nuxt/dist/runtime/plugin.js')
  if (!existsSync(target)) {
    console.warn('[apply-patches] pinia plugin not found, skipping')
    return
  }
  const content = readFileSync(target, 'utf-8')
  if (content.includes('if (!pinia) return;')) {
    console.log('[apply-patches] pinia plugin already patched')
    return
  }
  const patched = `import { createPinia, setActivePinia } from "pinia";
import { defineNuxtPlugin, useNuxtApp } from "#app";
import { toRaw } from "vue";
const plugin = defineNuxtPlugin({
  name: "pinia",
  setup(nuxtApp) {
    const pinia = createPinia();
    nuxtApp.vueApp.use(pinia);
    setActivePinia(pinia);
    if (nuxtApp.payload && nuxtApp.payload.pinia) {
      pinia.state.value = nuxtApp.payload.pinia;
    }
    return {
      provide: {
        pinia
      }
    };
  },
  hooks: {
    "app:rendered"() {
      const nuxtApp = useNuxtApp();
      const pinia = nuxtApp.$pinia;
      if (!pinia) return;
      const raw = toRaw(pinia);
      if (!raw || !raw.state) return;
      nuxtApp.payload.pinia = raw.state.value;
      setActivePinia(void 0);
    }
  }
});
export default plugin;
`
  writeFileSync(target, patched)
  console.log('[apply-patches] pinia plugin patched')
}

function patchNuxtQuery() {
  const target = join(root, 'node_modules/@peterbud/nuxt-query/dist/runtime/plugin.js')
  if (!existsSync(target)) {
    console.warn('[apply-patches] nuxt-query plugin not found, skipping')
    return
  }
  const content = readFileSync(target, 'utf-8')
  if (content.includes('if (vueQueryState.value)')) {
    console.log('[apply-patches] nuxt-query plugin already patched')
    return
  }
  const patched = `import { QueryClient, VueQueryPlugin, dehydrate, hydrate } from "@tanstack/vue-query";
import { defineNuxtPlugin, useRuntimeConfig, useState } from "#app";
export default defineNuxtPlugin({
  name: "nuxt-query:plugin",
  async setup(nuxtApp) {
    const queryClientOptions = useRuntimeConfig().public.nuxtQuery?.queryClientOptions;
    let queryClient;
    let options;
    const getPluginOptions = (queryClientParam) => {
      queryClient = queryClientParam ?? new QueryClient(queryClientOptions);
      options = {
        queryClient
      };
    };
    await nuxtApp.callHook("nuxt-query:configure", getPluginOptions);
    if (!queryClient)
      queryClient = new QueryClient(queryClientOptions);
    if (!options)
      options = {
        queryClient,
        enableDevtoolsV6Plugin: true
      };
    nuxtApp.vueApp.use(VueQueryPlugin, options);
    const vueQueryState = useState("vue-query-state");
    if (import.meta.server) {
      nuxtApp.hooks.hook("app:rendered", () => {
        try {
          if (queryClient) vueQueryState.value = dehydrate(queryClient);
        } catch (e) {
          console.warn("[nuxt-query] dehydrate failed:", e);
        }
      });
    }
    if (import.meta.client) {
      if (vueQueryState.value) {
        try {
          hydrate(queryClient, vueQueryState.value);
        } catch (e) {
          console.warn("[nuxt-query] hydrate failed:", e);
        }
      }
    }
    return {
      provide: {
        queryClient
      }
    };
  }
});
`
  writeFileSync(target, patched)
  console.log('[apply-patches] nuxt-query plugin patched')
}

patchPinia()
patchNuxtQuery()
