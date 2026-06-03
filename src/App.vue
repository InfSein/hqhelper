<script setup lang="ts">
import {
  darkTheme, lightTheme, useOsTheme,
  zhCN, enUS, jaJP, dateZhCN, dateEnUS, dateJaJP,
  NConfigProvider, NDialogProvider, NGlobalStyle, NMessageProvider,
  NLayout, NLayoutHeader,
  type GlobalThemeOverrides
} from 'naive-ui'
import AppHeader from './components/custom/general/AppHeader.vue'
import AccountView from './components/custom/general/AccountView.vue'
import Dialog from "@/components/custom/general/Dialog.vue"
import { useStore } from '@/store/index'
import { useElectronSync } from '@/composables/electron-sync'
import { useLocale } from './locales'
import { checkAppUpdates, CopyToClipboard, deepCopy, getAppBackground, sleep } from './tools'
import EorzeaTime from './tools/eorzea-time'
import { type ItemInfo } from './tools/item'
import { fixUserConfig , type UserConfigModel } from '@/models/config-user'
import { fixFuncConfig, type FuncConfigModel, type MacroGenerateMode } from './models/config-func'
import { fixCloudConfig, type CloudConfigModel } from '@/models/config-cloud'
import { fixMainCache, type MainCacheModel } from '@/models/cache-main'
import AppStatus from './variables/app-status'
import { registerDialogProvider, useDialog } from './tools/dialog'

const ModalCopyAsMacro = defineAsyncComponent(() => import('@/components/modals/ModalCopyAsMacro.vue'))
const ModalJoinInWorkflow = defineAsyncComponent(() => import('@/components/modals/ModalJoinInWorkflow.vue'))
const ModalCheckUpdates = defineAsyncComponent(() => import('@/components/modals/ModalCheckUpdates.vue'))
const ModalLogin = defineAsyncComponent(() => import('@/components/modals/ModalLogin.vue'))
const ModalCloudSync = defineAsyncComponent(() => import('@/components/modals/ModalCloudSync.vue'))
const ModalFestivalEgg = defineAsyncComponent(() => import('@/components/modals/ModalFestivalEgg.vue'))
const ModalItemPriceDetail = defineAsyncComponent(() => import('@/components/modals/ModalItemPriceDetail.vue'))

const route = useRoute()
const store = useStore()
const { t: rawT, setLocale } = useLocale()
const { emitSync, onSync } = useElectronSync()

const userConfig = ref<UserConfigModel>(fixUserConfig(store.userConfig))
const funcConfig = ref<FuncConfigModel>(fixFuncConfig(store.funcConfig, store.userConfig))
const cloudConfig = ref<CloudConfigModel>(fixCloudConfig(store.cloudConfig))
const mainCache = ref<MainCacheModel>(fixMainCache(store.mainCache))
const locale = computed(() => {
  return userConfig.value?.language_ui ?? 'zh'
})
setLocale(locale.value)

const appMode = ref<"overlay" | "" | undefined>('')
provide('appMode', appMode)

const isMobile = ref(false)
const updateIsMobile = () => {
  isMobile.value = window.innerWidth < window.innerHeight
}

const osTheme = useOsTheme()
const theme = computed(() => {
  const _theme = userConfig.value.theme
  if (_theme === 'system') {
    return osTheme.value === 'dark' ? 'dark' : 'light'
  }
  return _theme
})
const naiveUiTheme = computed(() => {
  const isDarkMode = theme.value !== 'light'
  if (window.electronAPI?.updateTitleBarTheme) {
    window.electronAPI.updateTitleBarTheme(isDarkMode)
  }
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
    userConfig: userConfig.value,
    funcConfig: funcConfig.value,
    cloudConfig: cloudConfig.value,
    mainCache: mainCache.value,
  }))
}
onSync('update-setting', (value) => {
  console.log('on-sync was called', value)
  const {
    userConfig: _userConfig, funcConfig: _funcConfig, cloudConfig: _cloudConfig, mainCache: _mainCache
  } = value
  handleAppUpdate(_userConfig, _funcConfig, _cloudConfig, _mainCache)
  store.setUserConfig(userConfig.value)
  store.setFuncConfig(funcConfig.value)
  store.setCloudConfig(cloudConfig.value)
  store.setMainCache(mainCache.value)
})
const handleAppUpdate = (
  _userConfig: UserConfigModel | undefined,
  _funcConfig: FuncConfigModel | undefined,
  _cloudConfig: CloudConfigModel | undefined,
  _mainCache: MainCacheModel | undefined
) => {
  userConfig.value = fixUserConfig(_userConfig)
  funcConfig.value = fixFuncConfig(_funcConfig, _userConfig)
  cloudConfig.value = fixCloudConfig(_cloudConfig)
  mainCache.value = fixMainCache(_mainCache)
  // Update i18n
  setLocale(locale.value)
  // Update vue
  const instance = getCurrentInstance()
  instance?.proxy?.$forceUpdate()
  // 加载背景
  getAppBackground(userConfig.value.custom_background).then(val => appBg.value = val)
}
const switchTheme = () => {
  userConfig.value.theme = theme.value === 'light' ? 'dark' : 'light'
  store.setUserConfig(userConfig.value)
}

