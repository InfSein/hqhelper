<script setup lang="ts">
import {
  CloseRound,
  OpenInNewFilled,
  PlaylistAddOutlined,
  StarBorderRound,
  StarRound,
} from '@vicons/material'
import ItemSpan from '@/components/item/ItemSpan.vue'
import ItemInfoHeader from '@/components/item/ItemInfoHeader.vue'
import ItemRecipeTree from '@/components/item/ItemRecipeTree.vue'
import TooltipButton from '@/components/ui/TooltipButton.vue'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { getItemInfo } from '@/tools/item'
import type { ItemInfo } from '@/types/item'

const props = defineProps<{
  item: ItemInfo | null
  selectedItem: number
  isStarred: boolean
  inDrawer?: boolean
  containerId?: string
}>()

const emit = defineEmits<{
  'toggle-star': [itemId: number]
  'add-item': [itemId: number]
  'close': []
}>()

const { t } = useLocale()
const { isMobile } = useResponsive()

const simulateCraftItem = () => {
  if (!props.item?.craftInfo?.recipeId) return
  window.open(`https://tnze.yyyy.games/#/recipe?recipeId=${props.item.craftInfo.recipeId}`)
}
</script>

<template>
  <n-card
    v-if="item"
    size="small"
    :bordered="false"
    class="h-full"
    :class="inDrawer ? 'bg-transparent!' : ''"
    content-class="h-full flex flex-col"
  >
    <div class="flex items-start justify-between gap-2">
      <ItemInfoHeader
        show-pop
        :item-info="item"
        :container-id="containerId"
        class="flex-1 mt-0! min-w-0"
      />
      <div class="flex items-center gap-1 shrink-0">
        <n-tooltip
          v-if="item?.craftInfo?.recipeId"
          placement="top"
          :trigger="isMobile ? 'manual' : 'hover'"
        >
          <template #trigger>
            <n-button
              quaternary
              size="small"
              class="shrink-0 n-square-button"
              @click="emit('toggle-star', item.id)"
            >
              <template #icon>
                <n-icon :size="20" :color="isStarred ? '#F6CA45' : undefined">
                  <StarRound v-if="isStarred" />
                  <StarBorderRound v-else />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ isStarred ? t('workflow.notebook_starred.unstar_recipe') : t('workflow.notebook_starred.star_recipe') }}
        </n-tooltip>
        <n-button
          v-if="inDrawer"
          quaternary
          size="small"
          class="shrink-0 n-square-button"
          @click="emit('close')"
        >
          <template #icon>
            <n-icon :size="20"><CloseRound /></n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <div class="h-1" />
    <div class="flex flex-wrap items-center gap-x-2 text-app-xs">
      <div class="flex-1">
        {{ t('item.text.recipe_detail', {
          dur: item.craftInfo?.durability,
          pro: item.craftInfo?.progress,
          qua: item.craftInfo?.quality,
        }) }}
      </div>
      <div v-if="(item.craftInfo?.yields || 1) > 1" class="text-success">
        {{ t('item.text.yields_info', item.craftInfo?.yields) }}
      </div>
      <div v-if="!item.craftInfo?.qsable" class="text-error">{{ t('item.text.cannot_quick_synthesis') }}</div>
      <div v-if="!item.craftInfo?.hqable" class="text-error">{{ t('item.text.cannot_hq') }}</div>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 text-app-xs">
      <div v-if="item.craftInfo?.thresholds?.craftsmanship">
        {{ t('recipe.text.craftsmanship_needs', [item.craftInfo?.thresholds?.craftsmanship]) }}
      </div>
      <div v-if="item.craftInfo?.thresholds?.control">
        {{ t('recipe.text.control_needs', [item.craftInfo?.thresholds?.control]) }}
      </div>
    </div>
    <div v-if="item.craftInfo?.masterRecipeId" class="flex items-center justify-end gap-0.5 text-app-xs">
      {{ t('item.text.need_learn') }}
      <ItemSpan
        span-max-width="180px"
        :img-size="12"
        :item-info="getItemInfo(item.craftInfo.masterRecipeId)"
        :container-id="containerId"
        class="gap-0.5!"
      />
    </div>
    <n-divider class="my-1!" />
    <div class="font-bold ml-1 pb-0.5">
      {{ t('recipe.recipe_requirement') }}
    </div>
    <n-scrollbar class="ml-1 flex-1">
      <ItemRecipeTree
        :level="0"
        :item="item"
        :amount="1"
        :container-id="containerId"
        show-root-tree
      />
    </n-scrollbar>
    <n-divider class="my-1!" />
    <div class="flex justify-end gap-2">
      <n-button @click="simulateCraftItem">
        <template #icon>
          <n-icon :size="18"><OpenInNewFilled /></n-icon>
        </template>
        {{ t('common.simulate_craft') }}
      </n-button>
      <TooltipButton
        type="info"
        :ghost="selectedItem !== item.id"
        :tip="[t('workflow.text.add_item_to_curr_workflow.tip_1'), t('workflow.text.add_item_to_curr_workflow.tip_2')]"
        @click="emit('add-item', item.id)"
      >
        <template #icon>
          <n-icon :size="18"><PlaylistAddOutlined /></n-icon>
        </template>
        {{ t('workflow.text.join_in_curr_workflow') }}
      </TooltipButton>
    </div>
  </n-card>
  <div v-else class="h-full flex items-center justify-center">
    <n-empty>
      {{ t('workflow.text.notebook_item_not_selected') }}
    </n-empty>
  </div>
</template>
