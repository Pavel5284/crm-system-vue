<script setup lang="ts">
defineProps<{
  error?: string
  submitDisabled?: boolean
  submitPending?: boolean
  idleText: string
  pendingText: string
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <slot />
  <p v-if="error" class="error">{{ error }}</p>
  <UiButton
    type="button"
    class="submit"
    :disabled="submitDisabled || submitPending"
    @click="emit('submit')"
  >
    {{ submitPending ? pendingText : idleText }}
  </UiButton>
</template>

<style scoped>
.submit {
  width: 100%;
}
</style>
