<script setup lang="ts">
import {
  NButton, NIcon, NTooltip, // 这些组件在函数中进行了引用，不能依赖自动引入
  type DropdownOption, type MenuOption,
} from 'naive-ui'
import {
  ArrowCircleLeftOutlined,
  FileCopyFilled, FilePresentOutlined,
  OpenInNewOutlined,
  CasesRound, CasesOutlined,
  HomeOutlined,
  AccessAlarmsOutlined,
  FastfoodOutlined,
  TaskAltOutlined,
  CheckroomFilled,
  WavesOutlined,
  CodeOutlined,
  HelpOutlineOutlined,
  MenuFilled,
  UpdateOutlined,
  SettingsSharp,
  SettingsSuggestFilled,
  BackpackFilled,
  EventNoteFilled,
  InfoFilled, InfoOutlined,
  DevicesOtherOutlined,
  ContactlessOutlined,
  HandshakeOutlined,
  DevicesOutlined,
  DarkModeTwotone, LightModeTwotone,
  UpdateSharp
} from '@vicons/material'
import AccountView from './AccountView.vue'
import HqLogo from './HqLogo.vue'
import ModalPreferences from '@/components/modals/ModalPreferences.vue'
import ModalInventory from '@/components/modals/ModalInventory.vue'
import ModalContactUs from '@/components/modals/ModalContactUs.vue'
import ModalChangeLogs from '@/components/modals/ModalChangeLogs.vue'
import ModalAboutApp from '@/components/modals/ModalAboutApp.vue'
import ModalDonate from '@/components/modals/ModalDonate.vue'
// import ChristmasTree from '@/assets/icons/ChristmasTree.vue'
import { useStore } from '@/store'
import router from '@/router'
import { checkAppUpdates, visitUrl } from '@/tools'
import { useDialog } from '@/tools/dialog'
import EorzeaTime from '@/tools/eorzea-time'
import useUiTools from '@/tools/ui'
import AppStatus from '@/variables/app-status'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const locale = inject<Ref<"zh" | "en" | "ja">>('locale') ?? ref('zh')
const isChina = computed(() => locale.value === 'zh')
const currentET = inject<Ref<EorzeaTime>>('currentET')!
const theme = inject<Ref<"light" | "dark">>('theme') ?? ref('light')
// const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})
const switchTheme = inject<() => void>('switchTheme')!
const displayCheckUpdatesModal = inject<() => void>('displayCheckUpdatesModal')!
// const displayFestivalEggModal = inject<() => void>('displayFestivalEggModal')!

const useDesktopUi = computed(() => {
  return !isMobile.value || !!window.electronAPI
})
const canOpenDevTools = computed(() => {
  return !!window.electronAPI?.openDevTools && store.userConfig.enable_dev_mode
})

const store = useStore()
const { confirm } = useDialog(t)
const NAIVE_UI_MESSAGE = useMessage()
const { renderIcon, optionsRenderer } = useUiTools(isMobile)

onMounted(() => {
  if (store.userConfig.cache_lasttime_version !== AppStatus.Version) {
    store.userConfig.cache_lasttime_version = AppStatus.Version
    store.updateUserConfig()
    showChangeLogsModal.value = true
  }
})

const versionTooltip = computed(() => {
  if (AppStatus.SupportedGameVersion.CN === AppStatus.SupportedGameVersion.GLOBAL) {
    return [
      t('common.game_data_version', AppStatus.SupportedGameVersion.CN)
    ]
  } else {
    return [
      t('common.chs_data_version', AppStatus.SupportedGameVersion.CN),
      t('common.global_data_version', AppStatus.SupportedGameVersion.GLOBAL),
    ]
  }
})

const showMenus = ref(false)
const menuDropdownVisiGroup = ref([false, false, false, false, false, false])

const showPreferencesModal = ref(false)
const preferenceModalShowUpOnly = ref(false)
const preferenceModalShowFpOnly = ref(false)
const showInventoryModal = ref(false)
const showAboutAppModal = ref(false)
const showContactModal = ref(false)
const showChangeLogsModal = ref(false)
const showDonateModal = ref(false)

