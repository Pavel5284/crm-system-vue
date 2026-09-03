<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string | null
  initials?: string
  size?: number
}>(), {
  modelValue: null,
  initials: '?',
  size: 112,
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

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    errorRef.value = 'Фото до 2MB'
    return
  }
  if (!file.type.startsWith('image/')) {
    errorRef.value = 'Только изображения'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = String(reader.result)
    preview.value = dataUrl
    emit('update:modelValue', dataUrl)
    emit('upload', dataUrl)
    ;(e.target as HTMLInputElement).value = ''
  }
  reader.onerror = () => { errorRef.value = 'Не удалось прочитать файл' }
  reader.readAsDataURL(file)
}

const onRemove = () => {
  preview.value = null
  emit('update:modelValue', null)
  emit('remove')
}

defineExpose({ errorRef })
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
      <label :class="['absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center cursor-pointer shadow hover:opacity-90 transition-opacity', isSaving && 'opacity-50 pointer-events-none']" title="Загрузить фото">
        <Icon :name="isSaving ? 'lucide:loader-2' : 'lucide:camera'" size="16" :class="isSaving && 'animate-spin'" />
        <input type="file" accept="image/*" class="hidden" @change="onFileChange" :disabled="isSaving" />
      </label>
    </div>
    <button v-if="preview" type="button" class="text-xs text-red-500 hover:underline disabled:opacity-50" :disabled="isSaving" @click="onRemove">Удалить фото</button>
    <p v-if="errorRef" class="text-red-500 text-xs">{{ errorRef }}</p>
  </div>
</template>
