<script lang="ts" setup>
import {useComments} from "./useComments";
import {useCreateComment} from "./useCreateComment";
import {useDeleteComment} from "./useDeleteComment";
import { formatDate } from '~/utils/formatDate';
import type { CommentDto } from '~/types/backend.contracts'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const {data, refetch, isLoading} = useComments()
const {commentRef, commentError, writeComment} = useCreateComment({refetch})
const {deleteComment} = useDeleteComment({refetch})

// Крестик — только у своих комментариев (админ видит у всех).
// Сервер перепроверяет (author-or-ADMIN), здесь — только UX.
const canDelete = (comment: CommentDto): boolean =>
  comment.userId === authStore.user.id || authStore.user.role === 'ADMIN'

</script>

<template>
  <div class="flex gap-2">
    <div class="flex-1 min-w-0">
      <UiInput
          :placeholder="t('comments.placeholder')"
          v-model="commentRef"
          :error="commentError || undefined"
          @keyup.enter="writeComment"
      />
    </div>
    <UiButton @click="writeComment" size="sm" class="px-2 shrink-0" :disabled="!commentRef.trim() || !!commentError">
      <Icon name="heroicons:arrow-right" size="18"/>
    </UiButton>
  </div>
  <UiSkeleton v-if="isLoading" class="w-full h-[76px] rounded mt-5"/>
  <div v-else-if="data?.length">
    <div
        v-for="comment in data"
        :key="comment.id"
        class="flex items-start mt-5"
    >
      <Icon name="lucide:message-circle" class="mr-3 mt-1" size="20"/>
      <div class="border-border bg-black/20 rounded p-3 w-full relative">
        <div class="mb-2 text-sm flex items-center justify-between">
          <div>
            <span class="font-medium">{{ comment.userName || comment.userEmail }}</span>
            <span class="text-xs text-gray-400 ml-2">{{ formatDate(comment.createdAt, 'datetime', locale) }}</span>
          </div>
          <Icon
              v-if="canDelete(comment)"
              name="heroicons:x-mark"
              size="16"
              class="cursor-pointer hover:opacity-70"
              @click="deleteComment(comment.id)"
          />
        </div>
        <p>{{comment.text}}</p>
      </div>

    </div>

  </div>
</template>