interface MyMenuItem {
  key: string
  icon: Component
  label: string
  hide?: boolean
  disabled?: boolean
  click?: () => void
  options?: MyMenuOption[]
}
type MyMenuOption = CommonMenuOption | MenuDivider | RouterMenuOption
interface CommonMenuOption {
  type: 'common'
  icon: Component
  label: string
  description?: string
  hide?: boolean
  disabled?: boolean
  children?: MenuOption[]
  click?: () => void
  mobileClick?: () => void
  customRenderer?: () => VNode
}
interface MenuDivider {
  type: 'divider'
  hide?: boolean
}
interface RouterMenuOption {
  type: 'router'
  icon: Component
  label: string
  /** 在默认状态下的描述 */
  description: string
  hide?: boolean
  disabled?: boolean
  /** 路由键 */
  routerKey: string
  /** 允许在新窗口中打开 */
  allowNewWindow: boolean
  /** 新窗口默认参数 */
  defaultNewWindowOption?: {
    width: number,
    height: number,
    /** 顶部偏移，仅在浏览器生效 */
    top: number,
    /** 左部偏移，仅在浏览器生效 */
    left: number
  }
}

const menuData = computed(() => {
  const data : MyMenuItem[] = [
    /* 参考资料 */
    {
      key: 'refs',
      icon: FileCopyFilled,
      label: '参考资料',
      hide: store.userConfig.language_ui !== 'zh', // 这里的内容仅限中文用户可见，不做国际化
      options: [
        {
          type: 'common',
          label: '推荐攻略',
          icon: FilePresentOutlined,
          hide: isMobile.value,
          children: buildOuterlinkGroups([
            {
              key: 'master-recipe',
              title: '手法参考',
              options: [
                { url: 'https://bbs.nga.cn/read.php?tid=40690311', label: '7.x星级配方制作攻略 by月下独翼' },
                { url: 'https://bbs.nga.cn/read.php?tid=41060177', label: '7.x秘籍配方制作攻略 by竹笙微凉_' },
              ]
            },
            {
              key: 'cosmos-explore',
              title: '宇宙探索',
              options: [
                { url: 'https://bbs.nga.cn/read.php?tid=43895399', label: '宇宙探索攻略 by 天然呆树歌' },
                { url: 'https://bbs.nga.cn/read.php?tid=45044038', label: '玻璃星任务宏&收益分析 by plas_g' },
              ]
            },
            {
              key: 'other',
              title: '其他',
              options: [
                { url: 'https://www.kdocs.cn/l/ceEcTzlFQBUy', label: '全战职开荒/毕业配装 by 孤风行' },
              ]
            },
          ]),
        },
        {
          type: 'common',
          label: '推荐工具',
          icon: CasesOutlined,
          hide: isMobile.value,
          children: buildOuterlinkOptions([
            { url: 'https://tnze.yyyy.games/#/', label: '制作模拟器 by Tnze' },
            { url: 'https://asvel.github.io/ffxiv-gearing/', label: '配装模拟器 by Asvel' },
            { url: 'https://fish.ffmomola.com/#/', label: '鱼糕 by 红豆年糕' },
            { url: 'https://cn.ff14angler.com/', label: '饥饿的猫' },
          ], 'ref-oth-tool'),
        }
      ],
    },
    /* 实用工具 */
    {
      key: 'tools',
      icon: CasesRound,
      label: t('common.appfunc.useful_tools'),
      options: [
        {
          type: 'router',
          icon: HomeOutlined,
          label: t('common.back_to_index'),
          description: '',
          hide: !isMobile.value,
          routerKey: '',
          allowNewWindow: false,
        },
        {
          type: 'router',
          icon: AccessAlarmsOutlined,
          label: t('common.appfunc.gather_clock'),
          description: t('appheader.menu.tooltip.gather_clock'),
          routerKey: 'gatherclock',
          allowNewWindow: true,
          defaultNewWindowOption: {
            width: 390,
            height: 730,
            top: 120,
            left: 150
          },
        },
        {
          type: 'router',
          icon: FastfoodOutlined,
          label: t('common.appfunc.cal_food_and_tinc'),
          description: t('appheader.menu.tooltip.fthelper'),
          routerKey: 'fthelper',
          allowNewWindow: true,
          defaultNewWindowOption: {
            width: 1600,
            height: 800,
            top: 120,
            left: 45
          },
        },
        {
          type: 'router',
          icon: TaskAltOutlined,
          label: t('common.appfunc.cshelper'),
          description: t('appheader.menu.tooltip.cshelper'),
          routerKey: 'cshelper',
          allowNewWindow: true,
          defaultNewWindowOption: {
            width: 1600,
            height: 800,
            top: 120,
            left: 45
          },
        },
        {
          type: 'router',
          icon: CheckroomFilled,
          label: t('common.appfunc.fchelper'),
          description: t('appheader.menu.tooltip.fchelper'),
          routerKey: 'fchelper',
          allowNewWindow: true,
          defaultNewWindowOption: {
            width: 1600,
            height: 800,
            top: 120,
            left: 45
          },
        },
        {
          type: 'router',
          icon: WavesOutlined,
          label: t('common.appfunc.workflow'),
          description: t('appheader.menu.tooltip.workflow'),
          routerKey: 'workflow',
          allowNewWindow: false,
        },
        {
          type: 'router',
          icon: CodeOutlined,
          label: t('common.appfunc.macro_manage'),
          description: t('appheader.menu.tooltip.macro_manage'),
          hide: isMobile.value,
          routerKey: 'macromanage',
          allowNewWindow: false,
        },
      ]
    },
    /* 设置与更新 */
    {
      key: 'settings_and_updates',
      label: t('common.appfunc.setting_and_update'),
      icon: UpdateOutlined,
      options: [
        {
          type: 'common',
          label: t('common.appfunc.switch_theme'),
          icon: theme.value === 'light' ? DarkModeTwotone : LightModeTwotone,
          description: theme.value === 'light' ? t('appheader.menu.tooltip.theme_switch_to_dark') : t('appheader.menu.tooltip.theme_switch_to_light'),
          click: switchTheme
        },
        {
          type: 'common',
          label: t('common.appfunc.user_preference'),
          icon: SettingsSharp,
          description: t('appheader.menu.tooltip.user_preference'),
          click: () => {
            showPreferencesModal.value = true
          },
          mobileClick: () => {
            preferenceModalShowUpOnly.value = true
            preferenceModalShowFpOnly.value = false
            showPreferencesModal.value = true
          }
        },
        {
          type: 'common',
          label: t('common.appfunc.func_setting'),
          icon: SettingsSuggestFilled,
          hide: !isMobile.value,
          mobileClick: () => {
            preferenceModalShowUpOnly.value = false
            preferenceModalShowFpOnly.value = true
            showPreferencesModal.value = true
          }
        },
        {
          type: 'common',
          label: t('common.appfunc.ingame_inventory'),
          icon: BackpackFilled,
          description: t('appheader.menu.tooltip.ingame_inventory'),
          click: () => {
            showInventoryModal.value = true
          },
        },
        {
          type: 'common',
          label: t('common.appfunc.check_updates'),
          icon: UpdateSharp,
          description: t('appheader.menu.tooltip.check_updates'),
          click: handleCheckUpdates
        },
        {
          type: 'common',
          label: t('common.appfunc.changelog'),
          icon: EventNoteFilled,
          description: t('appheader.menu.tooltip.changelog'),
          click: () => {
            showChangeLogsModal.value = true
          }
        },
        {
          type: 'common',
          label: t('common.appfunc.devtool'),
          icon: DevicesOtherOutlined,
          description: t('appheader.menu.tooltip.devtool'),
          hide: !canOpenDevTools.value,
          click: () => {
            window.electronAPI!.openDevTools()
          }
        },
      ],
    },
    /* 关于 */
    {
      key: 'about',
      label: t('common.appfunc.about'),
      icon: InfoFilled,
      options: [
        {
          type: 'common',
          label: '常见问题',
          icon: HelpOutlineOutlined,
          description: '也有不常见的。',
          hide: store.userConfig.language_ui !== 'zh',
          click: () => {
            visitUrl('https://docs.qq.com/doc/DY3pPZmRGRHpubEFi')
          }
        },
        {
          type: 'common',
          label: t('common.appfunc.contact_us'),
          icon: ContactlessOutlined,
          description: t('appheader.menu.tooltip.contact_us'),
          click: () => {
            showContactModal.value = true
          }
        },
        {
          type: 'common',
          label: t('common.appfunc.donate_us'),
          icon: HandshakeOutlined,
          description: t('appheader.menu.tooltip.donate_us'),
          click: () => {
            showDonateModal.value = true
          }
        },
        {
          type: 'common',
          label: t('common.appfunc.about_app'),
          icon: InfoOutlined,
          description: t('appheader.menu.tooltip.about_app'),
          click: () => {
            showAboutAppModal.value = true
          }
        },
        {
          type: 'divider',
          hide: !!window.electronAPI || isMobile.value,
        },
        {
          type: 'router',
          icon: DevicesOutlined,
          label: t('common.appfunc.download_client'),
          hide: !!window.electronAPI || !!window.androidAPI,
          description: t('appheader.menu.tooltip.download_client'),
          routerKey: 'download',
          allowNewWindow: false,
        },
      ],
    },
  ]
  return data
})

