<script setup lang="ts">
import { h } from 'vue'
import { NTag, type DataTableColumns, type InputInst, type ScrollbarInst } from 'naive-ui'
import {
  ArrowBackOutlined,
  CloseSharp,
  HistoryOutlined,
  RefreshOutlined,
  SendOutlined,
} from '@vicons/material'
import { useLocale } from '@/composables/useLocale'
import { useNbbCloud } from '@/composables/useNbbCloud'
import { useAppModals } from '@/composables/useAppModals'
import { useCooldown } from '@/composables/useCooldown'
import { useDialog } from '@/composables/useDialog'
import { useResponsive } from '@/composables/useResponsive'
import { useServerNotice } from '@/composables/useServerNotice'
import {
  formatFeedbackBanText,
  formatFeedbackIsoTime,
  mergeFeedbackTimeline,
} from '@/tools/feedback'
import type {
  FeedbackFollowup,
  FeedbackRecord,
  FeedbackStatus,
  FeedbackType,
} from '@/types/api/nbb-cloud'

const { t } = useLocale()
const { isMobile } = useResponsive()
const NAIVE_UI_MESSAGE = useMessage()
const { alertError } = useDialog()
const { getFeedbackList, appendFeedback, updateUserInfoExt } = useNbbCloud()
const { feedbackBanned, feedbackBanExpiresAt } = useServerNotice()
const { highlightFeedbackId } = useAppModals()
const { cooldownSeconds, startCooldown } = useCooldown()

const showModal = defineModel<boolean>('show', { required: true })

const loading = ref(false)
const records = ref<FeedbackRecord[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRecord = ref<FeedbackRecord | null>(null)

const detailScrollbarRef = ref<ScrollbarInst | null>(null)
const appendInputRef = ref<InputInst | null>(null)
const appendContent = ref('')
const appendDrafts = ref<Record<number, string>>({})
const isAppending = ref(false)
const appendInputId = useId()
const appendHintId = useId()

const banExpireText = computed(() => {
  return formatFeedbackBanText(feedbackBanExpiresAt.value, t)
})

const timelineItems = computed(() => {
  if (!selectedRecord.value) return []
  return mergeFeedbackTimeline(selectedRecord.value)
})

const canAppend = computed(() => {
  if (!selectedRecord.value) return false
  return selectedRecord.value.status !== 'resolved' && selectedRecord.value.status !== 'closed'
})

watch(() => selectedRecord.value?.id, (newId, oldId) => {
  if (oldId !== undefined) {
    appendDrafts.value[oldId] = appendContent.value
  }
  appendContent.value = newId !== undefined ? (appendDrafts.value[newId] || '') : ''
})

const getTypeTagType = (type: FeedbackType): "error" | "info" => {
  return type === 'bug' ? 'error' : 'info'
}

const getTypeLabel = (type: FeedbackType) => {
  return type === 'bug' ? t('feedback.type.bug') : t('feedback.type.feat')
}

const getStatusTagType = (status: FeedbackStatus): "warning" | "info" | "success" | "default" => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'processing':
      return 'info'
    case 'resolved':
      return 'success'
    case 'closed':
    default:
      return 'default'
  }
}

const getStatusLabel = (status: FeedbackStatus) => {
  switch (status) {
    case 'pending':
      return t('feedback.status.pending')
    case 'processing':
      return t('feedback.status.processing')
    case 'resolved':
      return t('feedback.status.resolved')
    case 'closed':
      return t('feedback.status.closed')
    default:
      return status
  }
}

const tableColumns = computed((): DataTableColumns<FeedbackRecord> => {
  const cols: DataTableColumns<FeedbackRecord> = [
    {
      title: t('feedback.field.type'),
      key: 'type',
      width: 96,
      align: 'center',
      render(row) {
        return h(
          NTag,
          {
            size: 'small',
            bordered: false,
            type: getTypeTagType(row.type),
          },
          { default: () => getTypeLabel(row.type) }
        )
      },
    },
    {
      title: t('feedback.field.title'),
      key: 'title',
    },
    {
      title: t('feedback.field.status'),
      key: 'status',
      width: 90,
      align: 'center',
      render(row) {
        return h(
          NTag,
          {
            size: 'small',
            bordered: false,
            type: getStatusTagType(row.status),
          },
          { default: () => getStatusLabel(row.status) }
        )
      },
    },
  ]

  if (!isMobile.value) {
    cols.push({
      title: t('feedback.field.created_at'),
      key: 'createdAt',
      width: 165,
      align: 'center',
      render(row) {
        return h(
          'span',
          { class: 'text-app-xs' },
          formatFeedbackIsoTime(row.createdAt)
        )
      },
    })
  }

  return cols
})

