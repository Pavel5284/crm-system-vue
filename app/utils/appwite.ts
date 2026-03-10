import {Account, Client, Databases, Storage} from 'appwrite'

export const client = new Client()

const config = useRuntimeConfig()

client
  .setEndpoint(config.public.appwriteEndpoint)
  .setProject(config.public.appwriteProjectId)

export const account = new Account(client)
export {ID} from 'appwrite'
export const DB = new Databases(client)
export const storage = new Storage(client)