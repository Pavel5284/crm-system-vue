import {EnumStatus} from '~/types/deals.types'
import type { IColumn } from "./kanban.types"

export const KANBAN_DATA: IColumn[] = [
    {
        id:EnumStatus.todo,
        name: "kanban.status.todo",
        items: [],
    },
    {
        id:EnumStatus['to-be-agreed'],
        name: "kanban.status.to-be-agreed",
        items: [],
    },
    {
        id:EnumStatus['in-progress'],
        name: "kanban.status.in-progress",
        items: [],
    },
    {
        id:EnumStatus.produced,
        name: "kanban.status.produced",
        items: [],
    },
    {
        id:EnumStatus.done,
        name: "kanban.status.done",
        items: [],
    },
]

