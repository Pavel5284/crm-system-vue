import { createCommentApi } from '~/utils/crm.api'

export function useCreateComment ({refetch}: {refetch: ()=>void}) {
    const store = useDealSlideStore()
    const commentRef = ref<string>('')

    const {mutate} = useMutation({
        mutationKey: ['add comments'],
        mutationFn: async () => createCommentApi({
            dealId: store.card?.id || '',
            text: commentRef.value,
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
