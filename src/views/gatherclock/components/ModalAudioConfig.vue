<script setup lang="ts">
import {
  VolumeUpRound,
  UploadFileRound,
  DeleteOutlineRound,
  PlayArrowRound
} from '@vicons/material'
import MyModal from '@/components/templates/MyModal.vue'
import { playAudio } from '@/tools'
import useIdb from '@/utils/app.idb'
import { useDialog } from '@/composables/useDialog'

const t = inject<(message: string, args?: any) => string>('t')!
//const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const showModal = defineModel<boolean>('show', { required: true })
const soundSelect = defineModel<'default' | 'custom' | undefined>('soundSelect')
const customAudioName = defineModel<string | undefined>('customAudioName')

const idb = useIdb()
const { alertError, confirm } = useDialog()

const uploadInputRef = ref<HTMLInputElement | null>(null)

// 模态框内部的临时编辑状态
const tempSoundSelect = ref<'default' | 'custom'>('default')
const tempCustomAudioName = ref<string>('')
const tempAudioBlob = ref<Blob | null>(null)
const tempAudioBlobDeleted = ref<boolean>(false)
const previewBlobUrl = ref<string>('')

// 音频类型选项
const soundTypeOptions = computed(() => [
  {
    label: t('gather_clock.preference.custom_audio.sound_select.option.default'),
    value: 'default'
  },
  {
    label: t('gather_clock.preference.custom_audio.sound_select.option.custom'),
    value: 'custom'
  }
])

// 打开弹窗时初始化临时状态
watch(showModal, async (newVal) => {
  if (newVal) {
    tempSoundSelect.value = soundSelect.value || 'default'
    tempCustomAudioName.value = customAudioName.value || ''
    tempAudioBlob.value = null
    tempAudioBlobDeleted.value = false
    if (previewBlobUrl.value) {
      URL.revokeObjectURL(previewBlobUrl.value)
      previewBlobUrl.value = ''
    }
  } else {
    // 弹窗关闭时释放临时 URL
    if (previewBlobUrl.value) {
      URL.revokeObjectURL(previewBlobUrl.value)
      previewBlobUrl.value = ''
    }
  }
})

// 触发文件选择器
const handleTriggerUpload = () => {
  uploadInputRef.value?.click()
}

// 处理文件上传
const handleFileUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 格式及大小校验
  const isAudioType = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name)
  if (!isAudioType) {
    await alertError(t('gather_clock.message.invalid_audio_format'))
    return
  }
  if (file.size > 10 * 1024 * 1024) { // 10MB 限制
    await alertError(t('gather_clock.message.audio_file_too_large'))
    return
  }

  tempAudioBlob.value = file
  tempCustomAudioName.value = file.name
  tempAudioBlobDeleted.value = false
  tempSoundSelect.value = 'custom'

  // 更新预览 URL
  if (previewBlobUrl.value) {
    URL.revokeObjectURL(previewBlobUrl.value)
  }
  previewBlobUrl.value = URL.createObjectURL(file)

  if (e.target) {
    (e.target as HTMLInputElement).value = ''
  }
}

// 清除自定义音频
const handleClearCustomAudio = async () => {
  if (await confirm(t('gather_clock.message.confirm_clear_custom_audio'))) {
    tempAudioBlob.value = null
    tempCustomAudioName.value = ''
    tempAudioBlobDeleted.value = true
    tempSoundSelect.value = 'default'
    if (previewBlobUrl.value) {
      URL.revokeObjectURL(previewBlobUrl.value)
      previewBlobUrl.value = ''
    }
  }
}

// 试听音效
const handlePreviewAudio = async () => {
  if (tempSoundSelect.value === 'custom') {
    // 若在弹窗中新选择了文件
    if (previewBlobUrl.value) {
      playAudio(previewBlobUrl.value)
      return
    }
    // 若未清除且已有音频，从 IDB 读取
    if (!tempAudioBlobDeleted.value) {
      const storedBlob = await idb.gatherClockAudio.get()
      if (storedBlob) {
        if (previewBlobUrl.value) {
          URL.revokeObjectURL(previewBlobUrl.value)
        }
        previewBlobUrl.value = URL.createObjectURL(storedBlob)
        playAudio(previewBlobUrl.value)
        return
      }
    }
  }
  // 降级播放默认音效
  playAudio('./audio/FFXIV_Incoming_Tell_2.mp3')
}

// 保存设置
const handleSave = async () => {
  if (tempAudioBlobDeleted.value) {
    await idb.gatherClockAudio.clear()
  } else if (tempAudioBlob.value) {
    await idb.gatherClockAudio.set(tempAudioBlob.value)
  }

  soundSelect.value = tempSoundSelect.value
  customAudioName.value = tempCustomAudioName.value
  showModal.value = false
}

// 取消/关闭
const handleCancel = () => {
  showModal.value = false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="VolumeUpRound"
    :title="t('gather_clock.preference.custom_audio.modal_title')"
    max-width="500px"
  >
    <div class="audio-config-container">
      <n-form label-placement="left" label-width="110px" :show-feedback="false">
        <n-form-item :label="t('gather_clock.preference.custom_audio.sound_select.title')">
          <n-radio-group v-model:value="tempSoundSelect" name="sound-type-group">
            <n-space>
              <n-radio v-for="opt in soundTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item :label="t('gather_clock.preference.custom_audio.title')">
          <div class="custom-audio-section">
            <div class="status-text">
              <span v-if="tempCustomAudioName && !tempAudioBlobDeleted" class="color-success">
                {{ t('gather_clock.preference.custom_audio.status_uploaded', { name: tempCustomAudioName }) }}
              </span>
              <span v-else class="text-sub font-small">
                {{ t('gather_clock.preference.custom_audio.status_not_uploaded') }}
              </span>
            </div>

            <div class="action-buttons">
              <n-button size="small" type="primary" secondary @click="handleTriggerUpload">
                <template #icon>
                  <n-icon><UploadFileRound /></n-icon>
                </template>
                {{ tempCustomAudioName && !tempAudioBlobDeleted ? t('gather_clock.preference.custom_audio.reupload') : t('gather_clock.preference.custom_audio.upload') }}
              </n-button>

              <n-button size="small" secondary @click="handlePreviewAudio">
                <template #icon>
                  <n-icon><PlayArrowRound /></n-icon>
                </template>
                {{ t('gather_clock.preference.custom_audio.test') }}
              </n-button>

              <n-button
                v-if="tempCustomAudioName && !tempAudioBlobDeleted"
                size="small"
                type="error"
                secondary
                @click="handleClearCustomAudio"
              >
                <template #icon>
                  <n-icon><DeleteOutlineRound /></n-icon>
                </template>
                {{ t('gather_clock.preference.custom_audio.clear') }}
              </n-button>
            </div>
          </div>
        </n-form-item>
      </n-form>

      <input
        ref="uploadInputRef"
        type="file"
        accept="audio/*"
        style="display: none;"
        @change="handleFileUpload"
      />
    </div>

    <template #action>
      <div class="modal-footer flex justify-end gap-2">
        <n-button @click="handleCancel">
          {{ t('common.cancel') }}
        </n-button>
        <n-button type="primary" @click="handleSave">
          {{ t('common.save') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
.audio-config-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.custom-audio-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.status-text {
  word-break: break-all;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
