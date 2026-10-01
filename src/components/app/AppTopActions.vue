<script setup lang="ts">
import {
  DevicesOutlined,
  NotificationsOutlined,
  DarkModeTwotone,
  LightModeTwotone,
} from '@vicons/material'
import IconGithub from '@/assets/icons/external/github.svg'
import IconInfo from '@/assets/icons/info.svg'
import IconSuccess from '@/assets/icons/success.svg'
import IconWarning from '@/assets/icons/warning.svg'
import IconError from '@/assets/icons/error.svg'
import ModalDonate from '@/components/modals/ModalDonate.vue'
import AccountView from './AccountView.vue'
import { useStore } from '@/store'
import useConfig from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { useDialog } from '@/composables/useDialog'
import { useAppModals } from '@/composables/useAppModals'
import { qGroupInfo, githubInfo, otherSocialInfo } from '@/constants'
import { visitUrl } from '@/tools'

const store = useStore()
const { t } = useLocale()
const { theme, switchTheme } = useConfig()
const { confirm } = useDialog()
const { displayCheckUpdatesModal } = useAppModals()
const NAIVE_UI_MESSAGE = useMessage()

const isClient = computed(() => !!window.electronAPI)
const showDonateModal = ref(false)
const notifyBtnRef = ref<any>(null)

// #region 公告与通知逻辑
enum AnnouncementId {
  // used
  dawntrailEnd = 1,

  evercoldBeta = 3,
}

interface Announcement {
  id: AnnouncementId
  type?: 'info' | 'success' | 'warning' | 'error'
  title: string
  content: string[]
  actions?: {
    label: string
    onClick: () => void
  }[]
}

const announcements = computed((): Announcement[] => {
  return [
    {
      id: AnnouncementId.evercoldBeta,
      type: 'info',
      title: t('announcement.a_1.title.title'),
      content: [
        t('announcement.a_1.content.content_1'),
        t('announcement.a_1.content.content_2'),
        t('announcement.a_1.content.content_3'),
        t('announcement.a_1.content.content_4'),
      ],
      actions: [
        // { label: t('announcement.action.follow_us'), onClick: () => visitUrl('https://weibo.com/u/7870808507') },
        { label: t('announcement.action.join_q_group'), onClick: () => visitUrl(qGroupInfo.groupUrl) },
        { label: t('announcement.action.feedback_github'), onClick: () => visitUrl(githubInfo.newIssueUrl) },
        { label: t('announcement.action.feedback_qquery'), onClick: () => visitUrl(otherSocialInfo.qqQueryUrl) },
        // { label: t('common.appfunc.donate_us'), onClick: () => (showDonateModal.value = true) },
      ],
    },
  ]
})

const getAnnouncementIcon = (type?: Announcement['type']) => {
  switch (type) {
    case 'success':
      return IconSuccess
    case 'warning':
      return IconWarning
    case 'error':
      return IconError
    case 'info':
    default:
      return IconInfo
  }
}

const getAnnouncementTypeClass = (type?: Announcement['type']) => {
  switch (type) {
    case 'success':
      return 'text-primary'
    case 'warning':
      return 'text-warning'
    case 'error':
      return 'text-error'
    case 'info':
    default:
      return 'text-info'
  }
}

// 过滤掉已被用户忽略（不再显示）的公告
const activeAnnouncements = computed(() => {
  return announcements.value.filter(
    announcement => !store.mainCache.ignore_announcements.includes(announcement.id)
  )
})

// 未读数量：未读（不在 read_announcements 中）且未被忽略的公告
const unreadCount = computed(() => {
  const readList = store.mainCache.read_announcements || []
  return activeAnnouncements.value.filter(
    announcement => !readList.includes(announcement.id)
  ).length
})

// 面板显示控制与固定逻辑
const isPinned = ref(false)
const isHovered = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const isPanelOpen = computed(() => isPinned.value || isHovered.value)

const handleMouseEnter = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  isHovered.value = true
}

const handleMouseLeave = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  hideTimer = setTimeout(() => {
    isHovered.value = false
  }, 150)
}

