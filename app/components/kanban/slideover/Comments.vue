<script lang="ts" setup>
import {useComments} from "./useComments";
import {useCreateComment} from "./useCreateComment";
import {useDeleteComment} from "./useDeleteComment";
import dayjs from 'dayjs';

const {data, refetch, isLoading} = useComments()
const {commentRef, writeComment} = useCreateComment({refetch})
const {deleteComment} = useDeleteComment({refetch})

</script>

<template>
  <div class="flex gap-2">
    <UiInput
        placeholder="Оставить комментарий"
        v-model="commentRef"
        @keyup.enter="writeComment"
        class="flex-1"
    />
    <UiButton @click="writeComment" size="sm" class="px-2">
      <Icon name="heroicons:arrow-right" size="18"/>
    </UiButton>
  </div>
  <UiSkeleton v-if="isLoading" class="w-full h-[76px] rounded mt-5"/>
  <div v-else-if="data?.length">
    <div
        v-for="comment in data"
        :key="comment.$id"
        class="flex items-start mt-5"
    >
      <Icon name="line-md:comment" class="mr-3 mt-1" size="20"/>
      <div class="border-border bg-black/20 rounded p-3 w-full relative">
        <div class="mb-2 text-sm flex items-center justify-between">
          <div>
            <span class="font-medium">{{ comment.userName || comment.userEmail }}</span>
            <span class="text-xs text-gray-400 ml-2">{{dayjs(comment.$createdAt).format('YYYY-MM-DD HH:mm:ss.SSS')}}</span>
          </div>
          <Icon
              name="heroicons:x-mark"
              size="16"
              class="cursor-pointer hover:opacity-70"
              @click="deleteComment(comment.$id)"
          />
        </div>
        <p>{{comment.text}}</p>
      </div>

    </div>

  </div>
</template>