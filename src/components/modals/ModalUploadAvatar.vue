<script setup lang="ts">
import {
  CloudUploadOutlined,
  FaceRetouchingNaturalFilled,
} from '@vicons/material'
import type { UploadFileInfo } from 'naive-ui'
import { useLocale } from '@/composables/useLocale'
import { useStore } from '@/store'
import { useNbbCloud } from '@/composables/useNbbCloud'
import { useDialog } from '@/composables/useDialog'

const { t } = useLocale()
const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()
const { alertInfo } = useDialog()
const { uploadAvatar, updateUserInfoExt } = useNbbCloud()

const showModal = defineModel<boolean>('show', { required: true })
const isUploading = ref(false)
const fileList = ref<UploadFileInfo[]>([])

const customAvatarUrl = computed(() => store.cloudConfig.nbb_account_avatar_vip)

const handleShowRules = () => {
  const rules = [
    t('cloud.text.avatar_rule_1'),
    t('cloud.text.avatar_rule_2'),
    t('cloud.text.avatar_rule_3'),
  ].join('\n')
  alertInfo({
    title: t('common.rule'),
    content: rules,
  })
}

const handleBeforeUpload = async ({ file }: { file: UploadFileInfo }) => {
  const rawFile = file.file
  if (!rawFile) {
    NAIVE_UI_MESSAGE.error(t('main.imexport.no_file_received'))
    return false
  }

  // 格式校验
  if (!rawFile.type.startsWith('image/')) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.file_not_image'))
    return false
  }

  try {
    isUploading.value = true
    const response = await uploadAvatar(rawFile)
    if (response.errno) {
      NAIVE_UI_MESSAGE.error(t('cloud.message.upload_avatar_failed', { err: response.errmsg }))
    } else {
      NAIVE_UI_MESSAGE.success(response.data?.message || t('cloud.message.avatar_upload_pending'))
      await updateUserInfoExt()
      showModal.value = false
    }
  } catch (err: any) {
    NAIVE_UI_MESSAGE.error(t('cloud.message.upload_avatar_failed', { err: err?.message || 'Network error' }))
  } finally {
    isUploading.value = false
    fileList.value = []
  }

  return false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    max-width="480px"
  >
    <template #header>
      <div class="card-title select-none">
        <n-icon><FaceRetouchingNaturalFilled /></n-icon>
        <span class="title">
          {{ t('cloud.text.upload_custom_avatar') }}
        </span>
        <div class="card-title__actions">
          <a href="javascript:void(0);" @click="handleShowRules">[{{ t('common.rule') }}]</a>
        </div>
      </div>
    </template>

    <div class="flex flex-col items-center gap-4 py-2">
      <div v-if="customAvatarUrl" class="flex flex-col items-center gap-1.5">
        <n-avatar
          round
          :size="72"
          :src="customAvatarUrl"
          class="border border-border"
        />
        <div class="text-app-xs text-sub">
          {{ t('cloud.text.current_custom_avatar') }}
        </div>
      </div>

      <n-upload
        accept="image/*"
        :max="1"
        :show-file-list="false"
        :file-list="fileList"
        :disabled="isUploading"
        @before-upload="handleBeforeUpload"
        class="w-full"
      >
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3">
              <CloudUploadOutlined />
            </n-icon>
          </div>
          <n-text style="font-size: 16px">
            {{ t('common.click_or_drag_to_upload') }}
          </n-text>
          <n-p depth="3" style="margin: 8px 0 0">
            {{ t('cloud.text.custom_avatar_tip') }}
          </n-p>
        </n-upload-dragger>
      </n-upload>
    </div>

    <template #action>
      <div class="app-modal-footer">
        <n-button size="large" @click="showModal = false">
          {{ t('common.close') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>
