<script lang="ts" setup>
import { getApiErrorMessage } from '~/utils/api'
import { updateCustomerApi } from '~/utils/crm.api'

const props = defineProps<{
  refetch: () => void
}>()

const store = useCustomerSlideStore()

const isLocalOpen = computed({
  get: () => store.isOpen,
  set: value => {
    store.isOpen = value
  }
})

const nameRef = ref('')
const emailRef = ref('')
const avatarUrlRef = ref('')
const fromSourceRef = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

watch(() => store.customer, (customer) => {
  if (!customer) return
  nameRef.value = customer.name
  emailRef.value = customer.email
  avatarUrlRef.value = customer.avatarUrl || ''
  fromSourceRef.value = customer.fromSource ?? ''
}, { immediate: true })

const isSaving = ref(false)
const errorRef = ref('')

function onAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errorRef.value = 'Выберите изображение (png, jpg, webp, gif)'
    input.value = ''
    return
  }

  const MAX_BYTES = 2 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    errorRef.value = 'Файл слишком большой — максимум 2MB'
    input.value = ''
    return
  }

  errorRef.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    avatarUrlRef.value = reader.result as string
  }
  reader.onerror = () => {
    errorRef.value = 'Не удалось прочитать файл'
  }
  reader.readAsDataURL(file)
}

function clearAvatar() {
  avatarUrlRef.value = ''
  errorRef.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function onSave() {
  if (!store.customer) return
  errorRef.value = ''
  isSaving.value = true
  try {
    await updateCustomerApi(store.customer.id, {
      name: nameRef.value,
      email: emailRef.value,
      avatarUrl: avatarUrlRef.value,
      fromSource: fromSourceRef.value || null,
    })
    await props.refetch()
    store.clear()
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="isLocalOpen"
    side="right"
    title="О клиенте"
    description="Редактирование клиента"
  >
    <template #body>
      <div class="mb-5 flex flex-col items-center gap-3">
        <div
            class="w-[96px] h-[96px] rounded-full overflow-hidden bg-[#1a2332] border border-[#161c26] flex items-center justify-center shrink-0"
        >
          <img
              v-if="avatarUrlRef"
              :src="avatarUrlRef"
              alt="Аватар клиента"
              width="96"
              height="96"
              class="w-full h-full object-cover"
          />
          <Icon v-else name="lucide:user" size="40" class="text-slate-500" />
        </div>

        <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            class="hidden"
            @change="onAvatarFileChange"
        />

        <div class="flex items-center gap-2">
          <UiButton type="button" size="sm" variant="outline" @click="fileInputRef?.click()">
            Загрузить изображение
          </UiButton>
          <UiButton
              v-if="avatarUrlRef"
              type="button"
              size="sm"
              variant="ghost"
              class="text-muted-foreground"
              @click="clearAvatar"
          >
            Удалить
          </UiButton>
        </div>
        <p class="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF до 2MB</p>
      </div>

      <div class="space-y-3">
        <UiInput placeholder="Наименование" type="text" class="input" v-model="nameRef"/>
        <UiInput placeholder="Email" type="email" class="input" v-model="emailRef"/>
        <UiInput placeholder="Откуда пришёл" type="text" class="input" v-model="fromSourceRef"/>
      </div>

      <p v-if="errorRef" class="text-red-500 text-sm mt-3">{{ errorRef }}</p>

      <div class="flex items-center gap-3 mt-5">
        <UiButton type="button" :disabled="isSaving" @click="onSave">
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </UiButton>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.input {
  border: 1px solid #161c26;
}
.input::placeholder {
  color: #748092;
}
</style>
