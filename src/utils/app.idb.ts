import { openDB } from 'idb'

const DB_NAME = 'backgroundDB'
const STORE_NAME = 'backgroundStore'

export enum dbKey {
  appBackground = 'appBackground'
}

const useIdb = () => {
  const dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })

  const appBackground = {
    get: async () => {
      const db = await dbPromise
      return db.get(STORE_NAME, dbKey.appBackground) as Promise<Blob | undefined>
    },
    set: async (imageBlob: Blob) => {
      const db = await dbPromise
      await db.put(STORE_NAME, imageBlob, dbKey.appBackground)
    },
    clear: async () => {
      const db = await dbPromise
      return db.delete(STORE_NAME, dbKey.appBackground)
    }
  }

  return {
    appBackground,
  }
}

export default useIdb
