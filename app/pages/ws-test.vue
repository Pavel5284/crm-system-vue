<script setup lang="ts">
const { status, socketId, notifications, error, connect, disconnect, clear } = useNotifications()

const statusColor: Record<string, string> = {
    connecting: 'text-yellow-500',
    connected: 'text-green-500',
    disconnected: 'text-gray-500',
    unauthorized: 'text-red-500',
    error: 'text-red-500',
}
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">WS-тест уведомлений</h1>

        <div class="flex items-center gap-4 mb-6">
            <UiButton type="button" @click="connect">Подключиться</UiButton>
            <UiButton type="button" variant="secondary" @click="disconnect">Отключиться</UiButton>
            <UiButton type="button" variant="outline" @click="clear">Очистить</UiButton>
        </div>

        <div class="mb-6">
            <p class="mb-1">
                Статус:
                <span :class="statusColor[status]" class="font-semibold">{{ status }}</span>
            </p>
            <p v-if="socketId" class="mb-1">Socket id: <code>{{ socketId }}</code></p>
            <p v-if="error" class="text-red-500">{{ error }}</p>
            <p v-if="status === 'connected'" class="text-gray-500 text-sm">
                Слушаю канал <code>notification</code>. Назначь задачу этому пользователю через /api/tasks — уведомление появится ниже.
            </p>
        </div>

        <div v-if="notifications.length" class="space-y-3">
            <UiCard v-for="(n, i) in notifications" :key="i">
                <UiCardContent class="p-4">
                    <pre class="text-xs overflow-x-auto">{{ JSON.stringify(n, null, 2) }}</pre>
                </UiCardContent>
            </UiCard>
        </div>
        <p v-else class="text-gray-500">Пока нет уведомлений.</p>
    </div>
</template>