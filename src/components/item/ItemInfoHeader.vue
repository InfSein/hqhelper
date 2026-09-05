<script lang="ts" setup>
import {
  InfoOutlined,
} from '@vicons/material'
import ItemPop from './ItemPop.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useStore } from '@/store'
import useConfig from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { useItemContextMenu } from '@/composables/useItemContextMenu'
import type { ItemInfo } from '@/tools/item'

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()
const {
  itemLanguage,
} = useConfig()

interface ItemInfoHeaderProps {
  itemInfo: ItemInfo
  showHqSwitcher?: boolean
  hqReadonly?: boolean
  showPop?: boolean
  allowPop?: boolean
  enablePop?: boolean
  containerId?: string
}
const props = defineProps<ItemInfoHeaderProps>()

const canShowPop = computed(() => !!(props.showPop || props.allowPop || props.enablePop))

const hq = defineModel<boolean>('hq', { default: true })

const onToggleHq = () => {
  if (props.hqReadonly) return
  hq.value = !hq.value
}

const switcherTip = computed(() => {
  if (!props.showHqSwitcher) return ''
  return [
    t('item.text.curr_show_hqornq', [(hq.value ? 'HQ' : 'NQ')]),
    props.hqReadonly
      ? t('item.text.cannot_switch_hqornq', [(hq.value ? 'NQ' : 'HQ')])
      : t('item.text.click_to_switch_hqornq'),
  ].join('\r\n')
})

const getItemName = () => {
  switch (itemLanguage.value) {
    case 'zh':
      return props.itemInfo.name_zh || '未翻译的物品'
    default:
      return props.itemInfo[`name_${itemLanguage.value}`]
  }
}
/** 获取物品副名称(即其他语言的名称) */
const getItemSubName = () => {
  switch (itemLanguage.value) {
    case 'ja':
      return props.itemInfo.name_en
    case 'en':
      return props.itemInfo.name_ja
    case 'zh':
    default:
      return props.itemInfo.name_ja + ' / ' + props.itemInfo.name_en
  }
}

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
  () => props.containerId,
)

// #endregion

const popTrigger = computed(() => {
  if (!isMobile.value && store.userConfig.click_to_show_pop_in_span) {
    return 'click'
  } else {
    return undefined
  }
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
  <div class="flex items-start gap-1.25 mt-[2%]">
    <XivFARImage
      :src="itemInfo"
      :size="35"
      @contextmenu="handleContextMenu"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend.passive="handleTouchEnd"
    />
    <div class="item-names">
      <div class="main">
        <span>{{ getItemName() }}</span>
        <span
          v-if="showHqSwitcher"
          class="hq-switcher"
          :class="{ 'is-nq': !hq, 'is-readonly': hqReadonly }"
          :title="switcherTip"
          @click="onToggleHq"
        >
          <i class="xiv hq" />
          <svg class="slash-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" class="slash-bg" />
            <line x1="0" y1="0" x2="100" y2="100" class="slash-line" />
          </svg>
        </span>
        <ItemPop
          v-if="canShowPop"
          :item-info="itemInfo"
          pop-use-custom-width
          :pop-custom-width="275"
          :pop-trigger="popTrigger"
        >
          <n-icon
            class="cursor-pointer ml-0.5 mt-px"
            size="14"
            color="#3b7fef"
            @contextmenu="handleContextMenu"
            @touchstart.passive="handleTouchStart"
            @touchmove.passive="handleTouchMove"
            @touchend.passive="handleTouchEnd"
            @click.stop="handleItemIconClick"
          >
            <InfoOutlined />
          </n-icon>
        </ItemPop>
      </div>
      <div class="sub text-sub">{{ getItemSubName() }}</div>
    </div>
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
  </div>
</template>

<style scoped>
.item-names {
  .main {
    span {
      line-height: 1;
      font-size: var(--app-font-size-xl);
    }
  }
  .sub,
  .main span.extra-name {
    line-height: 1;
    font-size: var(--app-font-size-xs);
  }
}

.hq-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
  cursor: pointer;
  user-select: none;
  border-radius: 2px;
  line-height: 1;
  transition: opacity 0.2s ease, transform 0.15s ease;

  &:hover:not(.is-readonly) {
    opacity: 0.8;
  }

  &:active:not(.is-readonly) {
    transform: scale(0.92);
  }

  &.is-readonly {
    cursor: not-allowed;
  }

  i.xiv.hq {
    color: var(--n-text-color);
    font-size: var(--app-font-size-lg);
    line-height: 1;
    display: inline-block;
  }

  .slash-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .slash-bg {
    stroke: var(--color-background);
    stroke-width: 18;
    stroke-linecap: round;
    stroke-dasharray: 142;
    stroke-dashoffset: 142;
    transition: stroke-dashoffset 0.25s ease-out;
  }

  .slash-line {
    stroke: var(--color-text);
    stroke-width: 10;
    stroke-linecap: round;
    stroke-dasharray: 142;
    stroke-dashoffset: 142;
    transition: stroke-dashoffset 0.25s ease-out;
  }

  &.is-nq {
    .slash-bg,
    .slash-line {
      stroke-dashoffset: 0;
    }
  }
}
</style>