const t = (message: string, args?: any) => {
  const rawTranslate = rawT(message)

  if (typeof rawTranslate !== 'string') {
    console.warn(`[i18n] '${message}' resolved to a non-string`)
    return message
  }

  let result = ''

  if (typeof args === 'object') {
    result = rawT(message, args)
  } else if (args !== undefined) {
    const keys = [
      // 为了兼容旧数据默认插值
      'content', 'contents', 'control_val', 'count', 'craftsmanship_val',
      'dataname', 'date', 'days', 'err', 'errmsg', 'error', 'f', 'gen',
      'hours', 'id', 'il', 'ilv', 'index', 'job', 'key', 'lang', 'limit',
      'maxlen', 'minute', 'minutes', 'name', 'num', 'option', 'patch', 'platform', 'pos',
      'second', 'setting', 'stage', 'tool', 'v', 'val', 'ver',
    ]
    result = rawT(message, Object.fromEntries(keys.map(k => [k, args])))
  } else {
    result = rawT(message)
  }

  if (result === 'DONT_SHOW') result = ''

  return result
}

provide('userConfig', userConfig)
provide('funcConfig', funcConfig)
provide('cloudConfig', cloudConfig)
provide('mainCache', mainCache)
provide('t', t)
provide('theme', theme)
provide('locale', locale)
provide('isMobile', isMobile)
provide('appForceUpdate', appForceUpdate)
provide('switchTheme', switchTheme)

const currentET = ref<EorzeaTime>(new EorzeaTime())
setInterval(() => {
  currentET.value = new EorzeaTime()
}, 200)
provide('currentET', currentET)

const showCopyMacroModal = ref(false)
const macroMapValue = ref<Record<MacroGenerateMode, string>>({
  singleLine: '', multiLine: ''
})
const copyAsMacro = async (macroMap: Record<MacroGenerateMode, string>, container?: HTMLElement | undefined) : Promise<{
  result: "success" | "info" | "error"
  msg: string
} | undefined> => {
  let macroContent = macroMap[funcConfig.value.macro_generate_mode]
  if (!macroContent) {
    return { result: 'info', msg: t('common.message.nothing_to_copy') }
  }
  macroContent = macroContent.split('\r\n').map(line => `${funcConfig.value.macro_copy_prefix}${line}`).join('\r\n')
  if (funcConfig.value.macro_direct_copy) {
    const errored = await CopyToClipboard(macroContent, container)
    if (errored) {
      return { result: 'error', msg: t('common.message.copy_failed') }
    }
    return { result: 'success', msg: t('common.message.copy_succeed') }
  } else {
    macroMapValue.value = macroMap
    showCopyMacroModal.value = true
  }
}
provide('copyAsMacro', copyAsMacro)

const showModalJoinInWorkflow = ref(false)
const itemsToJoinInWorkflow = ref<Record<number, number>>({})
const joinItemsToWorkflow = (items: Record<number, number>) => {
  itemsToJoinInWorkflow.value = items
  showModalJoinInWorkflow.value = true
}
provide('joinItemsToWorkflow', joinItemsToWorkflow)

const showCheckUpdatesModal = ref(false)
const displayCheckUpdatesModal = () => {
  showCheckUpdatesModal.value = true
}
provide('displayCheckUpdatesModal', displayCheckUpdatesModal)

