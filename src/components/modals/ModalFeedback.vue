<script setup lang="ts">
import {
  FeedbackOutlined,
  HistoryOutlined,
  SendOutlined,
} from '@vicons/material'
import type { UploadFileInfo } from 'naive-ui'
import { useLocale } from '@/composables/useLocale'
import { useNbbCloud } from '@/composables/useNbbCloud'
import { useServerNotice } from '@/composables/useServerNotice'
import { useAppModals } from '@/composables/useAppModals'
import { useDialog } from '@/composables/useDialog'
import { formatTimestamp } from '@/tools'
import type { FeedbackType } from '@/types/api/nbb-cloud'

const { t } = useLocale()
const NAIVE_UI_MESSAGE = useMessage()
const { alertError } = useDialog()
const { submitFeedback, updateUserInfoExt } = useNbbCloud()
const { feedbackBanned, feedbackBanExpiresAt } = useServerNotice()
const { displayFeedbackHistoryModal } = useAppModals()

const showModal = defineModel<boolean>('show', { required: true })

const isSubmitting = ref(false)
const cooldownSeconds = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const formData = reactive<{
  type: FeedbackType
  title: string
  content: string
  contact: string
}>({
  type: 'bug',
  title: '',
  content: '',
  contact: '',
})
const fileList = ref<UploadFileInfo[]>([])

const extraHeaderButtons = computed(() => [
  {
    text: t('feedback.action.history'),
    icon: HistoryOutlined,
    onClick: () => {
      displayFeedbackHistoryModal()
    },
  },
])

const banExpireText = computed(() => {
  if (!feedbackBanExpiresAt.value) {
    return t('feedback.message.banned_permanent')
  }
  const ts = Date.parse(feedbackBanExpiresAt.value)
  if (Number.isNaN(ts)) {
    return feedbackBanExpiresAt.value
  }
  return t('feedback.message.banned_until', { time: formatTimestamp(ts) })
})

const startCooldown = (seconds: number) => {
  if (seconds <= 0) return
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
  }
  cooldownSeconds.value = Math.ceil(seconds)
  cooldownTimer = setInterval(() => {
    cooldownSeconds.value--
    if (cooldownSeconds.value <= 0) {
      cooldownSeconds.value = 0
      if (cooldownTimer) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
      }
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
})

