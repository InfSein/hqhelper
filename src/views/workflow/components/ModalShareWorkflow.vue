<script setup lang="ts">
import { computed } from 'vue'
import {
  CloseOutlined,
  ContentCopyOutlined,
  ShareSharp,
} from '@vicons/material'
import { useLocale } from '@/composables/useLocale'
import { CopyToClipboard } from '@/tools'
import { encodeShareCode } from '@/tools/shareCode'

const { t } = useLocale()
const NAIVE_UI_MESSAGE = useMessage()

const showModal = defineModel<boolean>('show', { required: true })

const props = defineProps<{
  items: Record<number, number>
}>()

const wrapper = ref<HTMLElement>()

const shareCode = computed(() => {
  return encodeShareCode(props.items || {})
})

const shareUrl = computed(() => {
  if (!shareCode.value) return ''
  const origin = window.location.origin
  const pathname = window.location.pathname
  return `${origin}${pathname}#/share?code=${shareCode.value}`
})

const handleCopy = async (content: string) => {
  if (!content) return
  const errored = await CopyToClipboard(content, wrapper.value)
  if (errored) {
    NAIVE_UI_MESSAGE.error(t('common.message.copy_failed'))
  } else {
    NAIVE_UI_MESSAGE.success(t('workflow.share.copy_succeed'))
  }
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="ShareSharp"
    :title="t('workflow.share.title')"
    max-width="500px"
  >
    <div class="flex flex-col gap-4 py-1" ref="wrapper">
      <template v-if="shareCode">
        <GroupBox :title="t('common.share_code')">
          <n-input-group>
            <n-input
              :value="shareCode"
              readonly
              :placeholder="t('common.share_code')"
            />
            <n-button ghost @click="handleCopy(shareCode)">
              <template #icon>
                <n-icon><ContentCopyOutlined /></n-icon>
              </template>
              {{ t('common.copy') }}
            </n-button>
          </n-input-group>
        </GroupBox>

        <GroupBox :title="t('common.share_link')">
          <n-input-group>
            <n-input
              :value="shareUrl"
              readonly
              :placeholder="t('common.share_link')"
            />
            <n-button ghost @click="handleCopy(shareUrl)">
              <template #icon>
                <n-icon><ContentCopyOutlined /></n-icon>
              </template>
              {{ t('common.copy') }}
            </n-button>
          </n-input-group>
        </GroupBox>
      </template>
      <template v-else>
        <n-empty :description="t('workflow.share.empty_workflow')" class="my-4" />
      </template>
    </div>

    <template #action>
      <div class="app-modal-footer">
        <n-button type="error" @click="showModal = false">
          <template #icon>
            <n-icon><CloseOutlined /></n-icon>
          </template>
          {{ t('common.close') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>
