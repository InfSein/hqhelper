<script setup lang="ts">
import {
  DevicesOutlined,
  NotificationsOutlined,
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

// 过滤掉已被用户忽略的公告
const activeAnnouncements = computed(() => {
  return announcements.value.filter(
    announcement => !store.mainCache.ignore_announcements.includes(announcement.id)
  )
})

const unreadCount = computed(() => activeAnnouncements.value.length)

const handleIgnoreAnnouncement = async (aid: AnnouncementId) => {
  if (
    !(await confirm(
      t('announcement.message.ignore_confirm') + '\n' + t('common.message.operation_irreversible')
    ))
  ) {
    return
  }
  store.mainCache.ignore_announcements.push(aid)
  store.updateMainCache()
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

const getTagLabel = (type?: string) => {
  switch (type) {
    case 'success':
      return t('announcement.type.success')
    case 'warning':
      return t('announcement.type.warning')
    case 'error':
      return t('announcement.type.error')
    case 'info':
    default:
      return t('announcement.type.info')
  }
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
        trigger="click"
        placement="bottom-end"
        :style="{ width: '380px', maxWidth: '90vw', padding: '0' }"
      >
        <template #trigger>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button round strong secondary size="small" class="top-action-btn__edge-left">
                <template #icon>
                  <n-badge dot :show="unreadCount > 0" :offset="[-1, 1]">
                    <n-icon :size="16"><NotificationsOutlined /></n-icon>
                  </n-badge>
                </template>
              </n-button>
            </template>
            {{ t('announcement.tooltip') }}
          </n-tooltip>
        </template>

        <div class="notification-panel">
          <div class="panel-header">
            <div class="title-wrap">
              <span class="panel-title">{{ t('announcement.title.notification_center') }}</span>
              <n-tag
                v-if="unreadCount > 0"
                size="tiny"
                type="primary"
                round
                :bordered="false"
              >
                {{ unreadCount }}
              </n-tag>
            </div>
            <n-button
              v-if="unreadCount > 0"
              text
              type="primary"
              size="tiny"
              @click="handleIgnoreAll"
            >
              {{ t('announcement.action.ignore_all') }}
            </n-button>
          </div>

          <n-scrollbar style="max-height: 400px" class="panel-body">
            <div v-if="activeAnnouncements.length" class="announcement-list">
              <div
                v-for="item in activeAnnouncements"
                :key="'anno-' + item.id"
                class="announcement-card"
              >
                <div class="card-head">
                  <n-tag
                    :type="item.type || 'info'"
                    size="tiny"
                    round
                    :bordered="false"
                    class="shrink-0"
                  >
                    {{ getTagLabel(item.type) }}
                  </n-tag>
                  <span class="card-title">{{ item.title }}</span>
                </div>
                <div class="card-content">
                  <p v-for="(line, idx) in item.content" :key="idx">{{ line }}</p>
                </div>
                <div class="card-actions">
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

/* hover 提升层级保证边框高亮清晰完整 */
:deep(.n-button.top-action-btn:hover),
:deep(.n-button.top-action-btn:focus) {
  z-index: 2;
}

/* 通知面板样式 */
.notification-panel {
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px 8px;
    border-bottom: 1px solid var(--app-color-border);

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 6px;

      .panel-title {
        font-weight: bold;
        font-size: var(--app-font-size-sm);
        color: var(--app-color-text);
      }
    }
  }

  .panel-body {
    padding: 10px 14px;
  }

  .announcement-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .announcement-card {
    padding: 8px 10px;
    background-color: var(--app-color-background-embedded);
    border-radius: 6px;
    border: 1px solid var(--app-color-border);

    .card-head {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;

      .card-title {
        font-weight: bold;
        font-size: var(--app-font-size-xs);
        color: var(--app-color-text);
      }
    }

    .card-content {
      font-size: var(--app-font-size-xs);
      color: var(--app-color-text-sub);
      line-height: 1.5;
      margin-bottom: 8px;

      p {
        margin: 2px 0;
      }
    }

    .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 4px;
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
</style>
