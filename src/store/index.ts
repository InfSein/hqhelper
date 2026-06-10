import { defineStore } from 'pinia'
import { getItem, setItem } from './storage'
import StorageKeys from './keys'
import { fixUserConfig, type UserConfigModel } from '@/types/config/user'
import { fixCloudConfig, type CloudConfigModel } from '@/types/config/cloud'
import { fixMainCache, type MainCacheModel } from '@/types/config/cache-main'
import { fixFuncConfig, type FuncConfigModel } from '@/types/config/func'

export const useStore = defineStore('main', {
  state: () => ({
    userConfig: fixUserConfig(getItem<UserConfigModel>(StorageKeys.UserConfig)),
    funcConfig: fixFuncConfig(getItem<FuncConfigModel>(StorageKeys.FuncConfig)),
    cloudConfig: fixCloudConfig(getItem<CloudConfigModel>(StorageKeys.CloudConfig)),
    mainCache: fixMainCache(getItem<MainCacheModel>(StorageKeys.MainCache)),
  }),
  actions: {
    setUserConfig(value: UserConfigModel) {
      this.userConfig = fixUserConfig(value)
      setItem(StorageKeys.UserConfig, value)
    },
    reloadUserConfig() {
      this.userConfig = fixUserConfig(getItem<UserConfigModel>(StorageKeys.UserConfig))
    },
    updateUserConfig() {
      this.userConfig = fixUserConfig(this.userConfig)
      setItem(StorageKeys.UserConfig, this.userConfig)
    },
    setFuncConfig(value: FuncConfigModel) {
      this.funcConfig = fixFuncConfig(value)
      setItem(StorageKeys.FuncConfig, value)
    },
    reloadFuncConfig() {
      this.funcConfig = fixFuncConfig(getItem<FuncConfigModel>(StorageKeys.FuncConfig))
    },
    updateFuncConfig() {
      this.funcConfig = fixFuncConfig(this.funcConfig)
      setItem(StorageKeys.FuncConfig, this.funcConfig)
    },
    setCloudConfig(value: CloudConfigModel) {
      this.cloudConfig = fixCloudConfig(value)
      setItem(StorageKeys.CloudConfig, value)
    },
    reloadCloudConfig() {
      this.cloudConfig = fixCloudConfig(getItem<CloudConfigModel>(StorageKeys.CloudConfig))
    },
    updateCloudConfig() {
      this.cloudConfig = fixCloudConfig(this.cloudConfig)
      setItem(StorageKeys.CloudConfig, this.cloudConfig)
    },
    setMainCache(value: MainCacheModel) {
      this.mainCache = fixMainCache(value)
      setItem(StorageKeys.MainCache, value)
    },
    reloadMainCache() {
      this.mainCache = fixMainCache(getItem<MainCacheModel>(StorageKeys.MainCache))
    },
    updateMainCache() {
      this.mainCache = fixMainCache(this.mainCache)
      setItem(StorageKeys.MainCache, this.mainCache)
    },
  }
})
