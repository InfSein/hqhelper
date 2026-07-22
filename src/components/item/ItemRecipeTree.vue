<script lang="ts" setup>
import { computed } from 'vue'
import ItemSpan from './ItemSpan.vue'
import { getItemInfo, type ItemInfo } from '@/tools/item'

interface ItemRecipeTreeProps {
  item: ItemInfo
  amount: number
  level: number
}
const props = defineProps<ItemRecipeTreeProps>()

const itemCraftRequires = computed(() => {
  const requires : {
    id: number;
    count: number;
  }[] = []
  requires.push(...props.item.craftRequires)
  return props.item.craftRequires.map(require => {
    const requireItem = getItemInfo(require.id)
    const targetItemYield = props.item?.craftInfo?.yields ?? 1
    const craftRounds = Math.ceil(props.amount / targetItemYield)
    return {
      ...require,
      targetItem: props.item,
      requireItem: requireItem,
      needAmount: require.count * craftRounds,
    }
  })
})
</script>

<template>
  <div class="bordered" :class="level === 1 ? 'irt-container py-0.5 px-1' : ''">
    <ItemSpan v-if="level !== 0" :item-info="item" :amount="amount" show-amount />
    <div v-if="item.craftRequires?.length" class="relative">
      <div
        v-for="(require, index) in itemCraftRequires"
        :key="`cr-${item.id}-${index}`"
        class="relative"
      >
        <!-- 树枝线条 -->
        <template v-if="level !== 0">
          <!-- 垂直线条 -->
          <div 
            class="absolute left-2 top-0 border-l border-(--color-text-sub) opacity-50"
            :class="index === itemCraftRequires.length - 1 ? 'h-2.75' : 'bottom-0'"
          ></div>
          <!-- 水平线条 -->
          <div 
            class="absolute left-2 top-2.75 w-3 border-t border-(--color-text-sub) opacity-50"
          ></div>
        </template>

        <div :class="level !== 0 ? 'pl-6' : ''">
          <ItemRecipeTree :item="require.requireItem" :amount="require.needAmount" :level="level + 1" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.irt-container {
  border-radius: 4px;

  &:hover {
    background-color: var(--color-background-hover);
  }
}
</style>