const desktopMenuData = computed(() => {
  return menuData.value.map(menuitem => {
    return {
      key: menuitem.key,
      icon: menuitem.icon,
      label: menuitem.label,
      hide: menuitem.hide,
      disabled: menuitem.disabled,
      click: menuitem.click,
      options: menuitem.options?.map((option, optionIndex) => {
        const builtOption = buildMenuOption(option)
        builtOption.key = `${menuitem.key}-${optionIndex}`
        return builtOption
      })
    }
  })
})
const mobileMenuData = computed(() => {
  const mobileOptions: CommonMenuOption[] = []
  menuData.value.forEach(({ options }) => {
    options?.forEach(option => {
      if (option.type === 'common' && !option.hide) {
        mobileOptions.push(option)
      } else if (option.type === 'router' && !option.hide) {
        const {
          currentlyOnPage, redirectToPage,
        } = resolveRouterMenuOption(option)
        mobileOptions.push({
          type: 'common',
          icon: option.icon,
          label: option.label,
          disabled: option.disabled || currentlyOnPage,
          click: redirectToPage,
        })
      }
    })
  })
  return mobileOptions.map(option => {
    return {
      icon: option.icon,
      label: option.label,
      hide: option.hide,
      disabled: option.disabled,
      click: option.mobileClick ?? option.click,
    }
  })
})

