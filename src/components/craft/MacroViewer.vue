<script setup lang="ts">
import {
  CopyAllOutlined,
} from '@vicons/material'
import { useLocale } from '@/composables/useLocale'
import { CopyToClipboard } from '@/tools'

const NAIVE_UI_MESSAGE = useMessage()

const { t } = useLocale()

interface MacroViewerProps {
  macroLines: string[]
  contentHeight?: string
  contentExtraStyle?: string
  containerId?: string
  hideTabs?: boolean
  hideCopyButton?: boolean
}
const props = defineProps<MacroViewerProps>()

const selectedGroupIndex = ref(0)

const macroGroups = computed(() => {
  const macroGroups = []
  for (let i = 0; i < props.macroLines.length; i += 15) {
    macroGroups.push(props.macroLines.slice(i, i + 15))
  }
  if (!macroGroups.length) {
    macroGroups.push([])
  }
  return macroGroups
})

const handleCopy = async (text: string) => {
  let container : HTMLElement | null | undefined
  if (props.containerId) {
    container = document.getElementById(props.containerId)
  }
  const errored = await CopyToClipboard(text, container)
  if (errored) {
    NAIVE_UI_MESSAGE.error(t('copy_macro.message.failed'))
    return
  }
  NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
}
</script>

<template>
  <div class="ame-wrapper">
    <div v-if="!hideTabs" class="group-btns">
      <n-button
        size="small"
        v-for="(group, groupIndex) in macroGroups"
        :key="`macro-group-${groupIndex}-btn`"
        :type="selectedGroupIndex === groupIndex ? 'primary' : undefined"
        @click="selectedGroupIndex = groupIndex"
      >
        {{ t('common.macro_with_index', groupIndex + 1) }}
      </n-button>
    </div>
    <n-divider v-if="!hideTabs" style="margin-top: 3px; margin-bottom: 2px;" />
    <n-button
      v-if="!hideCopyButton"
      size="tiny"
      style="width: fit-content;"
      :disabled="!macroGroups?.[selectedGroupIndex]"
      @click="handleCopy(macroGroups?.[selectedGroupIndex]?.join('\r\n'))"
    >
      <template #icon>
        <n-icon><CopyAllOutlined /></n-icon>
      </template>
      {{ t('common.copy') }}
    </n-button>
    <div
      class="group-container"
      v-for="(group, groupIndex) in macroGroups"
      :key="`macro-group-${groupIndex}`"
      v-show="selectedGroupIndex === groupIndex"
    >
      <div
        v-if="!group?.length"
        class="flex items-center justify-center w-full"
        :style="{
          height: contentHeight
        }"
      >
        <n-empty size="large" :description="t('common.no_content')" />
      </div>
      <div
        v-else
        class="macro-container font-small"
        :style="{
          height: contentHeight
        }"
      >
        <div
          class="macro-line"
          v-for="(line, lineIndex) in group"
          :key="`${groupIndex}-macro-line-${lineIndex}`"
        >
          <div class="line-num">{{ lineIndex + 1 }}</div>
          <div class="line-content" :style="contentExtraStyle">{{ line }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ame-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .group-btns {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    height: fit-content;
  }
  .group-container {
    flex: 1;

    .macro-container {
      width: 100%;
      line-height: 1.3;
      overflow: auto;
      margin-top: 0.5em;

      .macro-line {
        display: flex;
        gap: 5px;

        .line-num {
          width: 20px;
          text-align: right;
          user-select: none;
          color: gray;
        }
        .line-content {
          display: flex;
          flex-wrap: nowrap;
        }
      }
    }
  }
}
</style>