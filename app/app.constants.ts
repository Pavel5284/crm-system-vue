export const COLLECTION_DEALS = 'deals'
export const COLLECTION_CUSTOMERS = 'customers'
export const COLLECTION_COMMENTS = 'comments'

export const useDbId = () => {
    const config = useRuntimeConfig()
    return config.public.appwriteDatabaseId
}
