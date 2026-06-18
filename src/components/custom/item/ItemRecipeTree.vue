<script lang="ts" setup>
import { computed } from 'vue'
import ItemSpan from './ItemSpan.vue'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import { useStore } from '@/store'

const store = useStore()

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
  if (store.userConfig.item_pop_craft_show_crystals) {
    requires.push(...props.item.craftRequireCrystals)
  }
  requires.push(...props.item.craftRequires)
  return requires
})

const getPrefChar = (index: number, total: number) => {
  if (index === total - 1) {
    return '└─'
  }
  return '├─'
}
</script>

<template>
  <div class="bordered" :class="level === 1 ? 'irt-container py-0.5' : ''">
    <ItemSpan v-if="level !== 0" :item-info="item" :amount="amount" show-amount />
    <div v-if="item.craftRequires?.length">
      <div v-for="(require, index) in itemCraftRequires" :key="`cr-${item.id}-${index}`" class="relative" :class="level ">
        <div v-if="level !== 0" class="absolute left-0 top-0 w-6 text-center select-none">
          {{ getPrefChar(index, itemCraftRequires.length) }}
        </div>
        <ItemRecipeTree :item="getItemInfo(require.id)" :amount="require.count * amount" :level="level + 1" />
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