const rowProps = (row: FeedbackRecord) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      selectedRecord.value = row
    },
  }
}

/**
 * 加载反馈列表，若指定了 targetFeedbackId 则自动定位并打开该反馈详情
 */
const loadFeedbackRecords = async (targetPage = 1, targetFeedbackId?: number) => {
  loading.value = true
  try {
    const response = await getFeedbackList(targetPage, pageSize.value)
    if (response.errno) {
      NAIVE_UI_MESSAGE.error(response.errmsg || t('common.load_failed'))
      return
    }
    if (!response.data) return

    records.value = response.data.list || []
    total.value = response.data.total || 0
    page.value = response.data.page || targetPage

    // 若需要直接定位到某条反馈详情
    if (targetFeedbackId) {
      const matched = records.value.find(r => r.id === targetFeedbackId)
      if (matched) {
        selectedRecord.value = matched
        highlightFeedbackId.value = undefined
        return
      }
      // 如果第 1 页未找到且还有后续页，继续查找所在页
      const totalPages = Math.ceil(total.value / pageSize.value)
      for (let p = 2; p <= totalPages; p++) {
        const pageRes = await getFeedbackList(p, pageSize.value)
        if (!pageRes.errno && pageRes.data?.list) {
          const found = pageRes.data.list.find(r => r.id === targetFeedbackId)
          if (found) {
            records.value = pageRes.data.list
            page.value = p
            selectedRecord.value = found
            highlightFeedbackId.value = undefined
            return
          }
        }
      }
      highlightFeedbackId.value = undefined
    } else if (selectedRecord.value) {
      // 刷新时若当前正处于详情视图，同步更新详情数据
      const updated = records.value.find(r => r.id === selectedRecord.value?.id)
      if (updated) {
        selectedRecord.value = updated
      }
    }
  } catch (err: any) {
    NAIVE_UI_MESSAGE.error(err?.message || t('common.load_failed'))
  } finally {
    loading.value = false
  }
}

/**
 * 同步新追加的回复到本地当前详情与列表缓存
 */
const applyAppendedFollowup = (
  targetRecord: FeedbackRecord,
  newFollowup: FeedbackFollowup,
) => {
  const patchRecord = (rec: FeedbackRecord) => {
    rec.followups = [...(rec.followups || []), newFollowup]
    rec.updatedAt = newFollowup.createdAt
  }
  patchRecord(targetRecord)
  const recordInList = records.value.find(r => r.id === targetRecord.id)
  if (recordInList && recordInList !== targetRecord) {
    patchRecord(recordInList)
  }
}

const handleAppend = async () => {
  const currentRecord = selectedRecord.value
  if (!currentRecord || isAppending.value) return

  if (!canAppend.value) {
    NAIVE_UI_MESSAGE.error(t('feedback.message.append_closed'))
    return
  }
  if (feedbackBanned.value) {
    await alertError(banExpireText.value)
    return
  }
  if (cooldownSeconds.value > 0) {
    NAIVE_UI_MESSAGE.warning(t('feedback.message.append_rate_limited', { sec: cooldownSeconds.value }))
    return
  }

  const content = appendContent.value.trim()
  if (!content) {
    NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('feedback.field.append_content')))
    appendInputRef.value?.focus()
    return
  }
  if (content.length > 5000) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.key_is_too_long', { key: t('feedback.field.append_content') }))
    appendInputRef.value?.focus()
    return
  }

  try {
    isAppending.value = true
    const targetId = currentRecord.id
    const response = await appendFeedback({
      feedbackId: targetId,
      content,
    })

    if (!response.errno) {
      NAIVE_UI_MESSAGE.success(t('feedback.message.append_succeed'))
      appendContent.value = ''
      delete appendDrafts.value[targetId]

      applyAppendedFollowup(currentRecord, {
        id: response.data?.id ?? Date.now(),
        content: response.data?.content ?? content,
        createdAt: response.data?.createdAt ?? new Date().toISOString(),
      })

      const nextCd = typeof response.data?.cooldownSeconds === 'number'
        ? response.data.cooldownSeconds
        : 30
      startCooldown(nextCd)

      await nextTick()
      detailScrollbarRef.value?.scrollTo({ top: 999999, behavior: 'smooth' })
    } else if (response.errno === 2) {
      await updateUserInfoExt()
      await alertError(response.errmsg || banExpireText.value)
    } else if (response.errno === 3) {
      if (response.data?.retryAfter) {
        startCooldown(response.data.retryAfter)
      }
      NAIVE_UI_MESSAGE.warning(
        response.errmsg || t('feedback.message.append_rate_limited', { sec: response.data?.retryAfter ?? 0 })
      )
    } else if (response.errno === 6) {
      NAIVE_UI_MESSAGE.error(response.errmsg || t('feedback.message.append_closed'))
      await loadFeedbackRecords(page.value)
    } else {
      NAIVE_UI_MESSAGE.error(response.errmsg || t('feedback.message.append_failed'))
    }
  } catch (err: any) {
    NAIVE_UI_MESSAGE.error(err?.message || t('feedback.message.append_failed'))
  } finally {
    isAppending.value = false
  }
}

const handleAppendKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (e.isComposing || e.keyCode === 229) return
    e.preventDefault()
    handleAppend()
  }
}

const onLoad = () => {
  const targetId = highlightFeedbackId.value
  if (!targetId) {
    selectedRecord.value = null
  }
  loadFeedbackRecords(1, targetId)
}

watch(highlightFeedbackId, newId => {
  if (showModal.value && newId) {
    loadFeedbackRecords(1, newId)
  }
})

const handlePageChange = (newPage: number) => {
  loadFeedbackRecords(newPage)
}

const extraHeaderButtons = computed(() => [
  {
    text: t('common.refresh'),
    icon: RefreshOutlined,
    onClick: () => loadFeedbackRecords(page.value),
  },
])
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="HistoryOutlined"
    :title="t('feedback.title.history')"
    :extra-header-buttons="extraHeaderButtons"
    max-width="700px"
    @on-load="onLoad"
  >
    <n-spin :show="loading">
      <!-- 反馈详情视图 (固定高度) -->
      <div v-if="selectedRecord" class="h-110 flex flex-col gap-2">
        <div class="flex items-center gap-2 shrink-0 pr-1">
          <n-button
            size="small" dashed
            class="w-full justify-start"
            @click="selectedRecord = null"
          >
            <template #icon>
              <n-icon><ArrowBackOutlined /></n-icon>
            </template>
            {{ t('feedback.action.back_to_list') }}
          </n-button>
        </div>
        <n-scrollbar ref="detailScrollbarRef" trigger="none" class="flex-1 pr-1">
          <div class="flex flex-col gap-2.5 select-text">
            <!-- 头部信息栏 -->
            <n-card embedded size="small">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col gap-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <n-tag size="small" :bordered="false" :type="getTypeTagType(selectedRecord.type)">
                      {{ getTypeLabel(selectedRecord.type) }}
                    </n-tag>
                    <n-tag size="small" :bordered="false" :type="getStatusTagType(selectedRecord.status)">
                      {{ getStatusLabel(selectedRecord.status) }}
                    </n-tag>
                    <span class="font-bold text-app-base text-text wrap-break-word">
                      {{ selectedRecord.title }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-app-2xs text-sub select-none">
                    <span>{{ formatFeedbackIsoTime(selectedRecord.createdAt) }}</span>
                    <span v-if="selectedRecord.updatedAt && selectedRecord.updatedAt !== selectedRecord.createdAt">
                      {{ t('feedback.field.updated_at') }}：{{ formatFeedbackIsoTime(selectedRecord.updatedAt) }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <div class="text-app-sm text-text whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {{ selectedRecord.content }}
                  </div>

                  <div v-if="selectedRecord.contact" class="text-app-xs text-sub">
                    <span class="font-bold select-none">{{ t('feedback.field.contact') }}：</span>
                    <span>{{ selectedRecord.contact }}</span>
                  </div>

                  <div v-if="selectedRecord.images?.length" class="flex flex-wrap gap-2 pt-0.5">
                    <n-image-group>
                      <n-image
                        v-for="(imgUrl, imgIdx) in selectedRecord.images"
                        :key="imgIdx"
                        :src="imgUrl"
                        width="76"
                        height="76"
                        object-fit="cover"
                        class="rounded border border-border overflow-hidden"
                      />
                    </n-image-group>
                  </div>
                </div>
              </div>
            </n-card>

            <!-- 对话时间线（管理员批复与用户追加按时间正序排列） -->
            <n-card embedded size="small">
              <div class="flex flex-col gap-2">
                <div class="text-app-xs font-bold text-text select-none">
                  {{ t('feedback.text.conversation') }}
                </div>
                <template v-if="timelineItems.length">
                  <div
                    v-for="item in timelineItems"
                    :key="item.key"
                    class="p-2 rounded border flex flex-col gap-1"
                    :class="item.role === 'admin'
                      ? 'bg-bg-hover border-border'
                      : 'bg-primary/5 border-primary/30'"
                  >
                    <div class="flex flex-wrap items-center justify-between gap-1.5">
                      <div class="flex flex-wrap items-center gap-1.5 select-none">
                        <n-tag
                          size="small"
                          :bordered="false"
                          :type="item.role === 'admin' ? 'warning' : 'primary'"
                        >
                          {{ item.role === 'admin' ? t('feedback.role.admin') : t('feedback.role.me') }}
                        </n-tag>
                      </div>
                      <span class="text-app-2xs text-sub select-none">
                        {{ formatFeedbackIsoTime(item.createdAt) }}
                      </span>
                    </div>
                    <div class="text-app-xs text-text whitespace-pre-wrap wrap-break-word leading-relaxed">
                      {{ item.content }}
                    </div>
                  </div>
                </template>
                <div v-else class="text-app-xs text-sub select-none py-1">
                  {{ t('feedback.text.no_conversation') }}
                </div>

                <div
                  v-if="!canAppend"
                  class="text-app-xs text-sub select-none pt-1.5 border-t border-border"
                >
                  {{ t('feedback.text.append_disabled_by_status', { status: getStatusLabel(selectedRecord.status) }) }}
                </div>
              </div>
            </n-card>

            <!-- 追加反馈回复 -->
            <template v-if="canAppend">
              <n-alert
                v-if="feedbackBanned"
                type="error"
                :title="t('feedback.message.banned_title')"
              >
                {{ banExpireText }}
              </n-alert>

              <n-card embedded size="small">
                <form class="flex flex-col gap-2" @submit.prevent="handleAppend">
                  <label :for="appendInputId" class="text-app-xs font-bold text-text select-none">
                    {{ t('feedback.field.append_content') }}
                  </label>
                  <n-input
                    ref="appendInputRef"
                    v-model:value="appendContent"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    :maxlength="5000"
                    show-count
                    :disabled="feedbackBanned || isAppending"
                    :placeholder="t('feedback.placeholder.append_content')"
                    :input-props="{
                      id: appendInputId,
                      name: 'appendContent',
                      'aria-describedby': appendHintId,
                    }"
                    @keydown="handleAppendKeydown"
                  />
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span :id="appendHintId" class="text-app-2xs text-sub select-none">
                      {{ isMobile ? t('feedback.text.append_plain_text_tip') : t('feedback.text.append_shortcut_tip') }}
                    </span>
                    <n-button
                      type="primary"
                      size="small"
                      attr-type="submit"
                      :loading="isAppending"
                      :disabled="isAppending || feedbackBanned || cooldownSeconds > 0"
                    >
                      <template #icon>
                        <n-icon><SendOutlined /></n-icon>
                      </template>
                      {{
                        cooldownSeconds > 0
                          ? t('feedback.action.submit_cooldown', { sec: cooldownSeconds })
                          : t('feedback.action.append_submit')
                      }}
                    </n-button>
                  </div>
                </form>
              </n-card>
            </template>
          </div>
        </n-scrollbar>
      </div>

      <!-- 反馈列表视图 (固定高度) -->
      <div v-else class="h-110 flex flex-col gap-2.5">
        <n-data-table
          bordered
          flex-height
          size="small"
          :columns="tableColumns"
          :data="records"
          :row-key="(row: FeedbackRecord) => row.id"
          :row-props="rowProps"
          :pagination="false"
          class="flex-1"
        >
          <template #empty>
            <n-empty size="small" :description="t('feedback.message.no_records')" />
          </template>
        </n-data-table>

        <div v-if="total > pageSize" class="flex justify-end shrink-0">
          <n-pagination
            v-model:page="page"
            :page-size="pageSize"
            :item-count="total"
            size="small"
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </n-spin>

    <template #action>
      <div class="app-modal-footer">
        <n-button size="large" @click="showModal = false">
          <template #icon>
            <n-icon><CloseSharp /></n-icon>
          </template>
          {{ t('common.close') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>
