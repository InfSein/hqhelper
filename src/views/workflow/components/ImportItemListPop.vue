<script setup lang="ts">
import { ref } from 'vue'
import {
  ArchiveSharp,
  DoneOutlined,
} from '@vicons/material'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/composables/useLocale'
import { useAppModals } from '@/composables/useAppModals'
import { useResponsive } from '@/composables/useResponsive'
import { getItemInfo, getItemNameRevertMap } from '@/tools/item'
import { decodeShareCode } from '@/tools/shareCode'

const { t } = useLocale()
const { alertError } = useDialog()
const { isMobile } = useResponsive()
const NAIVE_UI_MESSAGE = useMessage()
const { joinItemsToWorkflow } = useAppModals()

const showPop = ref(false)
const importShareCode = ref('')
const importStr = ref('')
const importStrSample = '仪仗长刀\r\n仪仗长刀 x 1\r\nセレモニアル・シャムシールx2\r\n5x Ceremonial Shamshir'

const handleImport = () => {
  const shareCodeTrimmed = importShareCode.value.trim()
  const importStrTrimmed = importStr.value.trim()

  // 优先解析分享码
  if (shareCodeTrimmed) {
    const decodedItems = decodeShareCode(shareCodeTrimmed)
    if (decodedItems && Object.keys(decodedItems).length > 0) {
      // 校验解码出来的物品是否合法
      const invalidItems: number[] = []
      const validItems: Record<number, number> = {}
      for (const [idStr, amount] of Object.entries(decodedItems)) {
        const itemId = Number(idStr)
        const itemInfo = getItemInfo(itemId)
        if (!itemInfo.craftInfo?.recipeId) {
          invalidItems.push(itemId)
        } else {
          validItems[itemId] = amount
        }
      }

      if (Object.keys(validItems).length === 0) {
        NAIVE_UI_MESSAGE.error(t('workflow.share.import_by_code_failed'))
        return
      }

      joinItemsToWorkflow(validItems)
      importShareCode.value = ''
      importStr.value = ''
      showPop.value = false
      return
    } else {
      NAIVE_UI_MESSAGE.error(t('workflow.share.import_by_code_failed'))
      return
    }
  }

  // 解析物品清单
  if (!importStrTrimmed) {
    NAIVE_UI_MESSAGE.info(t('macro_manage.text.please_input_content_to_import'))
    return
  }
  const listLines = importStrTrimmed.split('\n').map(s => s.trim()).filter(s => !!s)
  const itemNameMap = getItemNameRevertMap()

  const errors: string[] = []
  const items: Record<number, number> = {}
  listLines.forEach((line, index) => {
    const parseResult = parseItemList(line)
    if (!parseResult) {
      errors.push(t('workflow.import.itemlist.message.error_format_invalid', [index + 1, line]))
      return
    }
    const { name, count } = parseResult
    if (count <= 0) {
      errors.push(t('workflow.import.itemlist.message.error_count_invalid', [index + 1, count]))
      return
    }
    const itemId = itemNameMap.get(name)
    if (!itemId) {
      errors.push(t('workflow.import.itemlist.message.error_item_not_found', [index + 1, name]))
      return
    }
    if (items[itemId]) {
      errors.push(t('workflow.import.itemlist.message.error_item_duplicated', [index + 1, name]))
      return
    }
    const itemInfo = getItemInfo(itemId)
    if (!itemInfo.craftInfo?.recipeId) {
      errors.push(t('workflow.import.itemlist.message.error_item_not_craftable', [index + 1, name]))
      return
    }
    items[itemId] = count
  })

  if (errors.length) {
    alertError(
      t('workflow.import.itemlist.message.error_content_invalid_prev') + '\r\n'
      + errors.map(s => ` ${s}`).join('\r\n')
      + '\r\n' + t('workflow.import.itemlist.message.error_content_invalid_after')
    )
    return
  }

  joinItemsToWorkflow(items)
  importShareCode.value = ''
  importStr.value = ''
  showPop.value = false

  function parseItemList(input: string) {
    const text = input.trim()

    /**
     * 物品名称 x 数量
     * 物品名称x数量
     */
    const nameFirstMatch = text.match(/^(.+?)\s*[xX]\s*(\d+)$/)
    if (nameFirstMatch) {
      return {
        name: nameFirstMatch[1].trim(),
        count: Number(nameFirstMatch[2]),
      }
    }

    /**
     * 数量 x 物品名称
     */
    const countFirstMatch = text.match(/^(\d+)\s*[xX]\s*(.+)$/)
    if (countFirstMatch) {
      return {
        name: countFirstMatch[2].trim(),
        count: Number(countFirstMatch[1]),
      }
    }

    /**
     * 物品名称
     */
    return {
      name: text,
      count: 1,
    }
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

    <div class="wrapper" ref="listPopContainer">
      <div class="flex items-center gap-0.75 text-app-xl">
        <n-icon :size="16"><ArchiveSharp /></n-icon>
        <span>{{ t('common.import') }}</span>
      </div>
      <n-divider style="margin: 4px 0 8px;" />
      
      <div class="flex flex-col gap-2">
        <div>
          <div class="mb-1">{{ t('common.share_code') }}</div>
          <n-input
            v-model:value="importShareCode"
            :placeholder="t('workflow.import.share_code_placeholder')"
            clearable
          />
        </div>

        <div>
          <div>{{ t('workflow.import.itemlist.title') }}</div>
          <div class="text-app-xs text-sub mb-1">
            {{ t('workflow.import.itemlist.tip_1') }}
            {{ t('workflow.import.itemlist.tip_2') }}
          </div>
          <n-input
            type="textarea"
            v-model:value="importStr"
            :placeholder="importStrSample"
            :rows="6"
          />
        </div>
      </div>

      <div class="mt-2 text-end">
        <n-button type="primary" @click="handleImport">
          <template #icon>
            <n-icon><DoneOutlined /></n-icon>
          </template>
          {{ t('common.confirm') }}
        </n-button>
      </div>
    </div>
  </n-popover>
</template>

<style scoped>
.wrapper {
  .actions-container {
    text-align: end;
    button {
      margin-left: 4px;
    }
  }
}
</style>