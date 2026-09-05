<script setup lang="ts">
import {
  type GlobalThemeOverrides,
  darkTheme, dateEnUS, dateJaJP, dateZhCN, enUS, jaJP, lightTheme, zhCN,
} from 'naive-ui'
import Dialog from "@/components/app/Dialog.vue"
import AppHeader from './components/app/AppHeader.vue'
import AccountView from './components/app/AccountView.vue'
import { useStore } from '@/store/index'
import { useLocale } from './locales'
import { useAppMode } from '@/composables/useAppMode'
import useConfig from '@/composables/useConfig'
import { useAppModals } from '@/composables/useAppModals'
import { registerDialogProvider, useDialog } from '@/composables/useDialog'
import { useResponsive } from '@/composables/useResponsive'
import { useElectronSync } from '@/composables/electron-sync'
import AppStatus from './constants/app'
import { checkAppUpdates, checkElectronUpdates, deepCopy, getAppBackground, sleep } from './tools'
import { fixFuncConfig, type FuncConfigModel } from './types/config/func'
import { fixUserConfig, type UserConfigModel } from './types/config/user'
import { fixCloudConfig, type CloudConfigModel } from './types/config/cloud'
import { fixMainCache, type MainCacheModel } from './types/config/cache-main'
import { useInventoryPluginAutoConnect } from '@/composables/useInventoryPlugin.ts'

const ModalCopyAsMacro = defineAsyncComponent(() => import('@/components/modals/ModalCopyAsMacro.vue'))
const ModalJoinInWorkflow = defineAsyncComponent(() => import('@/components/modals/ModalJoinInWorkflow.vue'))
const ModalCheckUpdates = defineAsyncComponent(() => import('@/components/modals/ModalCheckUpdates.vue'))
const ModalLogin = defineAsyncComponent(() => import('@/components/modals/ModalLogin.vue'))
const ModalCloudSync = defineAsyncComponent(() => import('@/components/modals/ModalCloudSync.vue'))
const ModalFestivalEgg = defineAsyncComponent(() => import('@/components/modals/ModalFestivalEgg.vue'))
const ModalItemPriceDetail = defineAsyncComponent(() => import('@/components/modals/ModalItemPriceDetail.vue'))

const store = useStore()
const { t, setLocale } = useLocale()
const { theme } = useConfig()
const { confirm } = useDialog(t)
const { isMobile } = useResponsive()
const { appMode } = useAppMode()
const { emitSync, onSync } = useElectronSync()
useInventoryPluginAutoConnect()
const {
  showCopyMacroModal, macroMapValue,
  showModalJoinInWorkflow, itemsToJoinInWorkflow,
  showCheckUpdatesModal, displayCheckUpdatesModal,
  showModalLogin, loginAction,
  showModalCloudSync,
  showModalItemPriceDetail, modalItemPriceDetailItems
} = useAppModals()

const locale = computed(() => {
  return store.userConfig?.language_ui ?? 'zh'
})
setLocale(locale.value)
watch(locale, (newVal) => {
  setLocale(newVal)
})

watch(theme, () => {
  console.log('theme changed:', theme.value)
  const isDarkMode = theme.value !== 'light'
  if (window.electronAPI?.updateTitleBarTheme) {
    window.electronAPI.updateTitleBarTheme(isDarkMode)
  }
}, { immediate: true })
const naiveUiTheme = computed(() => {
  return theme.value === 'light' ? lightTheme : darkTheme
})
const naiveUiLocale = computed(() => {
  switch (locale.value) {
    case 'en': return enUS
    case 'ja': return jaJP
    default: return zhCN
  }
})
const naiveUiDateLocale = computed(() => {
  switch (locale.value) {
    case 'en': return dateEnUS
    case 'ja': return dateJaJP
    default: return dateZhCN
  }
})
const naiveUiMessagePlacement = computed(() => {
  return isMobile.value ? 'bottom' : 'top'
})

