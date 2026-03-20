export const COLLECTION_DEALS = 'deals'

export const useDbId = () => {
    const config = useRuntimeConfig()
    return config.public.appwriteDatabaseId
}
