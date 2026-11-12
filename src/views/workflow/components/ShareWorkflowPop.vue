<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ContentCopyOutlined,
  SaveOutlined,
  ShareSharp,
} from '@vicons/material'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { CopyToClipboard } from '@/tools'
import { encodeShareCode } from '@/tools/shareCode'

const store = useStore()
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
  let base = origin + pathname + '#/'
  if (origin === 'file://') {
    base = 'https://hqhelper.com/#/'
  }
  return `${base}share?code=${shareCode.value}`
})

const saveTarget = ref<number | "new">('new')
const newQueueName = ref('')

const defaultQueueName = computed(() => {
  const num = (store.userConfig.notebook_custom_queues?.length || 0) + 1
  return t('workflow.custom_queue.default_name', { num })
})

const queueOptions = computed(() => {
  const options: { label: string; value: number | "new" }[] = [
    {
      label: t('workflow.custom_queue.new_queue'),
      value: 'new',
    },
  ]
  const queues = store.userConfig.notebook_custom_queues || []
  queues.forEach((q, idx) => {
    options.push({
      label: q.name || t('workflow.custom_queue.default_name', { num: idx + 1 }),
      value: idx,
    })
  })
  return options
})

watch(showPop, (val) => {
  if (val) {
    // 若当前选中的覆盖目标已被删除，重置为新建队列
    if (
      saveTarget.value !== 'new' &&
      !store.userConfig.notebook_custom_queues?.[saveTarget.value]
    ) {
      saveTarget.value = 'new'
    }
  }
})

const handleSaveToCustomQueue = () => {
  if (!shareCode.value) return
  store.userConfig.notebook_custom_queues ??= []
  const queues = store.userConfig.notebook_custom_queues
  if (saveTarget.value === 'new') {
    const name = newQueueName.value.trim() || defaultQueueName.value
    queues.push({
      name,
      code: shareCode.value,
    })
    newQueueName.value = ''
  } else {
    const idx = saveTarget.value
    if (queues[idx]) {
      queues[idx].code = shareCode.value
    } else {
      const name = newQueueName.value.trim() || defaultQueueName.value
      queues.push({
        name,
        code: shareCode.value,
      })
    }
  }
  store.updateUserConfig()
  NAIVE_UI_MESSAGE.success(t('common.save_succeed'))
  showPop.value = false
}

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
              <n-button ghost class="n-square-button" :title="t('common.copy')" @click="handleCopy(shareCode)">
                <n-icon><ContentCopyOutlined /></n-icon>
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
              <n-button ghost class="n-square-button" :title="t('common.copy')" @click="handleCopy(shareUrl)">
                <n-icon><ContentCopyOutlined /></n-icon>
              </n-button>
            </n-input-group>
          </div>

          <div>
            <div class="text-app-sm">{{ t('workflow.custom_queue.save_to_queue') }}</div>
            <div v-if="saveTarget !== 'new'" class="text-error text-app-xs">
              {{ t('workflow.custom_queue.queue_will_be_overwritten') }}
            </div>
            <div class="h-1"></div>
            <n-input-group>
              <n-select
                v-model:value="saveTarget"
                :options="queueOptions"
                :to="false"
                :class="saveTarget === 'new' ? 'w-26 shrink-0' : 'flex-1'"
              />
              <n-input
                v-if="saveTarget === 'new'"
                v-model:value="newQueueName"
                :placeholder="defaultQueueName"
                maxlength="30"
                clearable
                class="flex-1"
                @keydown.enter="handleSaveToCustomQueue"
              />
              <n-button type="primary" class="n-square-button" @click="handleSaveToCustomQueue">
                <template #icon>
                  <n-icon><SaveOutlined /></n-icon>
                </template>
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