const buildMenuOption = (menuOption : MyMenuOption) : DropdownOption => {
  if (menuOption.type === 'divider') {
    return { type: 'divider', hide: menuOption.hide }
  } else if (menuOption.type === 'router') {
    const { customRenderer } = resolveRouterMenuOption(menuOption)
    return {
      type: 'render',
      hide: menuOption.hide,
      render: customRenderer,
    }
  } else {
    return {
      icon: renderIcon(menuOption.icon),
      label: menuOption.label,
      description: menuOption.description,
      hide: menuOption.hide,
      disabled: menuOption.disabled,
      children: menuOption.children,
      props: {
        class: 'select-none',
      },
      click: menuOption.click,
      customRenderer: menuOption.customRenderer
    }
  }
}
const buildOuterlinkOptions = (
  options: {
    url: string, label: string, description?: string
  }[],
  key: string,
  icon?: Component
) => {
  return options.map((option, index) => {
    return {
      key: `${key}-${index}`,
      icon: renderIcon(icon ?? OpenInNewOutlined),
      label: option.label,
      props: {
        class: 'select-none',
      },
      click: () => {
        visitUrl(option.url)
      },
      description: option.description ?? option.url
    }
  })
}
const buildOuterlinkGroups = (
  groups: {
    title: string
    options: {
      url: string, label: string, description?: string
    }[],
    key: string,
    icon?: Component
  }[]
) => {
  const renderGroupTitle = (title: string, groupIndex: number) => {
    return () => h(
      'div',
      {
        class: 'select-none',
        style: {
          padding: groupIndex ? '0 0.8em' : '0.2em 0.8em 0',
        }
      },
      [
        h('p', { class: 'font-bold' }, title),
      ]
    )
  }

  return groups.map((group, groupIndex) => {
    return [
      {
        key: group.key + '_title',
        type: 'render',
        render: renderGroupTitle(group.title, groupIndex)
      },
      ...group.options.map((option, optionIndex) => {
        return {
          key: `${group.key}-${optionIndex}`,
          icon: renderIcon(group.icon ?? OpenInNewOutlined),
          label: option.label,
          props: {
            style: 'margin: 0 1em; user-select: none;'
          },
          click: () => {
            visitUrl(option.url)
          },
          description: option.description ?? option.url,
        }
      }),
    ]
  }).flat()
}
const resolveRouterMenuOption = (menuOption: RouterMenuOption) => {
  const routerUrl = `/${menuOption.routerKey}`
  const pageUrl = document.location.origin + document.location.pathname + `#/${menuOption.routerKey}?mode=overlay`
  const currentlyOnPage = router.currentRoute.value.path === routerUrl
  const buttonGroupTooltip = currentlyOnPage ? t('appheader.menu.tooltip.already_in_page', menuOption.label) : menuOption.description
  const redirectToPage = () => {
    router.push(routerUrl)
    hideMenuDropdowns()
  }
  const openSubWindow = () => {
    const width = menuOption.defaultNewWindowOption?.width ?? 800
    const height = menuOption.defaultNewWindowOption?.height ?? 600
    const top = menuOption.defaultNewWindowOption?.top ?? 100
    const left = menuOption.defaultNewWindowOption?.left ?? 100
    if (window.electronAPI?.createNewWindow) {
      window.electronAPI.createNewWindow(
        menuOption.routerKey,
        pageUrl,
        width,
        height,
        menuOption.label
      )
    } else {
      window.open(
        pageUrl,
        menuOption.label,
        `height=${height}, width=${width}, top=${top}, left=${left}`
      )
    }
    hideMenuDropdowns()
  }
  const customRenderer = () => {
    return h(
      NTooltip,
      {
        keepAliveOnHover: false,
        placement: 'right',
        style: {
          width: 'max-content',
          display: isMobile.value ? 'none' : 'inherit',
        }
      },
      {
        trigger: () => h(
          'div',
          {
            class: 'w-full flex items-center gap-0.5',
            style: `
              padding: 0 4px;
            `,
          },
          [
            h(
              NButton,
              {
                quaternary: true,
                size: 'small',
                disabled: currentlyOnPage || menuOption.disabled,
                class: 'appheader-menu-button select-none',
                style: menuOption.allowNewWindow ? 'flex: 1;' : 'width: 100%;',
                onClick: redirectToPage,
              },
              {
                default: () => h(
                  'div',
                  { class: 'button-content' },
                  [
                    h(
                      'div',
                      { class: 'button-icon' },
                      [
                        h(NIcon, { size: 14 }, {
                          default: () => h(menuOption.icon)
                        })
                      ]
                    ),
                    menuOption.label
                  ]
                )
              }
            ),
            menuOption.allowNewWindow ? h(
              NButton,
              {
                quaternary: true,
                type: 'primary',
                size: 'small',
                disabled: currentlyOnPage || menuOption.disabled,
                class: 'n-square-button',
                title: t('appheader.menu.tooltip.open_in_new_window', menuOption.label),
                onClick: openSubWindow,
              },
              {
                default: () => h(NIcon, { size: 14 }, {
                  default: () => h(OpenInNewOutlined)
                })
              }
            ) : undefined,
          ].filter(item => !!item)
        ),
        default: () => h('span', buttonGroupTooltip)
      }
    )
  }
  return {
    currentlyOnPage,
    buttonGroupTooltip,
    redirectToPage,
    openSubWindow,
    customRenderer,
  }
}

