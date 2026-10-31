<script setup lang="ts">
import { h } from 'vue'
import { NTag, type DataTableColumns } from 'naive-ui'
import {
  ArrowBackOutlined,
  CloseSharp,
  HistoryOutlined,
  RefreshOutlined,
} from '@vicons/material'
import { useLocale } from '@/composables/useLocale'
import { useNbbCloud } from '@/composables/useNbbCloud'
import { useAppModals } from '@/composables/useAppModals'
import { useResponsive } from '@/composables/useResponsive'
import { formatTimestamp } from '@/tools'
import type { FeedbackRecord, FeedbackStatus, FeedbackType } from '@/types/api/nbb-cloud'

const { t } = useLocale()
const { isMobile } = useResponsive()
const NAIVE_UI_MESSAGE = useMessage()
const { getFeedbackList } = useNbbCloud()
const { highlightFeedbackId } = useAppModals()

const showModal = defineModel<boolean>('show', { required: true })

const loading = ref(false)
const records = ref<FeedbackRecord[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRecord = ref<FeedbackRecord | null>(null)

const formatIsoTime = (iso?: string) => {
  if (!iso) return ''
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return iso
  return formatTimestamp(ts)
}

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
          formatIsoTime(row.createdAt)
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
        <div class="flex items-center shrink-0 pr-1">
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
        <n-scrollbar trigger="none" class="flex-1 pr-1">
          <div class="flex flex-col gap-2.5 select-text">
            <!-- 头部信息栏 -->
            <n-card embedded size="small">
              <div class="flex flex-col gap-1.5">
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
                <div class="text-app-2xs text-sub select-none">
                  {{ formatIsoTime(selectedRecord.createdAt) }}
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <div class="text-app-sm text-text whitespace-pre-wrap wrap-break-word leading-relaxed">
                  {{ selectedRecord.content }}
                </div>

                <div v-if="selectedRecord.contact" class="text-app-xs text-sub">
                  <span class="font-bold select-none">{{ t('feedback.field.contact') }}：</span>
                  <span>{{ selectedRecord.contact }}</span>
                </div>

                <div v-if="selectedRecord.images?.length" class="flex flex-wrap gap-2">
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
            </n-card>

            <!-- 管理员批复 -->
            <n-card embedded size="small">
              <div class="flex flex-col gap-2">
                <div class="text-app-xs font-bold text-text select-none">
                  {{ t('feedback.text.admin_replies') }}
                </div>
                <template v-if="selectedRecord.replies?.length">
                  <div
                    v-for="reply in selectedRecord.replies"
                    :key="reply.id"
                    class="p-2 rounded bg-bg-hover border border-border flex flex-col gap-1"
                  >
                    <div class="text-app-2xs text-sub">
                      {{ formatIsoTime(reply.createdAt) }}
                    </div>
                    <div class="text-app-xs text-text whitespace-pre-wrap wrap-break-word leading-relaxed">
                      {{ reply.content }}
                    </div>
                  </div>
                </template>
                <div v-else class="text-app-xs text-sub select-none py-1">
                  {{ t('feedback.text.no_replies') }}
                </div>
              </div>
            </n-card>
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
