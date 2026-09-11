import type { IColumn } from "./kanban.types"

export const KANBAN_DATA: IColumn[] = [
    {
        id: 'todo',
        name: "kanban.status.todo",
        items: [],
    },
    {
        id: 'to-be-agreed',
        name: "kanban.status.to-be-agreed",
        items: [],
    },
    {
        id: 'in-progress',
        name: "kanban.status.in-progress",
        items: [],
    },
    {
        id: 'produced',
        name: "kanban.status.produced",
        items: [],
    },
    {
        id: 'done',
        name: "kanban.status.done",
        items: [],
    },
]
