<script setup lang="ts">
import {
  ArchiveSharp,
  DoneOutlined,
} from '@vicons/material'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/composables/useLocale'
import { useAppModals } from '@/composables/useAppModals'
import { useResponsive } from '@/composables/useResponsive'
import { getItemInfo, getItemNameRevertMap } from '@/tools/item'

const NAIVE_UI_MESSAGE = useMessage()
const { t } = useLocale()
const { isMobile } = useResponsive()
const { joinItemsToWorkflow } = useAppModals()

const { alertError } = useDialog()

const showPop = ref(false)
const importStr = ref('')
const importStrSample = '仪仗长刀 x 1\r\nセレモニアル・シャムシールx2\r\n5x Ceremonial Shamshir'

const handleImport = () => {
  const listLines = importStr.value.split('\n').map(s => s.trim()).filter(s => !!s)

  if (!listLines.length) {
    NAIVE_UI_MESSAGE.info(t('macro_manage.text.please_input_content_to_import'))
    return
  }

  const itemNameMap = getItemNameRevertMap()

  const errors : string[] = []
  const items : Record<number, number> = {}
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

    return null
  }
}
</script>

<template>
  <n-popover
    v-model:show="showPop"
    trigger="click"
    :placement="isMobile ? 'bottom' : 'right-start'"
    :width="300"
  >
    <template #trigger>
      <slot />
    </template>

    <div class="wrapper" ref="listPopContainer">
      <div class="pop-title font-big">
        <n-icon :size="16"><ArchiveSharp /></n-icon>
        <span>{{ t('common.import') }}</span>
      </div>
      <n-divider style="margin: 0 0 3px;" />
      <div>
        {{ t('workflow.import.itemlist.tip_1') }}
        {{ t('workflow.import.itemlist.tip_2') }}
      </div>
      <div class="input-container">
        <n-input
          type="textarea"
          v-model:value="importStr"
          :placeholder="importStrSample"
          :rows="10"
        />
      </div>
      <div class="actions-container">
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
  .pop-title {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .input-container,
  .actions-container {
    margin-top: 4px;
  }
  .actions-container {
    text-align: end;
    button {
      margin-left: 4px;
    }
  }
}
</style>