// const showFestivalEgg = computed(() => {
//   const now = new Date()
//   const date = now.getDate()
//   return (now.getMonth() === 11) && ((date === 24 && now.getHours() >= 18) || date === 25)
// })
const isFoolsDay = computed(() => {
  const now = new Date()
  return now.getMonth() === 3 && now.getDate() === 1
})

const canRouteBack = computed(() => {
  return router.currentRoute.value.path !== '/'
})
const handleRouteBack = () => {
  router.push('/')
}

const handleDesktopMenuOptionSelect = (key: string, option: any) => {
  if (option?.click) {
    option.click()
  } else {
    console.log('[开发提示] 未分配点击事件', key, option)
  }
}
const defaultClickEvent = () => {}
const hideMenuDropdowns = () => {
  menuDropdownVisiGroup.value = menuDropdownVisiGroup.value.map(() => false)
}

const openModal = (click?: (() => void)) => {
  // close menus first
  showMenus.value = false
  // show modal by inject
  click?.()
}

const handleCheckUpdates = async () => {
  if (window.electronAPI?.clientVersion) {
    displayCheckUpdatesModal()
  } else if (window.androidAPI?.checkUpdate) {
    window.androidAPI.checkUpdate()
  } else {
    try {
      const checkUpdateResponse = await checkAppUpdates()
      if (checkUpdateResponse.success) {
        const versionContent = checkUpdateResponse.data!
        const currentVersion = AppStatus.Version
        if (currentVersion !== versionContent.hqhelper) {
          if (await confirm(t('update.message.ask_update_new_webversion', { v: versionContent.hqhelper }))) {
            const cacheKeys = await caches.keys()
            for (const name of cacheKeys) {
              await caches.delete(name)
            }
            location.reload()    
          }
        } else {
          NAIVE_UI_MESSAGE.success(t('update.message.already_latest'))
        }
      } else {
        NAIVE_UI_MESSAGE.error(checkUpdateResponse.message)
      }
    } catch (err) {
      NAIVE_UI_MESSAGE.error(t('update.message.check_update_failed'))
      NAIVE_UI_MESSAGE.error(String(err))
    }
  }
}
</script>

