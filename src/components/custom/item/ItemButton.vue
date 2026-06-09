<script lang="ts" setup>
// import {
//   FileCopyOutlined,
//   LanguageOutlined,
//   OpenInNewFilled
// } from '@vicons/material'
import XivFARImage from '../general/XivFARImage.vue'
import ItemPop from './ItemPop.vue'
import { getItemContexts, type ItemInfo } from '@/tools/item'
import type { UserConfigModel } from '@/models/config-user'
import type { FuncConfigModel } from '@/models/config-func'
import { CopyToClipboard } from '@/tools'
import UseConfig from '@/tools/use-config'
import { XivJobs } from '@/assets/data'

const t = inject<(message: string, args?: any) => string>('t')!
// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const userConfig = inject<Ref<UserConfigModel>>('userConfig')!
const funcConfig = inject<Ref<FuncConfigModel>>('funcConfig')!
const joinItemsToWorkflow = inject<(items: Record<number, number>) => void>('joinItemsToWorkflow')!

const NAIVE_UI_MESSAGE = useMessage()
const {
  itemLanguage,
} = UseConfig(userConfig, funcConfig)

interface ItemButtonProps {
  /** 道具信息 */
  itemInfo: ItemInfo

  /** 按钮宽度 */
  btnWidth?: string | number;
  /** 按钮高度 */
  btnHeight?: number;
  /** 按钮颜色 */
  btnColor?: string;
  /** 按钮额外样式。
   * * 注意：启用此项将覆盖 `btnWidth` 与 `btnHeight` */
  btnExtraStyle?: string;
  /** 按钮额外类名 */
  btnExtraClass?: string;

  /** 物品信息区域的最大宽度。不指定时会自动全局处理 */
  itemInfoMaxWidth?: string

  /** 悬浮窗使用自定义宽度 */
  popUseCustomWidth?: boolean;
  /** 悬浮窗的自定义宽度，必须同时设置`popUseCustomWidth`才能生效 */
  popCustomWidth?: number;
  /** 悬浮窗的最大宽度 */
  popMaxWidth?: string;

  /** 是否显示物品图标(可选,默认false) */
  showIcon?: boolean;
  /** 是否在物品名前展示生产/采集职业的图标 */
  showCollectorIcon?: boolean;
  /** 是否显示物品名称(可选,默认false) */
  showName?: boolean;
  /** 是否显示物品数量(可选,默认false) */
  showAmount?: boolean;
  /** 按钮是否禁用(可选,默认false) */
  disabled?: boolean;
  /** 是否禁用物品信息提示框(可选,默认false) */
  disablePop?: boolean;

  /** 物品按钮所处容器的ID，在模态框等场景时必须传递，否则无法正常复制物品名 */
  containerId?: string
}
const props = defineProps<ItemButtonProps>()

const getItemName = () => {
  switch (itemLanguage.value) {
    case 'zh':
      return props.itemInfo.name_zh || '未翻译的物品'
    default:
      return props.itemInfo[`name_${itemLanguage.value}`]
  }
}
const itemAmount = computed(() => {
  return userConfig.value.item_amount_use_comma
    ? props.itemInfo.amount.toLocaleString()
    : props.itemInfo.amount
})

const iconSize = computed(() => {
  return (props.btnHeight || 34) - 7
})
const btnWidthVal = computed(() => {
  const _w = props.btnWidth
  if (!_w) return 'auto'
  if (typeof _w === 'string') return _w
  return `${_w}px`
})
const btnHeightVal = computed(() => {
  const _h = props.btnHeight
  if (!_h) return 'auto'
  return `${_h}px`
})

// #region 右键菜单相关

const showDropdownRef = ref(false)
const xRef = ref(0)
const yRef = ref(0)

const handleCopy = async (content: string, successMessage?: string) => {
  let container : HTMLElement | undefined | null
  if (props.containerId) {
    container = document.getElementById(props.containerId)
  }
  const response = await CopyToClipboard(content, container)
  if (response) {
    NAIVE_UI_MESSAGE.error(t('common.message.copy_failed_unexpected_error'))
  } else {
    NAIVE_UI_MESSAGE.success(successMessage ?? t('common.message.copy_succeed'))
  }
}
const itemContexts = computed(() => {
  return getItemContexts(props.itemInfo, itemLanguage.value, t, handleCopy, joinItemsToWorkflow)
})
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  showDropdownRef.value = false
  nextTick().then(() => {
    showDropdownRef.value = true
    xRef.value = e.clientX
    yRef.value = e.clientY
  })
}
const handleSelect = async (key: string | number, option: any) => {
  showDropdownRef.value = false
  if (option?.click) {
    option.click()
  } else {
    itemContexts.value.handleKeyEvent(key, option)
  }
}
const onClickoutside = () => {
  showDropdownRef.value = false
}

// * 移动端通过长按来弹出右键菜单
// 注：这些事件也只会在移动端触发，不用担心在电脑端的兼容性
const touchTimeoutEvent = ref<number | undefined>(undefined)
const handleItemButtonTouchStart = (e: TouchEvent) => {
  touchTimeoutEvent.value = setTimeout(() => {
    if (e?.touches?.length) {
      xRef.value = e.touches[0].clientX
      yRef.value = e.touches[0].clientY
      showDropdownRef.value = true
    } else {
      console.error('No touches found in handleItemButtonTouchStart. event:', e)
    }
  }, 500) // 长按500毫秒触发长按事件
}
const handleItemButtonTouchMove = (/*e: TouchEvent*/) => {
  // 如果有移动则取消所有事件
  clearTimeout(touchTimeoutEvent.value)
  touchTimeoutEvent.value = 0
}
const handleItemButtonTouchEnd = (/*e: TouchEvent*/) => {
  // 按下时长不足以触发长按事件时,触发点击事件
  clearTimeout(touchTimeoutEvent.value)
  if (touchTimeoutEvent.value !== 0) {
    // do click if event added later
  }
}

