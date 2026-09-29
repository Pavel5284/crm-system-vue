import { createCommentApi } from '~/utils/crm.api'
import { COMMENT_TEXT_MAX_LENGTH, containsControlChars } from '~/utils/validation'

export function useCreateComment ({refetch}: {refetch: ()=>void}) {
    const { t } = useI18n()
    const store = useDealSlideStore()
    const commentRef = ref<string>('')

    // Проверка до отправки: бэкенд (CreateCommentDto) тоже валидирует
    // (min 1, max 2000), но мусор лучше не отправлять в сеть.
    // Управляющие символы в однострочном поле — потенциальная инъекция
    // переносов в логи/хранилище.
    const commentError = computed(() => {
        const text = commentRef.value.trim()
        if (!text) return ''
        if (text.length > COMMENT_TEXT_MAX_LENGTH) return t('validation.textTooLong', { max: COMMENT_TEXT_MAX_LENGTH })
        if (containsControlChars(commentRef.value)) return t('validation.invalidCharacters')
        return ''
    })

    const {mutate, error: mutationError} = useMutation({
        mutationKey: ['add comments'],
        mutationFn: async () => {
            const dealId = store.card?.id
            if (!dealId) throw new Error('Сделка не выбрана')
            return createCommentApi({
                dealId,
                text: commentRef.value.trim(),
            })
        },
        onSuccess: ()=>{
            refetch()
            commentRef.value = ''
        }
    })

    const writeComment = () => {
        if (!commentRef.value.trim() || commentError.value) return
        if (!store.card?.id) return
        mutate()
    }
    return {
        writeComment,
        commentRef,
        commentError,
        mutationError,
    }
}