const handleButtonClick = () => {
  if (isPinned.value) {
    // 当前已固定显示，点击后固定为不显示（关闭面板并取消固定）
    isPinned.value = false
    isHovered.value = false
  } else {
    // 当前未固定，点击后固定为显示
    isPinned.value = true
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null
  if (!target) return
  // 排除通知按钮本身
  if (notifyBtnRef.value?.$el?.contains(target)) return
  // 排除可能弹出的 naive 对话框或弹窗，防止操作确认框时面板意外关闭
  if (target.closest('.n-modal-container') || target.closest('.n-dialog') || target.closest('.n-modal-mask')) {
    return
  }
  isPinned.value = false
  isHovered.value = false
}

// 自动标记所有有效公告为已读
const markAllAsRead = () => {
  if (!activeAnnouncements.value.length) return
  if (!store.mainCache.read_announcements) {
    store.mainCache.read_announcements = []
  }
  let updated = false
  activeAnnouncements.value.forEach(a => {
    if (!store.mainCache.read_announcements.includes(a.id)) {
      store.mainCache.read_announcements.push(a.id)
      updated = true
    }
  })
  if (updated) {
    store.updateMainCache()
  }
}

// 打开面板时自动标为已读
watch(isPanelOpen, open => {
  if (open) {
    markAllAsRead()
  }
})

const handleIgnoreAnnouncement = async (aid: AnnouncementId) => {
  if (
    !(await confirm(
      t('announcement.message.ignore_confirm') + '\n' + t('common.message.operation_irreversible')
    ))
  ) {
    return
  }
  if (!store.mainCache.ignore_announcements.includes(aid)) {
    store.mainCache.ignore_announcements.push(aid)
    store.updateMainCache()
  }
  NAIVE_UI_MESSAGE.success(t('announcement.message.ignored'))
}

const handleIgnoreAll = async () => {
  if (
    !(await confirm(
      t('announcement.message.ignore_confirm') + '\n' + t('common.message.operation_irreversible')
    ))
  ) {
    return
  }
  activeAnnouncements.value.forEach(a => {
    if (!store.mainCache.ignore_announcements.includes(a.id)) {
      store.mainCache.ignore_announcements.push(a.id)
    }
  })
  store.updateMainCache()
  NAIVE_UI_MESSAGE.success(t('announcement.message.ignored'))
}
// #endregion

// #region 客户端与 GitHub 操作
const handleClientBtnClick = () => {
  if (isClient.value) {
    displayCheckUpdatesModal()
  } else {
    const params = [
      `lang=${store.userConfig.language_ui}`,
      `theme=${theme.value}`,
    ].join('&')
    window.open(`https://download.hqhelper.com?${params}`, '_blank')
  }
}

const handleOpenGithub = () => {
  visitUrl(githubInfo.repoUrl)
}
// #endregion
</script>

<template>
  <div class="app-top-actions">
    <!-- 工具操作组 -->
    <n-button-group size="small">
      <!-- 切换主题 -->
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button
            round
            strong
            secondary
            size="small"
            class="top-action-btn__edge-left"
            @click="switchTheme"
          >
            <template #icon>
              <n-icon :size="16">
                <DarkModeTwotone v-if="theme === 'light'" />
                <LightModeTwotone v-else />
              </n-icon>
            </template>
          </n-button>
        </template>
        {{ theme === 'light' ? t('common.appfunc.switch_to_dark') : t('common.appfunc.switch_to_light') }}
      </n-tooltip>

      <!-- 下载客户端 -->
      <n-tooltip v-if="!isClient" trigger="hover">
        <template #trigger>
          <n-button
            strong
            secondary
            size="small"
            class="top-action-btn"
            @click="handleClientBtnClick"
          >
            <template #icon>
              <n-icon :size="16">
                <DevicesOutlined />
              </n-icon>
            </template>
          </n-button>
        </template>
        {{ t('common.appfunc.download_client') }}
      </n-tooltip>

      <!-- GitHub -->
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button
            round
            strong
            secondary
            size="small"
            class="top-action-btn__edge-right"
            @click="handleOpenGithub"
          >
            <template #icon>
              <n-icon :size="16">
                <component :is="IconGithub" />
              </n-icon>
            </template>
          </n-button>
        </template>
        GitHub
      </n-tooltip>
    </n-button-group>

    <!-- 账号与通知组 -->
    <n-button-group>
      <!-- 账号登录 -->
      <AccountView trigger-class="top-action-account-btn account" />

      <!-- 通知中心 -->
      <n-popover
        :show="isPanelOpen"
        trigger="manual"
        placement="bottom-end"
        :style="{ width: '320px', maxWidth: '90vw' }"
        :on-clickoutside="handleClickOutside"
      >
        <template #trigger>
          <n-button
            ref="notifyBtnRef"
            round
            strong
            secondary
            size="small"
            class="top-action-btn__edge-right"
            :class="{ 'is-active': isPinned }"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
            @click="handleButtonClick"
          >
            <template #icon>
              <n-badge dot :show="unreadCount > 0" :offset="[-1, 1]">
                <n-icon :size="16"><NotificationsOutlined /></n-icon>
              </n-badge>
            </template>
          </n-button>
        </template>

        <div
          class="notification-panel"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <div class="flex items-center justify-between text-app-base font-bold text-text px-1">
            <div class="flex items-center gap-1.5">
              <n-icon :size="16"><NotificationsOutlined /></n-icon>
              <span>{{ t('announcement.title.notification_center') }}</span>
            </div>
            <n-button
              v-show="false"
              quaternary
              size="tiny"
              type="error"
              @click="handleIgnoreAll"
            >
              {{ t('announcement.action.ignore_all') }}
            </n-button>
          </div>
          <n-divider style="margin: 6px 0 4px;" />

          <n-scrollbar trigger="none" style="max-height: 450px">
            <div v-if="activeAnnouncements.length" class="flex flex-col">
              <template
                v-for="(item, index) in activeAnnouncements"
                :key="'anno-' + item.id"
              >
                <!-- 多个通知之间的分隔线 -->
                <n-divider v-if="index > 0" style="margin: 6px 0;" />

                <!-- 单个通知项 -->
                <div class="px-2 py-1 rounded transition-colors duration-150 hover:bg-bg-hover">
                  <!-- [图标] 标题 -->
                  <div class="flex items-center gap-1 leading-snug">
                    <n-icon :size="24" class="shrink-0" :class="getAnnouncementTypeClass(item.type)">
                      <component :is="getAnnouncementIcon(item.type)" />
                    </n-icon>
                    <span class="font-semibold text-app-base text-text wrap-break-word">{{ item.title }}</span>
                  </div>

                  <!-- 内容 -->
                  <div class="mt-1 ml-7 text-app-xs text-sub leading-relaxed space-y-1">
                    <p v-for="(line, idx) in item.content" :key="idx" class="m-0 wrap-break-word">{{ line }}</p>
                  </div>

                  <!-- 操作按钮 -->
                  <template v-if="item.actions?.length">
                    <n-divider class="my-1!" />
                    <div class="flex items-center flex-wrap gap-1">
                      <n-button
                        v-for="(act, actIdx) in item.actions"
                        :key="actIdx"
                        quaternary
                        type="info"
                        size="tiny"
                        @click="act.onClick"
                      >
                        {{ act.label }}
                      </n-button>
                      <n-button
                        v-show="false"
                        quaternary
                        type="error"
                        size="tiny"
                        @click="handleIgnoreAnnouncement(item.id)"
                      >
                        {{ t('announcement.action.ignore') }}
                      </n-button>
                    </div>
                  </template>
                </div>
              </template>
            </div>
            <n-empty
              v-else
              size="small"
              :description="t('announcement.message.no_announcements')"
              class="py-8"
            />
          </n-scrollbar>
        </div>
      </n-popover>
    </n-button-group>

    <!-- 弹窗 -->
    <ModalDonate v-model:show="showDonateModal" />
  </div>
</template>

<style scoped>
.app-top-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  :deep(button:not(:first-child)) {
    border-left: 1px solid var(--app-color-background-embedded);
  }
}