// #endregion

const handleItemButtonClick = async () => {
  const action = userConfig.value.item_button_click_event
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
  <ItemPop
    :item-info="itemInfo"
    :pop-use-custom-width="popUseCustomWidth"
    :pop-custom-width="popCustomWidth"
    :pop-max-width="popMaxWidth"
    :disable-pop="disablePop"
  >
    <n-button
      class="item-button"
      :class="btnExtraClass"
      :style="btnExtraStyle ?? { width: btnWidthVal, height: btnHeightVal }"
      :disabled="disabled"
      :color="btnColor"
      @contextmenu="handleContextMenu"
      @touchstart.passive="handleItemButtonTouchStart" 
      @touchmove.passive="handleItemButtonTouchMove" 
      @touchend.passive="handleItemButtonTouchEnd"
      @click="handleItemButtonClick"
    >
      <slot>
        <div v-if="itemInfo?.id" class="item-container">
          <div v-if="showIcon" class="item-icon">
            <XivFARImage
              :src="itemInfo"
              :size="iconSize"
            />
          </div>

          <div v-if="showName" class="item-info" :style="{ maxWidth: itemInfoMaxWidth }">
            <div class="item-name-container">
              <XivFARImage
                v-if="showCollectorIcon && itemInfo.craftInfo?.jobId"
                :src="XivJobs[itemInfo.craftInfo?.jobId].job_icon_url"
                :size="14"
              />
              <XivFARImage
                v-else-if="showCollectorIcon && itemInfo.gatherInfo?.jobId"
                :src="XivJobs[itemInfo.gatherInfo?.jobId].job_icon_url"
                :size="14"
              />
              <div class="item-name">
                {{ getItemName() }}
              </div>
            </div>
            <div v-if="showAmount" class="item-amount">
              x {{ itemAmount }}
            </div>
          </div>
        </div>
        <div v-else>
          <div v-if="showIcon" class="item-icon">
            &nbsp;
          </div>

          <div v-if="showName" class="item-info">
            <div class="item-name-container">
              <div class="item-name">
                &nbsp;
              </div>
            </div>
            <div v-if="showAmount" class="item-amount">
              &nbsp;
            </div>
          </div>
        </div>
      </slot>

      <n-dropdown
        size="small"
        placement="bottom-start"
        trigger="manual"
        :x="xRef"
        :y="yRef"
        :options="itemContexts.options"
        :show="showDropdownRef"
        :on-clickoutside="onClickoutside"
        @select="handleSelect"
      />
    </n-button>
  </ItemPop>
</template>

<style scoped>
:deep(.n-button__content){
  width: 100%;
  height: 100%;
}
.small-font {
  font-size: calc(var(--n-font-size) - 2px);
}
.item-button {
  padding: 1px;

  .item-container {
    width: 100%;
    height: 100%;
    padding: 5px;
    display: flex;
    align-items: center;
    gap: 5px;

    .item-icon {
      display: flex;
    }
    .item-info {
      margin-left: auto;
      display: flex;
      flex-direction: column;
      gap: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      .item-name-container {
        display: flex;
        align-items: center;
        gap: 2px;
        justify-content: end;
        .item-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      div {
        text-align: end;
      }
    }
  }
}
.item-popover {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .base-info {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin-top: 2%;

    .item-names {
      .main span {
        line-height: 1;
        font-size: calc(var(--n-font-size) + 2px);
      }
      .sub,
      .main span.extra-name {
        line-height: 1;
        font-size: calc(var(--n-font-size) - 2px);
      }
    }
  }
  .item-divider {
    margin: 0 2px;
  }
  .item-descriptions {
    display: flex;
    flex-direction: column;
    gap: 5px;

    .item-attributes {
      display: flex;
      align-items: center;
      gap: 3px;
      line-height: 1;
      flex-wrap: wrap;

      .item-type {
        display: flex;
        align-items: center;
        gap: 1px;
      }
      .item-type::before { content: "["; }
      .item-type::after { content: "]"; }
    }
    .main-descriptions {
      text-indent: 1em;
      line-height: 1.2;
    }
    .temp-attr-descriptions {
      line-height: 1.2;

      .title {
        margin-top: 2px;
      }
      .content {
        margin-left: 1em;
      }
      .content .block p::before {
        content: "· ";
      }
      .extra {
        font-size: calc(var(--n-font-size) - 2px);
        margin: 2px 0 5px;
      }
    }
    .description-block {
      line-height: 1.2;

      .title {
        font-weight: bold;

        .extra {
          margin-left: 3px;
          font-weight: normal;
          font-size: calc(var(--n-font-size) - 2px);
        }
      }
      .content .item {
        margin-left: 1em;
        display: flex;
        align-items: center;
        gap: 3px;
      }
      .content .other-attrs,
      .content.extra {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
        font-size: calc(var(--n-font-size) - 2px);
      }
    }
    .tail-descriptions {
      margin-top: 5px;
      font-size: calc(var(--n-font-size) - 2px);
      line-height: 1;
    }
  }
}

/* Mobile only */
@media screen and (max-width: 767px) {
  .item-info {
    max-width: 220px;
  }
}
</style>