<template>
  <div class="app-header">
    <div class="router-back-container" v-if="useDesktopUi">
      <n-popover trigger="hover" :keep-alive-on-hover="false" style="max-width: 300px;">
        <template #trigger>
          <n-button text style="font-size: 35px" :disabled="!canRouteBack" @click="handleRouteBack">
            <n-icon>
              <ArrowCircleLeftOutlined />
            </n-icon>
          </n-button>
        </template>
        <div class="flex flex-col">
          <p>{{ t('appheader.tooltip.back_to_index') }}</p>
          <p v-if="!canRouteBack">{{ t('appheader.tooltip.already_in_index') }}</p>
        </div>
      </n-popover>
    </div>
    <div class="header-content">
      <div class="app-info">
        <HqLogo :size="isMobile ? 24 : 15" :nq="isFoolsDay" />
        <p class="app-name">{{ isFoolsDay ? 'NqHelper' : 'HqHelper' }}</p>

        <n-popover :trigger="isMobile ? 'click' : 'hover'" :keep-alive-on-hover="isMobile" style="max-width: 260px;">
          <template #trigger>
            <p>{{ AppStatus.Version }}</p>
          </template>
          <div class="flex flex-col">
            <p v-for="(tt, ttIndex) in versionTooltip" :key="`version-tooltip-${ttIndex}`">{{ tt }}</p>
          </div>
        </n-popover>

        <!-- <ChristmasTree v-if="showFestivalEgg" style="margin-left: 8px; cursor: pointer;" @click="displayFestivalEggModal" /> -->

        <n-divider vertical></n-divider>

        <n-popover :trigger="isMobile ? 'click' : 'hover'" :keep-alive-on-hover="isMobile">
          <template #trigger>
            <p>
              <span v-if="isChina"><i class="xiv eorzea-time-chs"></i></span>
              <span v-else><i class="xiv eorzea-time"></i></span>
              <span class="time-text">{{ currentET.gameTime }}</span>
            </p>
          </template>
          <div class="flex flex-col items-center justify-center">
            <p class="text-center">{{ t('game.eorzea_time') }}</p>
          </div>
        </n-popover>

        <div class="tail-contents" v-if="!useDesktopUi">
          <n-button ghost class="menu-button" @click="showMenus = !showMenus">
            <template #icon>
              <n-icon><menu-filled /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
      <n-divider v-if="useDesktopUi" style="margin: -1px 0 3px;" />
      <div class="app-menu" v-if="useDesktopUi">
        <n-dropdown
          size="small"
          placement="bottom-start"
          v-for="(item, itemIndex) in desktopMenuData"
          :key="'desktop-menu-' + itemIndex"
          v-model:show="menuDropdownVisiGroup[itemIndex]"
          :options="item.options?.filter(o => !o.hide)"
          :render-option="optionsRenderer"
          :trigger="item.options?.length ? 'hover' : 'manual'"
          @select="handleDesktopMenuOptionSelect"
        >
          <n-button
            size="tiny" tertiary
            v-show="!item?.hide"
            :disabled="item.disabled"
            class="select-none"
            @click="item.click ?? defaultClickEvent"
          >
            <template #icon>
              <n-icon><component :is="item.icon" /></n-icon>
            </template>
            {{ item.label }}
          </n-button>
        </n-dropdown>
      </div>
    </div>
    
    <n-drawer
      v-model:show="showMenus"
      placement="right"
      :width="250"
      :trap-focus="false"
      :block-scroll="false"
      to="#main-content"
    >
      <n-drawer-content>
        <div class="drawer">
          <AccountView />
          <n-divider style="margin: 12px 0 8px;" />
          <div class="drawer-main">
            <n-button
              v-for="(item, key) in mobileMenuData"
              :key="key"
              v-show="!item?.hide"
              :disabled="item.disabled"
              @click="openModal(item.click)"
            >
              <template #icon>
                <n-icon><component :is="item.icon" /></n-icon>
              </template>
              {{ item.label }}
            </n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <ModalPreferences
      v-model:show="showPreferencesModal"
      :app-show-up="preferenceModalShowUpOnly"
      :app-show-fp="preferenceModalShowFpOnly"
    />
    <ModalInventory v-model:show="showInventoryModal" />
    <ModalAboutApp v-model:show="showAboutAppModal" />
    <ModalContactUs v-model:show="showContactModal" />
    <ModalChangeLogs v-model:show="showChangeLogsModal" />
    <ModalDonate v-model:show="showDonateModal" />
  </div>
