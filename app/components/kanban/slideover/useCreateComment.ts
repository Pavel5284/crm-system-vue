import {COLLECTION_DEALS, COLLECTION_CUSTOMERS, useDbId, COLLECTION_COMMENTS} from '~/app.constants'
import type {IDeal} from '~/types/deals.types'
import type {IColumn} from './kanban.types'
import {KANBAN_DATA} from './kanban.data'

export function useCreateComment ({refetch}: {refetch: ()=>void}) {
    const DB_ID = useDbId()
    const store = useDealSlideStore()
    const commentRef = ref<string>()

    const {mutate} = useMutation({
        mutationKey: ['add comments', commentRef.value],
        mutationFn: async () => {
            const { getDb } = await import('~/utils/appwite')
            const DB = getDb()
            DB.createDocument(DB_ID, COLLECTION_COMMENTS, {
                text: commentRef.value,
                    deal: store.card?.id,
            }
        }),
        onSuccess: ()=>{
                refetch()
            commentRef.value = ''
        }
    })

    const writeComment = () => {
        if (!commentRef.value) return
        mutate()
    }
    return {
        writeComment,
        commentRef,
    }
}