.top-action-btn {
  width: 32px;
  height: 28px;
  padding: 0 !important;
  border-left: 1px solid var(--app-color-background-embedded) !important;
}
.top-action-btn__edge-left {
  padding: 0 6px 0 8px !important;
}
.top-action-btn__edge-right {
  padding: 0 8px 0 6px !important;
  border-left: 1px solid var(--app-color-background-embedded) !important;
}
.top-action-account-btn,
:deep(.n-button.top-action-account-btn.account) {
  padding: 0 8px 0 14px !important;
}

:deep(.n-button.top-action-btn:hover),
:deep(.n-button.top-action-btn:focus),
:deep(.n-button.top-action-btn__edge-left:hover),
:deep(.n-button.top-action-btn__edge-left:focus),
:deep(.n-button.top-action-btn__edge-right:hover),
:deep(.n-button.top-action-btn__edge-right:focus),
:deep(.n-button.top-action-account-btn.account:hover),
:deep(.n-button.top-action-account-btn.account:focus) {
  z-index: 2;
}

:deep(.n-button.top-action-btn__edge-left.is-active),
:deep(.n-button.top-action-btn__edge-right.is-active) {
  color: var(--app-color-primary);
  z-index: 2;
}

/* 通知面板样式 */
.notification-panel {
  display: flex;
  flex-direction: column;
}
</style>
