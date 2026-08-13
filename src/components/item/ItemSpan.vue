<script setup lang="ts">
import {
  InfoOutlined,
} from '@vicons/material'
import ItemPop from './ItemPop.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import UseConfig from '@/composables/useConfig'
import { useResponsive } from '@/composables/useResponsive'
import { useItemContextMenu } from '@/composables/useItemContextMenu'
import { type ItemInfo } from '@/tools/item'

const { t } = useLocale()
const { isMobile } = useResponsive()

const store = useStore()
const {
  itemLanguage,
} = UseConfig()

interface ItemSpanProps {
  itemInfo: ItemInfo
  amount?: number
  showAmount?: boolean
  imgSize?: number
  spanMaxWidth?: string
  hideIcon?: boolean
  hideName?: boolean
  hidePopIcon?: boolean
  containerId?: string
  containerStyle?: string
}
const props = defineProps<ItemSpanProps>()

const itemSpanNode = ref<HTMLElement>()
const itemAmountNode = ref<HTMLElement>()

const needLimitNameWidth = ref(false)

const calculateUi = () => {
  needLimitNameWidth.value = false
  if (props.spanMaxWidth && itemSpanNode.value) {
    const maxWidth = parseInt(props.spanMaxWidth.replace('px', ''), 10)
    const spanWidth = measureNaturalWidth(itemSpanNode.value)
    if (maxWidth > 0 && spanWidth > maxWidth) {
      needLimitNameWidth.value = true
    }
  }

  function measureNaturalWidth(el: HTMLElement): number {
    if (!el || !el.parentElement) return 0

    const clone = el.cloneNode(true) as HTMLElement

    clone.style.visibility = 'hidden'
    clone.style.position = 'absolute'
    clone.style.maxWidth = 'none'
    clone.style.width = 'auto'

    el.parentElement.appendChild(clone)
    const width = clone.offsetWidth
    el.parentElement.removeChild(clone)

    return width
  }
}

onMounted(() => {
  calculateUi()
})

const getItemName = () => {
  switch (itemLanguage.value) {
    case 'zh':
      return props.itemInfo.name_zh || '未翻译的物品'
    default:
      return props.itemInfo[`name_${itemLanguage.value}`]
  }
}
const itemAmount = computed(() => {
  const _amount = props.amount ?? 0
  return store.userConfig.item_amount_use_comma
    ? _amount.toLocaleString()
    : _amount
})

// #region 右键菜单相关

const {
  showDropdown,
  dropdownX,
  dropdownY,
  dropdownOptions,
  handleCopy,
  handleContextMenu,
  handleSelect,
  onClickOutside,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} = useItemContextMenu(
  () => props.itemInfo,
  () => props.containerId
)

// #endregion

const popTrigger = computed(() => {
  if (!isMobile.value && store.userConfig.click_to_show_pop_in_span) {
    return 'click'
  } else {
    return undefined
  }
})
const containerStyle = computed(() => {
  const styles = [
    (props.containerStyle ?? ''),
  ]

  if (needLimitNameWidth.value) {
    let itemAmountwidth = 0
    if (props.showAmount && !!itemAmountNode.value) {
      itemAmountwidth += Math.ceil(itemAmountNode.value.offsetWidth)
      if (props.amount) {
        const offset = itemLanguage.value === 'zh' ? 3 : 6 
        itemAmountwidth += offset
      }
    }
    styles.push(`--item-name-maxwidth: calc(100% - ${itemAmountwidth}px)`)
  }
  styles.push(`max-width: ${props.spanMaxWidth ?? 'unset'}`)

  return styles.join('; ')
})

const handleItemIconClick = async () => {
  const action = store.userConfig.item_info_icon_click_event
  const itemName = getItemName()
  let copyContent = ''
  if (action === 'copy_name') {
    copyContent = itemName
  } else if (action === 'copy_isearch') {
    copyContent = `/isearch "${itemName}"`
  } else {
    // do nothing
  }

  if (copyContent) {
    await handleCopy(copyContent, t('common.message.copied_with_content', copyContent))
  }
}
</script>

<template>
  <div ref="itemSpanNode" class="flex items-center gap-[3px]" :style="containerStyle">
    <div v-if="!itemInfo?.valid" class="item-text-container">未知物品({{itemInfo?.id}})</div>
    <template v-else>
      <XivFARImage
        v-show="!hideIcon"
        class="select-none"
        :size="imgSize ?? 14"
        :src="itemInfo"
        :title="(hideName && hidePopIcon) ? getItemName() : ''"
      />
      <div class="item-text-container">
        <span v-show="!hideName" class="item-name">
          {{ hideName ? '' : getItemName() }}
        </span>
        <span v-if="!hideName && showAmount">&nbsp;</span>
        <span v-show="showAmount" ref="itemAmountNode" class="item-amount">
          {{ showAmount ? (' x' + itemAmount) : '' }}
        </span>
      </div>
      <ItemPop
        v-if="!hidePopIcon"
        :item-info="itemInfo"
        pop-use-custom-width
        :pop-custom-width="275"
        :pop-trigger="popTrigger"
      >
        <n-icon v-if="!hidePopIcon" class="item-popicon cursor-pointer" size="14" color="#3b7fef"
          @contextmenu="handleContextMenu"
          @touchstart.passive="handleTouchStart"
          @touchmove.passive="handleTouchMove"
          @touchend.passive="handleTouchEnd"
          @click.stop="handleItemIconClick"
        >
          <InfoOutlined />
          <n-dropdown
            size="small"
            placement="bottom-start"
            trigger="manual"
            :x="dropdownX"
            :y="dropdownY"
            :options="dropdownOptions"
            :show="showDropdown"
            :on-clickoutside="onClickOutside"
            @select="handleSelect"
          />
        </n-icon>
      </ItemPop>
    </template>
  </div>
</template>

<style scoped>
.container {
  .item-text-container {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .item-name {
      display: inline-block;
      max-width: var(--item-name-maxwidth);
      vertical-align: top;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-amount {
      display: inline-block;
      vertical-align: top;
      white-space: nowrap;
    }
  }
}
</style>