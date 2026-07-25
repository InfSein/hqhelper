<script setup lang='ts'>
import {
  SettingsBackupRestoreSharp,
  ViewListSharp,
} from '@vicons/material'
import ItemButton from './ItemButton.vue'
import ButtonCopyAsMacro from '@/components/craft/ButtonCopyAsMacro.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import UseConfig from '@/composables/useConfig.ts'
import { type ItemInfo } from '@/tools/item'

const store = useStore()
const { t } = useLocale()
const { itemLanguage } = UseConfig()

const getItemName = (itemInfo: ItemInfo) => {
  switch (itemLanguage.value) {
    case 'zh':
      return itemInfo.name_zh || '未翻译的物品'
    default:
      return itemInfo[`name_${itemLanguage.value}`]
  }
}
  
interface ItemListProps {
  items: ItemInfo[]
  /** 为物品容器指定额外的样式 */
  displayStyle?: string
  /** 为滚动容器指定额外的样式 */
  scrollStyle?: string
  /** 清单区域的高度(不计入操作按钮) */
  listHeight?: number
  /** 是否隐藏清单顶部的操作按钮 */
  hideActions?: boolean
  /** 是否隐藏物品清单为空时的提示 */
  hideEmpty?: boolean
  /** 物品按钮内物品信息区域的最大宽度。不指定时会自动全局处理 */
  btnInfoMaxWidth?: string
  /** 物品按钮悬浮窗的最大宽度 */
  btnPopMaxWidth?: string
  /** 物品悬浮窗使用自定义宽度 */
  btnPopUseCustomWidth?: boolean
  /** 物品悬浮窗的自定义宽度，必须同时设置`btnPopUseCustomWidth`才能生效 */
  btnPopCustomWidth?: number
  /** 是否在物品名前展示生产/采集职业的图标 */
  showCollectorIcon?: boolean
  /** 物品按钮所处容器的ID，在模态框等场景时必须传递，否则无法正常复制物品名 */
  containerId?: string
}
const props = withDefaults(defineProps<ItemListProps>(), {
  displayStyle: '',
  scrollStyle: '',
  hideActions: false,
  hideEmpty: false,
  btnPopMaxWidth: undefined,
  btnPopUseCustomWidth: false,
  btnPopCustomWidth: undefined,
  showCollectorIcon: false,
  containerId: ''
})

const getContainerStyles = () => {
  return [
    props.listHeight? `height: ${props.listHeight + 20}px` : '',
  ].join(';')
}
const getScrollbarStyles = () => {
  return [
    props.listHeight? `height: ${props.listHeight}px` : '',
    props.scrollStyle
  ].join(';')
}

const mode = ref<"default" | "list">('default')

const listValue = computed(() => {
  const result : string[] = []
  props.items.forEach(item => {
    if (item.amount) {
      if (store.userConfig.item_list_style === 'teamcraft') {
        result.push(`${item.amount}x ${getItemName(item)}`)
      } else if (store.userConfig.item_list_style === 'modern') {
        result.push(`${getItemName(item)} x${item.amount}`)
      } else if (store.userConfig.item_list_style === 'tight') {
        result.push(`${getItemName(item)}x${item.amount}`)
      } else {
        result.push(`${getItemName(item)} x ${item.amount}`)
      }
    }
  })
  return result.join('\n')
})

const listContainer = ref<HTMLElement>()
</script>

<template>
  <div v-if="items.length" class="list-container" ref="listContainer" :style="getContainerStyles()">
    <div v-if="!hideActions" class="actions">
      <ButtonCopyAsMacro
        :items="items"
        :container="listContainer"
      />
      <n-button size="tiny" v-if="mode === 'default'" @click="mode = 'list'">
        <template #icon>
          <n-icon><ViewListSharp /></n-icon>
        </template>
        {{ t('common.list') }}
      </n-button>
      <n-button size="tiny" v-else @click="mode = 'default'">
        <template #icon>
          <n-icon><SettingsBackupRestoreSharp /></n-icon>
        </template>
        {{ t('common.go_back') }}
      </n-button>
    </div>
    <div v-if="mode === 'default'" class="scroll-container" :style="getScrollbarStyles()">
      <div class="items-container" :style="displayStyle">
        <ItemButton
          v-for="(item, index) in items"
          :key="'item-' + index"
          :item-info="item"
          show-icon show-name show-amount
          :pop-max-width="btnPopMaxWidth"
          :show-collector-icon="showCollectorIcon"
          :container-id="containerId"
          :item-info-max-width="btnInfoMaxWidth"
          :pop-use-custom-width="btnPopUseCustomWidth"
          :pop-custom-width="btnPopCustomWidth"
        >
        </ItemButton>
      </div>
    </div>
    <n-input
      v-else-if="mode === 'list'"
      v-model:value="listValue"
      readonly
      autosize
      type="textarea"
      :placeholder="t('common.no_required_items')"
      style="max-height: calc(100% - 25px);"
    />
  </div>
  <div v-else-if="!hideEmpty" class="empty-container" :style="getContainerStyles()">
    <n-empty :description="t('common.no_required_items')" />
  </div>
</template>
  
<style scoped>
:deep(.n-empty__description) {
  text-align: center;
}
.scroll-container {
  overflow-y: scroll;

  .items-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}
.list-container {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 2px;
  }
}
.empty-container {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
}

/* Desktop only */
@media screen and (min-width: 768px) {
  .scroll-container {
    padding: 0 0.5em !important;
  }
}

/* Mobile only */
@media screen and (max-width: 767px) {
  .scroll-container {
    padding: 0 !important;
  }
}
</style>