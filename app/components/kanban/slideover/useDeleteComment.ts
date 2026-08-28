import { deleteCommentApi } from '~/utils/crm.api'

export function useDeleteComment({refetch}: {refetch: ()=>void}) {
    const {mutate} = useMutation({
        mutationKey: ['delete comment'],
        mutationFn: async (commentId: string) => deleteCommentApi(commentId),
        onSuccess: ()=>{
            refetch()
        }
    })

    return {
        deleteComment: mutate,
    }
}
