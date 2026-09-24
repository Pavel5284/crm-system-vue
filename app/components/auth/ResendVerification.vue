<script setup lang="ts">
import {useResendVerification} from "~/composables/auth/useResendVerification.ts";

const props = defineProps<{
  email: string
}>()

const emit = defineEmits<{
  (e: 'resent', message: string): void
}>()

const { t } = useI18n()
const { resend, isPending, cooldown, serverError } = useResendVerification()

const onResend = async () => {
  if (!props.email.trim()) return
  try {
    const res = await resend(props.email)
    if (res) emit('resent', res.message)
  }
  catch {
    // текст уже в serverError
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <p class="text-sm text-center text-muted-foreground">{{ t('register.resendQuestion') }}</p>
    <p v-if="serverError" class="text-red-500 text-sm text-center">{{ serverError }}</p>
    <UiButton type="button" variant="outline" :disabled="cooldown > 0 || isPending" @click="onResend">
      {{ cooldown > 0 ? t('register.resendCooldown', { s: cooldown }) : t('register.resendButton') }}
    </UiButton>
    <NuxtLink to="/login" class="text-sm text-muted-foreground hover:text-white">
      {{ t('register.goToLogin') }}
    </NuxtLink>
  </div>
</template>