const loginAction = ref<"login" | "register" | "edituser">('login')
const showModalLogin = ref(false)
const displayLoginModal = (action: "login" | "register" | "edituser") => {
  loginAction.value = action
  showModalLogin.value = true
}
provide('displayLoginModal', displayLoginModal)

const showModalCloudSync = ref(false)
const displayCloudSyncModal = () => {
  showModalCloudSync.value = true
}
provide('displayCloudSyncModal', displayCloudSyncModal)

const showModalItemPriceDetail = ref(false)
const modalItemPriceDetailItems = ref<ItemInfo[]>([])
const showItemPriceDetail = (items: ItemInfo[]) => {
  if (showModalItemPriceDetail.value) {
    alertError('无法重复打开弹窗'); return
  }
  modalItemPriceDetailItems.value = items
  showModalItemPriceDetail.value = true
}
provide('showItemPriceDetail', showItemPriceDetail)

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
  const styles = [
    appMode.value === 'overlay' ? '' : '--app-bg: ' + appBg.value
  ]
  return styles.join(';')
})

const showFestivalEgg = ref(false)
provide('displayFestivalEggModal', () => {
  showFestivalEgg.value = true
})
const dialogRef = ref<InstanceType<typeof Dialog> | null>(null)
const { alertError, confirm } = useDialog(t)

const appBg = ref('')

onMounted(async () => {
  // 注册对话框
  if (dialogRef.value) {
    registerDialogProvider(dialogRef.value)
  } else {
    console.warn('dialogRef is not set, dialog provider will not be registered.')
  }
  await sleep(500)
  // 处理全局页面参数
  appMode.value = route.query.mode as typeof appMode.value
  // 处理自动更新
  await handleAutoUpdate()
  // 处理彩蛋
  const now = new Date()
  const date = now.getDate()
  const eggId = 20241225
  if (
    userConfig.value.last_triggered_egg !== eggId &&
    (now.getMonth() === 11) && ((date === 24 && now.getHours() >= 18) || date === 25)
  ) {
    showFestivalEgg.value = true
    const newConfig = fixUserConfig(store.userConfig)
    newConfig.last_triggered_egg = eggId
    store.setUserConfig(newConfig)
  }
  // 处理 UI
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
  updateDraggableArea()
  window.addEventListener('resize', updateDraggableArea)
  // 加载背景
  appBg.value = await getAppBackground(userConfig.value.custom_background)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
  window.removeEventListener('resize', updateDraggableArea)
})
watch(
  () => route.query.mode,
  (newMode) => {
    appMode.value = newMode as typeof appMode.value
    updateIsMobile()
  }
)
const handleAutoUpdate = async () => {
  if (!userConfig.value.disable_auto_update && appMode.value !== 'overlay' && !window.androidAPI?.checkUpdate) {
    try {
      const checkUpdateResponse = await checkAppUpdates()
      if (checkUpdateResponse.success) {
        const versionContent = checkUpdateResponse.data!
        
        let needUpdateElectron = false, needUpdateHqHelper = false
        if (window.electronAPI) {
          const currentElectronVersion = await window.electronAPI.clientVersion
          needUpdateElectron = currentElectronVersion !== versionContent.electron
        }
        needUpdateHqHelper = AppStatus.Version !== versionContent.hqhelper

        if (needUpdateElectron) {
          if (await confirm(
            t('update.message.checked_new_client', versionContent.electron)
            + (needUpdateHqHelper ? ('\n' + t('update.message.checked_new_hqhelper', versionContent.hqhelper)) : '')
            + '\n' + t('update.message.ask_update_now')
          )) {
            displayCheckUpdatesModal()
          }
        } else if (needUpdateHqHelper) {
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
        console.error('自动更新失败:', checkUpdateResponse.message, '\n', checkUpdateResponse)
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
  if (userConfig.value.custom_font) {
    fontFamily = userConfig.value.custom_font + ', ' + fontFamily
  }
  fontFamily = 'FFXIV, ' + fontFamily
  const fontSize = userConfig.value.custom_font_size || '14px'

  /*
  let buttonBorder : string | undefined = undefined
  if (userConfig.value.custom_background) {
    buttonBorder = theme.value === 'dark' ? undefined : '1px solid #b9b9ba'
  }
  */

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

          <AccountView v-if="!isMobile && appMode !== 'overlay'" trigger-class="account-view" />
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
