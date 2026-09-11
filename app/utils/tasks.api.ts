import { apiFetch } from '~/utils/api'
import type {
  CreateTaskError,
  CreateTaskPayload,
  DeleteTaskError,
  GetTaskError,
  GetTasksError,
  NoContent,
  PaginatedTasks,
  TaskDto,
  TaskErrorMessage,
  TaskPriority,
  TaskStatus,
  TasksQuery,
  UpdateTaskError,
  UpdateTaskPayload,
} from '~/types/backend.contracts'

export type {
  PaginatedTasks,
  TaskDto,
  TaskErrorMessage,
  TaskPriority,
  TaskStatus,
  TasksQuery,
  CreateTaskPayload,
  UpdateTaskPayload,
}

export const getTasksApi = (query?: TasksQuery) => {
  const q: Record<string, string | number | boolean | undefined> = {}
  if (query?.status) q.status = query.status
  if (query?.priority) q.priority = query.priority
  if (query?.assigneeId) q.assigneeId = query.assigneeId
  if (query?.page !== undefined) q.page = query.page
  if (query?.limit !== undefined) q.limit = query.limit
  return apiFetch<PaginatedTasks, GetTasksError>('/tasks', { query: q })
}

export const getTaskApi = (id: string) =>
  apiFetch<TaskDto, GetTaskError>(`/tasks/${id}`)

export const createTaskApi = (payload: CreateTaskPayload) =>
  apiFetch<TaskDto, CreateTaskError>('/tasks', { method: 'POST', body: payload })

export const updateTaskApi = (id: string, payload: UpdateTaskPayload) =>
  apiFetch<TaskDto, UpdateTaskError>(`/tasks/${id}`, { method: 'PATCH', body: payload })

export const deleteTaskApi = (id: string): Promise<void> =>
  apiFetch<NoContent, DeleteTaskError>(`/tasks/${id}`, { method: 'DELETE' })