const handleAppUpdate = (
  _userConfig: UserConfigModel | undefined,
  _funcConfig: FuncConfigModel | undefined,
  _cloudConfig: CloudConfigModel | undefined,
  _mainCache: MainCacheModel | undefined
) => {
  // Update store
  store.userConfig = fixUserConfig(_userConfig)
  store.updateUserConfig()
  store.funcConfig = fixFuncConfig(_funcConfig)
  store.updateFuncConfig()
  store.cloudConfig = fixCloudConfig(_cloudConfig)
  store.updateCloudConfig()
  store.mainCache = fixMainCache(_mainCache)
  store.updateMainCache()
  // Update i18n
  setLocale(locale.value)
  // Update vue
  const instance = getCurrentInstance()
  instance?.proxy?.$forceUpdate()
  // Load app background
  getAppBackground(store.userConfig.custom_background).then(val => appBg.value = val)
}
const appForceUpdate = () => {
  // update app
  handleAppUpdate(
    store.userConfig,
    store.funcConfig,
    store.cloudConfig,
    store.mainCache
  )
  // Update electron settings
  emitSync('update-setting', deepCopy({
    userConfig: store.userConfig,
    funcConfig: store.funcConfig,
    cloudConfig: store.cloudConfig,
    mainCache: store.mainCache,
  }))
}
provide('appForceUpdate', appForceUpdate)
onSync('update-setting', (value) => {
  const {
    userConfig: _userConfig, funcConfig: _funcConfig, cloudConfig: _cloudConfig, mainCache: _mainCache
  } = value
  handleAppUpdate(_userConfig, _funcConfig, _cloudConfig, _mainCache)
})

const appClass = computed(() => {
  const classes = [
    'lang-' + locale.value,
    'theme-' + theme.value,
    'app-' + (isMobile.value ? 'mobile' : 'desktop'),
    window.electronAPI ? 'env-electron' : 'env-web',
    appMode.value === 'overlay' ? 'env-overlay' : ''
  ]
  return classes.join(' ')
})
const appStyle = computed(() => {
  const fontSize = store.userConfig.custom_font_size || '14px'
  const styles = [
    appMode.value === 'overlay' ? '' : '--app-bg: ' + appBg.value,
    `--app-font-size: ${fontSize}`,
  ]
  return styles.filter(Boolean).join(';')
})

const showFestivalEgg = ref(false)
const dialogRef = ref<InstanceType<typeof Dialog> | null>(null)

const appBg = ref('')

onMounted(async () => {
  // 注册对话框
  if (dialogRef.value) {
    registerDialogProvider(dialogRef.value)
  } else {
    console.warn('dialogRef is not set, dialog provider will not be registered.')
  }
  await sleep(500)
  // 处理自动更新
  await handleAutoUpdate()
  // 处理彩蛋
  const now = new Date()
  const date = now.getDate()
  const eggId = 20241225
  if (
    store.userConfig.last_triggered_egg !== eggId &&
    (now.getMonth() === 11) && ((date === 24 && now.getHours() >= 18) || date === 25)
  ) {
    showFestivalEgg.value = true
    const newConfig = fixUserConfig(store.userConfig)
    newConfig.last_triggered_egg = eggId
    store.setUserConfig(newConfig)
  }
  // 处理 UI
  updateDraggableArea()
  window.addEventListener('resize', updateDraggableArea)
  // 加载背景
  appBg.value = await getAppBackground(store.userConfig.custom_background)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDraggableArea)
})
const handleAutoUpdate = async () => {
  if (!store.userConfig.disable_auto_update && appMode.value !== 'overlay' && !window.androidAPI?.checkUpdate) {
    try {
      if (window.electronAPI) {
        const checkElectronUpdateResponse = await checkElectronUpdates()
        if (checkElectronUpdateResponse.success) {
          const latest = checkElectronUpdateResponse.data!.electron
          const currentElectronVersion = await window.electronAPI.clientVersion
          if (currentElectronVersion !== latest) {
            if (await confirm(
              t('update.message.checked_new_client', latest)
              + '\n' + t('update.message.ask_update_now')
            )) {
              displayCheckUpdatesModal()
            }
            return
          }
        } else {
          console.error('检查客户端更新失败:', checkElectronUpdateResponse.message, '\n', checkElectronUpdateResponse)
        }
      }
      const checkAppUpdateResponse = await checkAppUpdates()
      if (checkAppUpdateResponse.success) {
        const versionContent = checkAppUpdateResponse.data!
        if (AppStatus.Version !== versionContent.hqhelper) {
          if (await confirm(
            t('update.message.checked_new_hqhelper', versionContent.hqhelper)
            + '\n' + t('update.message.ask_update_now')
          )) {
            if (window.electronAPI) {
              displayCheckUpdatesModal()
            } else {
              const cacheKeys = await caches.keys()
              for (const name of cacheKeys) {
                await caches.delete(name)
              }
              location.reload()    
            }
          }
        }
      } else {
        console.error('检查HqHelper更新失败:', checkAppUpdateResponse.message, '\n', checkAppUpdateResponse)
      }
    } catch (err) {
      console.error('自动更新发生错误', err)
    }
  }
}
const updateDraggableArea = () => {
  const dragArea = document.getElementById('drag-area')
  const appLayoutHeader = document.getElementById('app-layout-header')
  if (dragArea && appLayoutHeader && window.electronAPI && appMode.value !== 'overlay') {
    dragArea.innerHTML = ''

    const regions = [
      { top: 0, left: 0, width: appLayoutHeader.offsetWidth - 145, height: appLayoutHeader.offsetHeight },
    ]

    for (const { top, left, width, height } of regions) {
      const div = document.createElement('div')
      Object.assign(div.style, {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        WebkitAppRegion: 'drag',
        'z-index': '-1',
      })
      dragArea.appendChild(div)
    }
  }
}

