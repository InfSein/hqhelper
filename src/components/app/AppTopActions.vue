<script setup lang="ts">
import {
  DevicesOutlined,
  NotificationsOutlined,
  DarkModeTwotone,
  LightModeTwotone,
} from '@vicons/material'
import IconGithub from '@/assets/icons/external/IconGithub.vue'
import ModalDonate from '@/components/modals/ModalDonate.vue'
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
  dawntrailEnd = 2,
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
      id: AnnouncementId.dawntrailEnd,
      type: 'success',
      title: t('announcement.title.title_1'),
      content: [
        t('announcement.content.content_1_1'),
        t('announcement.content.content_1_2'),
        t('announcement.content.content_1_3'),
        t('announcement.content.content_1_4'),
      ],
      actions: [
        { label: t('announcement.action.follow_us'), onClick: () => visitUrl('https://weibo.com/u/7870808507') },
        { label: t('announcement.action.join_q_group'), onClick: () => visitUrl(qGroupInfo.groupUrl) },
        { label: t('announcement.action.feedback_github'), onClick: () => visitUrl(githubInfo.newIssueUrl) },
        { label: t('announcement.action.feedback_qquery'), onClick: () => visitUrl(otherSocialInfo.qqQueryUrl) },
        { label: t('common.appfunc.donate_us'), onClick: () => (showDonateModal.value = true) },
      ],
    },
  ]
})

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
    <n-button-group size="small">
      <!-- 通知中心 -->
      <n-popover
        :show="isPanelOpen"
        trigger="manual"
        placement="bottom-end"
        :style="{ width: '380px', maxWidth: '90vw' }"
        :on-clickoutside="handleClickOutside"
      >
        <template #trigger>
          <n-button
            ref="notifyBtnRef"
            round
            strong
            secondary
            size="small"
            class="top-action-btn__edge-left"
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
          <div class="flex items-center gap-0.75 text-app-xl">
            <n-icon :size="16"><NotificationsOutlined /></n-icon>
            <span>{{ t('announcement.title.notification_center') }}</span>
          </div>
          <n-divider style="margin: 4px 0 8px;" />

          <n-scrollbar trigger="none" style="max-height: 300px">
            <div v-if="activeAnnouncements.length" class="announcement-list">
              <n-alert
                v-for="item in activeAnnouncements"
                :key="'anno-' + item.id"
                :type="item.type || 'info'"
                :title="item.title"
                class="announcement-alert"
              >
                <div class="announcement-alert-content">
                  <div class="announcement-text">
                    <p v-for="(line, idx) in item.content" :key="idx">{{ line }}</p>
                  </div>
                  <div class="announcement-actions">
                    <div class="action-buttons">
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
                    </div>
                    <n-button
                      quaternary
                      type="error"
                      size="tiny"
                      @click="handleIgnoreAnnouncement(item.id)"
                    >
                      {{ t('announcement.action.ignore') }}
                    </n-button>
                  </div>
                </div>
              </n-alert>
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

      <!-- 切换主题 -->
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button strong secondary size="small" class="top-action-btn" @click="switchTheme">
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
          <n-button strong secondary size="small" class="top-action-btn" @click="handleClientBtnClick">
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
          <n-button round strong secondary size="small" class="top-action-btn__edge-right" @click="handleOpenGithub">
            <template #icon>
              <IconGithub :size="16" />
            </template>
          </n-button>
        </template>
        GitHub
      </n-tooltip>
    </n-button-group>

    <!-- 弹窗 -->
    <ModalDonate v-model:show="showDonateModal" />
  </div>
</template>

<style scoped>
.app-top-actions {
  display: inline-flex;
  align-items: center;

  button:not(:first-child) {
    border-left: 1px solid var(--app-color-background-embedded);
  }
}

.top-action-btn {
  width: 32px;
  height: 28px;
  padding: 0 !important;
}
.top-action-btn__edge-left {
  padding: 0 6px 0 8px !important;
}
.top-action-btn__edge-right {
  padding: 0 8px 0 6px !important;
}

:deep(.n-button.top-action-btn:hover),
:deep(.n-button.top-action-btn:focus),
:deep(.n-button.top-action-btn__edge-left:hover),
:deep(.n-button.top-action-btn__edge-left:focus),
:deep(.n-button.top-action-btn__edge-right:hover),
:deep(.n-button.top-action-btn__edge-right:focus) {
  z-index: 2;
}

:deep(.n-button.top-action-btn__edge-left.is-active) {
  color: var(--app-color-primary);
  z-index: 2;
}

/* 通知面板样式 */
.notification-panel {
  display: flex;
  flex-direction: column;

  .announcement-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .announcement-alert {
    border-radius: 6px;

    .announcement-alert-content {
      .announcement-text {
        font-size: var(--app-font-size-xs);
        color: var(--app-color-text-sub);
        line-height: 1.5;

        p {
          margin: 2px 0;
        }
      }

      .announcement-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 6px;
        padding-top: 4px;
        border-top: 1px dashed var(--app-color-border);

        .action-buttons {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 2px;
        }
      }
    }
  }
}
</style>
