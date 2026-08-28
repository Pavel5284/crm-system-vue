import { createCommentApi } from '~/utils/crm.api'

export function useCreateComment ({refetch}: {refetch: ()=>void}) {
    const store = useDealSlideStore()
    const commentRef = ref<string>('')

    const {mutate, error: mutationError} = useMutation({
        mutationKey: ['add comments'],
        mutationFn: async () => {
            const dealId = store.card?.id
            if (!dealId) throw new Error('Сделка не выбрана')
            return createCommentApi({
                dealId,
                text: commentRef.value,
            })
        },
        onSuccess: ()=>{
            refetch()
            commentRef.value = ''
        }
    })

    const writeComment = () => {
        if (!commentRef.value.trim()) return
        if (!store.card?.id) return
        mutate()
    }
    return {
        writeComment,
        commentRef,
        mutationError,
    }
}
