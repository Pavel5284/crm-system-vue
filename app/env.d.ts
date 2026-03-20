interface ImportMetaEnv {
  readonly NUXT_PUBLIC_APPWRITE_PROJECT_ID: string
  readonly NUXT_PUBLIC_APPWRITE_PROJECT_NAME: string
  readonly NUXT_PUBLIC_APPWRITE_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
