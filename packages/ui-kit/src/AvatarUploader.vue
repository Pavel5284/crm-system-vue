<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { readFileAsDataUrl, validateAvatarFile } from './avatar'

export interface AvatarUploaderLabels {
  upload: string
  remove: string
  fileTooLarge: string
  onlyImage: string
  readError: string
}

// Презентационный загрузчик аватара для host и remotes.
// Без i18n внутри: подписи — пропсом `labels` (дефолт — английский).
// Иконка кнопки — скоупед-слот `icon` ({ saving: boolean }):
// host кладёт Nuxt-<Icon>, remote — lucide.
const props = withDefaults(defineProps<{
  modelValue?: string | null
  initials?: string
  size?: number
  labels?: Partial<AvatarUploaderLabels>
}>(), {
  modelValue: null,
  initials: '?',
  size: 112,
  labels: () => ({}),
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void
  (e: 'upload', v: string): void
  (e: 'remove'): void
}>()

const isSaving = defineModel<boolean>('saving', { default: false })

const preview = ref<string | null>(props.modelValue ?? null)
watch(() => props.modelValue, v => preview.value = v)

const errorRef = ref('')

const text = computed<AvatarUploaderLabels>(() => ({
  upload: props.labels?.upload ?? 'Upload avatar',
  remove: props.labels?.remove ?? 'Remove avatar',
  fileTooLarge: props.labels?.fileTooLarge ?? 'File up to 2MB',
  onlyImage: props.labels?.onlyImage ?? 'Only image',
  readError: props.labels?.readError ?? 'Failed to read file',
}))

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const problem = validateAvatarFile(file)
  if (problem === 'tooLarge') {
    errorRef.value = text.value.fileTooLarge
    return
  }
  if (problem === 'notImage') {
    errorRef.value = text.value.onlyImage
    return
  }
  try {
    const dataUrl = await readFileAsDataUrl(file)
    preview.value = dataUrl
    emit('update:modelValue', dataUrl)
    emit('upload', dataUrl)
    input.value = ''
  } catch {
    errorRef.value = text.value.readError
  }
}

const onRemove = () => {
  preview.value = null
  emit('update:modelValue', null)
  emit('remove')
}
</script>

<template>
  <div class="flex flex-col items-center gap-3 shrink-0">
    <div class="relative">
      <img
        v-if="preview"
        :src="preview"
        alt="avatar"
        class="rounded-full object-cover border-2 border-border"
        :style="{ width: size + 'px', height: size + 'px' }"
      />
      <div v-else class="rounded-full bg-primary text-primary-foreground grid place-items-center font-bold border-2 border-border" :style="{ width: size + 'px', height: size + 'px', fontSize: size/3.5 + 'px' }">
        {{ initials }}
      </div>
      <label :class="['absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center cursor-pointer shadow hover:opacity-90 transition-opacity', isSaving && 'opacity-50 pointer-events-none']" :title="text.upload">
        <slot name="icon" :saving="!!isSaving" />
        <input type="file" accept="image/*" class="hidden" @change="onFileChange" :disabled="isSaving" />
      </label>
    </div>
    <button v-if="preview" type="button" class="text-xs text-red-500 hover:underline disabled:opacity-50" :disabled="isSaving" @click="onRemove">{{ text.remove }}</button>
    <p v-if="errorRef" class="text-red-500 text-xs">{{ errorRef }}</p>
  </div>
</template>
