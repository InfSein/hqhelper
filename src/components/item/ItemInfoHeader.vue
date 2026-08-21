<script lang="ts" setup>
import XivFARImage from '@/components/ui/XivFARImage.vue'
import useConfig from '@/composables/useConfig'
import type { ItemInfo } from '@/tools/item'

const {
  itemLanguage,
} = useConfig()

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
  <div class="flex items-start gap-1.25 mt-[2%]">
    <XivFARImage
      :src="itemInfo"
      :size="35"
    />
    <div class="item-names">
      <div class="main">
        <span>{{ getItemName() }}</span>
      </div>
      <div class="sub text-sub">{{ getItemSubName() }}</div>
    </div>
  </div>
</template>

<style scoped>
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
</style>