</template>

<style scoped>
/* Electron only */
.env-electron .app-header {
  z-index: 1;
  position: relative;
  .app-info {
    width: fit-content;
  }
  button, .app-info, .app-menu {
    -webkit-app-region: no-drag;
  }
}

/* All */
.app-header {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  user-select: none;

  .router-back-container {
    height: 100%;
    display: flex;
    align-items: center;
  }

  .header-content .app-info {
    display: flex;
    align-items: center;
    font-size: 15px;
    line-height: 1;
    margin: 5px 0;

    .app-name {
      margin: 0 5px 0 3px;
      font-weight: 600;
    }
    .time-text {
      margin-left: 5px;
      font-weight: 400;
    }
    .tail-contents {
      margin-left: auto;
      display: flex;

      .menu-button {
        margin-left: 20px;
      }
    }
  }
}
.drawer {
  display: flex;
  flex-direction: column;
  height: 100%;

  .drawer-main {
    flex: 1;
    display: flex;
    flex-flow: column;
    justify-content: start;
    gap: 8px;
    overflow-y: auto;
  }
}

/* Desktop */
@media screen and (min-width: 768px) {
  .app-header .header-content {
    .app-info, .app-menu {
      line-height: 1;
    }
  }
  .app-menu {
    display: flex;
    gap: 10px;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .app-header .header-content .app-info {
    height: 100%;
  }
  .header-content, .app-info {
    width: 100%;
  }
}
</style>