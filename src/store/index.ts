import { defineStore } from 'pinia'
import { getItem, setItem } from './storage'
import StorageKeys from './keys'
import type { UserConfigModel } from '@/models/config-user'
import type { FuncConfigModel } from '@/models/config-func'
import type { CloudConfigModel } from '@/models/config-cloud'
import type { MainCacheModel } from '@/models/cache-main'

export const useStore = defineStore('main', {
  state: () => ({
    userConfig: getItem<UserConfigModel>(StorageKeys.UserConfig),
    funcConfig: getItem<FuncConfigModel>(StorageKeys.FuncConfig),
    cloudConfig: getItem<CloudConfigModel>(StorageKeys.CloudConfig),
    mainCache: getItem<MainCacheModel>(StorageKeys.MainCache),
  }),
  actions: {
    setUserConfig(value: UserConfigModel) {
      this.userConfig = value
      setItem(StorageKeys.UserConfig, value)
    },
    setFuncConfig(value: FuncConfigModel) {
      this.funcConfig = value
      setItem(StorageKeys.FuncConfig, value)
    },
    setCloudConfig(value: CloudConfigModel) {
      this.cloudConfig = value
      setItem(StorageKeys.CloudConfig, value)
    },
    setMainCache(value: MainCacheModel) {
      this.mainCache = value
      setItem(StorageKeys.MainCache, value)
    },
  }
})
// ! todo
/* samples:

import StorageKeys from './keys'
import { fixAppConfig, type AppConfig } from '@/types/config'
import { fixUserData, type UserData } from '@/types/user-data'

export const useStore = defineStore('main', {
  state: () => ({
    appConfig: fixAppConfig(getItem<AppConfig>(StorageKeys.AppConfig)),
    userData: fixUserData(getItem<UserData>(StorageKeys.UserData)),
  }),
  actions: {
    reloadAppConfig() {
      this.appConfig = fixAppConfig(getItem<AppConfig>(StorageKeys.AppConfig))
    },
    updateAppConfig() {
      this.appConfig = fixAppConfig(this.appConfig)
      setItem(StorageKeys.AppConfig, this.appConfig)
    },
    setAppConfig(value: AppConfig) {
      this.appConfig = fixAppConfig(value)
      setItem(StorageKeys.AppConfig, value)
    },
    reloadUserData() {
      this.userData = fixUserData(getItem<UserData>(StorageKeys.UserData))
    },
    updateUserData() {
      this.userData = fixUserData(this.userData)
      setItem(StorageKeys.UserData, this.userData)
    },
    setUserData(value: UserData) {
      this.userData = fixUserData(value)
      setItem(StorageKeys.UserData, value)
    },
  }
})
 */