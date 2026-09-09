<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ContentCopyOutlined,
  ShareSharp,
} from '@vicons/material'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { CopyToClipboard } from '@/tools'
import { encodeShareCode } from '@/tools/shareCode'

const { t } = useLocale()
const { isMobile } = useResponsive()
const NAIVE_UI_MESSAGE = useMessage()

const props = defineProps<{
  items: Record<number, number>
}>()

const showPop = ref(false)
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
  <n-popover
    v-model:show="showPop"
    trigger="click"
    :placement="isMobile ? 'bottom' : 'right-start'"
    :width="320"
  >
    <template #trigger>
      <slot />
    </template>

    <div class="wrapper pb-2" ref="wrapper">
      <div class="flex items-center gap-0.75 text-app-xl">
        <n-icon :size="16"><ShareSharp /></n-icon>
        <span>{{ t('workflow.share.title') }}</span>
      </div>
      <n-divider style="margin: 4px 0 8px;" />

      <template v-if="shareCode">
        <div class="flex flex-col gap-2">
          <div>
            <div class="mb-1 text-app-sm">{{ t('common.share_code') }}</div>
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
          </div>

          <div>
            <div class="mb-1 text-app-sm">{{ t('common.share_link') }}</div>
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
          </div>
        </div>
      </template>
      <template v-else>
        <n-empty :description="t('workflow.share.empty_workflow')" class="my-4" />
      </template>
    </div>
  </n-popover>
</template>

<style scoped>
.wrapper {
  user-select: text;
}
</style>
