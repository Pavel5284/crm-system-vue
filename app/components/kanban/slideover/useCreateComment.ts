import {COLLECTION_COMMENTS, useDbId} from '~/app.constants'
import {ID} from '~/utils/appwite'

export function useCreateComment ({refetch}: {refetch: ()=>void}) {
    const DB_ID = useDbId()
    const store = useDealSlideStore()
    const commentRef = ref<string>('')

    const {mutate} = useMutation({
        mutationKey: ['add comments'],
        mutationFn: async () => {
            const { getDb } = await import('~/utils/appwite')
            const DB = getDb()
            return DB.createDocument(DB_ID, COLLECTION_COMMENTS, ID.unique(), {
                text: commentRef.value,
                deal: store.card?.id,
            })
        },
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