const naiveUIThemeOverrides = computed(() : GlobalThemeOverrides => {
  let fontFamily = 'Lato, -apple-system, Helvetica Neue, Segoe UI, Microsoft Yahei, 微软雅黑, Arial, Helvetica, sans-serif'
  if (store.userConfig.custom_font) {
    fontFamily = store.userConfig.custom_font + ', ' + fontFamily
  }
  fontFamily = 'FFXIV, ' + fontFamily
  const fontSize = store.userConfig.custom_font_size || '14px'

  return {
    common: {
      fontFamily,
      fontSize,
      fontSizeMedium: fontSize,
      fontSizeSmall: fontSize,
      fontSizeTiny: `calc(${fontSize} - 2px)`,
      fontSizeMini: `calc(${fontSize} - 1px)`,
      fontSizeLarge: `calc(${fontSize} + 1px)`,
      fontSizeHuge: `calc(${fontSize} + 2px)`
    }
  }
})
</script>

<template>
  <n-config-provider
    :theme="naiveUiTheme"
    :locale="naiveUiLocale"
    :date-locale="naiveUiDateLocale"
    :namespace="appClass"
    :theme-overrides="naiveUIThemeOverrides"
  >
    <n-global-style />
    <n-dialog-provider>
    <n-message-provider :placement="naiveUiMessagePlacement">
      <div :class="appClass" :style="appStyle" :data-theme="theme">
        <n-layout id="main-layout" position="absolute">
          <n-layout-header v-if="appMode !== 'overlay'" bordered id="app-layout-header">
            <AppHeader class="app-header" />
          </n-layout-header>

          <n-layout id="main-content" position="absolute" :native-scrollbar="false">
            <router-view />
          </n-layout>

          <AccountView v-if="!isMobile && appMode !== 'overlay'" trigger-class="absolute! top-9 right-5 z-[2000]!" />

          <div
            v-if="AppStatus.IsBeta && !isMobile"
            class="absolute bottom-1 left-2 text-app-xs text-sub select-none"
          >
            ◈ {{ t('common.message.app_beta_tooltip') }}
          </div>
        </n-layout>

        <Dialog ref="dialogRef" />
        <ModalCopyAsMacro
          v-model:show="showCopyMacroModal"
          :macro-map="macroMapValue"
        />
        <ModalJoinInWorkflow
          v-model:show="showModalJoinInWorkflow"
          :items="itemsToJoinInWorkflow"
        />
        <ModalCheckUpdates v-model:show="showCheckUpdatesModal" />
        <ModalLogin
          v-model:show="showModalLogin"
          :default-tab="loginAction"
        />
        <ModalCloudSync
          v-model:show="showModalCloudSync"
        />
        <ModalFestivalEgg v-model:show="showFestivalEgg" />
        <ModalItemPriceDetail
          v-model:show="showModalItemPriceDetail"
          :items="modalItemPriceDetailItems"
        />
      </div>
    </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style scoped>
.app-header {
  height: 69px;
  padding: 10px 20px;
  position: relative;
  z-index: 1;
}
#main-content {
  top: 70px;
  background-image: var(--app-bg);
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% auto;

  #main-container {
    padding: 1rem;
  }
}
.env-overlay #main-content {
  top: 0;
}
</style>
