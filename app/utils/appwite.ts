import {Account, Client, Databases, Storage} from 'appwrite'

let client: Client
let account: Account
let db: Databases
let storage: Storage

export const useAppwrite = () => {
  const { $appwrite } = useNuxtApp()
  return $appwrite
}

export const getClient = () => {
  if (!client) {
    client = new Client()
    const config = useRuntimeConfig()
    client
      .setEndpoint(config.public.appwriteEndpoint)
      .setProject(config.public.appwriteProjectId)
  }
  return client
}

export const getAccount = () => {
  if (!account) {
    account = new Account(getClient())
  }
  return account
}

export const getDb = () => {
  if (!db) {
    db = new Databases(getClient())
  }
  return db
}

export const getStorage = () => {
  if (!storage) {
    storage = new Storage(getClient())
  }
  return storage
}

export { ID, Query } from 'appwrite'
