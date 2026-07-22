<script lang="ts" setup>
import XivFARImage from '@/components/ui/XivFARImage.vue'
import UseConfig from '@/composables/useConfig.ts'
import type { ItemInfo } from '@/tools/item'

const {
  itemLanguage,
} = UseConfig()

interface ItemInfoHeaderProps {
  itemInfo: ItemInfo
}
const props = defineProps<ItemInfoHeaderProps>()

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
</script>

<template>
  <div class="base-info">
    <XivFARImage
      :src="itemInfo"
      :size="35"
    />
    <div class="item-names">
      <div class="main">
        <span>{{ getItemName() }}</span>
      </div>
      <div class="sub">{{ getItemSubName() }}</div>
    </div>
  </div>
</template>

<style scoped>
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
      color: var(--color-text-sub);
    }
  }
}
</style>