const handleBeforeUpload = ({ file }: { file: UploadFileInfo }) => {
  const rawFile = file.file
  if (!rawFile) {
    NAIVE_UI_MESSAGE.error(t('main.imexport.no_file_received'))
    return false
  }
  if (!rawFile.type.startsWith('image/')) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.file_not_image'))
    return false
  }
  const maxBytes = 10 * 1024 * 1024
  if (rawFile.size > maxBytes) {
    NAIVE_UI_MESSAGE.error(t('feedback.message.image_too_large'))
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (feedbackBanned.value) {
    await alertError(banExpireText.value)
    return
  }
  if (cooldownSeconds.value > 0) {
    NAIVE_UI_MESSAGE.warning(t('feedback.message.rate_limited', { sec: cooldownSeconds.value }))
    return
  }

  const title = formData.title.trim()
  const content = formData.content.trim()
  const contact = formData.contact.trim()

  if (!title) {
    NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('feedback.field.title')))
    return
  }
  if (title.length > 100) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.key_is_too_long', { key: t('feedback.field.title') }))
    return
  }
  if (!content) {
    NAIVE_UI_MESSAGE.error(t('common.message.please_input_val', t('feedback.field.content')))
    return
  }
  if (content.length > 5000) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.key_is_too_long', { key: t('feedback.field.content') }))
    return
  }
  if (contact.length > 200) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.key_is_too_long', { key: t('feedback.field.contact') }))
    return
  }

  const images = fileList.value
    .map(item => item.file)
    .filter((f): f is File => !!f)
    .slice(0, 6)

  try {
    isSubmitting.value = true
    const response = await submitFeedback({
      type: formData.type,
      title,
      content,
      contact: contact || undefined,
      images,
    })

    if (!response.errno) {
      NAIVE_UI_MESSAGE.success(t('feedback.message.submit_succeed'))
      formData.title = ''
      formData.content = ''
      fileList.value = []
      if (response.data?.nextCooldownSeconds) {
        startCooldown(response.data.nextCooldownSeconds)
      }
    } else if (response.errno === 2) {
      await updateUserInfoExt()
      await alertError(response.errmsg || banExpireText.value)
    } else if (response.errno === 3) {
      if (response.data?.retryAfter) {
        startCooldown(response.data.retryAfter)
      }
      NAIVE_UI_MESSAGE.warning(
        response.errmsg || t('feedback.message.rate_limited', { sec: response.data?.retryAfter ?? 0 })
      )
    } else {
      NAIVE_UI_MESSAGE.error(response.errmsg || t('feedback.message.submit_failed'))
    }
  } catch (err: any) {
    NAIVE_UI_MESSAGE.error(err?.message || t('feedback.message.submit_failed'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="FeedbackOutlined"
    :title="t('common.appfunc.send_feedback')"
    :extra-header-buttons="extraHeaderButtons"
    max-width="580px"
  >
    <div class="flex flex-col gap-3">
      <n-alert
        v-if="feedbackBanned"
        type="error"
        :title="t('feedback.message.banned_title')"
      >
        {{ banExpireText }}
      </n-alert>

      <n-card embedded size="small">
        <div class="flex flex-col gap-3">
          <!-- 反馈类型 -->
          <div class="flex flex-col gap-1">
            <div class="text-app-sm font-bold text-text select-none">
              {{ t('feedback.field.type') }}
            </div>
            <n-radio-group v-model:value="formData.type" :disabled="feedbackBanned || isSubmitting">
              <div class="flex flex-wrap items-center gap-4">
                <n-radio value="bug">
                  <i class="xiv target-cross text-error"></i>
                  {{ t('feedback.type.bug') }}
                </n-radio>
                <n-radio value="feat">
                  <i class="xiv target-triangle text-info"></i>
                  {{ t('feedback.type.feat') }}
                </n-radio>
              </div>
            </n-radio-group>
          </div>

          <!-- 标题 -->
          <div class="flex flex-col gap-1">
            <div class="text-app-sm font-bold text-text select-none">
              {{ t('feedback.field.title') }}
              <span class="text-error">*</span>
            </div>
            <n-input
              v-model:value="formData.title"
              :maxlength="100"
              show-count
              clearable
              :disabled="feedbackBanned || isSubmitting"
              :placeholder="t('feedback.placeholder.title')"
            />
          </div>

          <!-- 内容 -->
          <div class="flex flex-col gap-1">
            <div class="text-app-sm font-bold text-text select-none">
              {{ t('feedback.field.content') }}
              <span class="text-error">*</span>
            </div>
            <n-input
              v-model:value="formData.content"
              type="textarea"
              :autosize="{ minRows: 4, maxRows: 8 }"
              :maxlength="5000"
              show-count
              :disabled="feedbackBanned || isSubmitting"
              :placeholder="t('feedback.placeholder.content')"
            />
          </div>

          <!-- 联系方式 (可选) -->
          <div class="flex flex-col gap-1">
            <div class="flex items-baseline gap-1.5 select-none">
              <span class="text-app-sm font-bold text-text">{{ t('feedback.field.contact') }}</span>
              <span class="text-app-xs text-sub">({{ t('common.optional') }}, {{ t('feedback.field.contact_sub') }})</span>
            </div>
            <n-input
              v-model:value="formData.contact"
              :maxlength="200"
              show-count
              clearable
              :disabled="feedbackBanned || isSubmitting"
              :placeholder="t('feedback.placeholder.contact')"
            />
          </div>

          <!-- 图片上传 -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between select-none">
              <div class="flex items-center gap-1.5">
                <span class="text-app-sm font-bold text-text">{{ t('feedback.field.images') }}</span>
                <span class="text-app-xs text-sub">({{ fileList.length }}/6)</span>
              </div>
            </div>
            <n-upload
              v-model:file-list="fileList"
              list-type="image-card"
              accept="image/*"
              :max="6"
              :default-upload="false"
              :disabled="feedbackBanned || isSubmitting"
              @before-upload="handleBeforeUpload"
            />
          </div>
        </div>
      </n-card>
    </div>

    <template #action>
      <div class="app-modal-footer">
        <n-button
          type="primary"
          size="large"
          :loading="isSubmitting"
          :disabled="isSubmitting || feedbackBanned || cooldownSeconds > 0"
          @click="handleSubmit"
        >
          <template #icon>
            <n-icon><SendOutlined /></n-icon>
          </template>
          {{
            cooldownSeconds > 0
              ? t('feedback.action.submit_cooldown', { sec: cooldownSeconds })
              : t('common.submit')
          }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>
