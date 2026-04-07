import {COLLECTION_COMMENTS, useDbId} from '~/app.constants'

export function useDeleteComment({refetch}: {refetch: ()=>void}) {
    const DB_ID = useDbId()

    const {mutate} = useMutation({
        mutationKey: ['delete comment'],
        mutationFn: async (commentId: string) => {
            const { getDb } = await import('~/utils/appwite')
            const DB = getDb()
            return DB.deleteDocument(DB_ID, COLLECTION_COMMENTS, commentId)
        },
        onSuccess: ()=>{
            refetch()
        }
    })

    return {
        deleteComment: mutate,
    }
}
