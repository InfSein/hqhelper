<script setup lang="ts">
import type { GearSlot } from '@/models/gears'
import ItemButton from '../item/ItemButton.vue'
import { getItemInfo } from '@/tools/item'
import { getGearIcon } from '@/tools/gears'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

interface GearSlotProps {
  gearSlot: GearSlot
  slotDescription: string
  relatedItem: number
}
const props = defineProps<GearSlotProps>()

const gearIcon = computed(() => getGearIcon(props.gearSlot))
const itemInfo = computed(() => {
  if (!props.relatedItem) return false
  return getItemInfo(props.relatedItem)
})
</script>

<template>
  <n-popover :trigger="isMobile ? 'click' : 'hover'" style="max-width: 300px;">
    <template #trigger>
      <div class="flex items-center justify-center">
        <n-icon size="20" color="var(--color-text-sub)">
          <gearIcon />
        </n-icon>
      </div>
    </template>
    <div>
      <p class="font-bold">{{ slotDescription }}</p>
      <n-divider class="block-divider" />
      <ItemButton
        v-if="itemInfo"
        :item-info="itemInfo"
        show-icon show-name
        pop-use-custom-width
        :pop-custom-width="300"
        btn-extra-style="max-width: 250px;"
      />
      <p v-else>
        {{ t('common.nothing') }}
      </p>
    </div>
  </n-popover>
</template>

<style scoped>
.block-divider {
  margin: 1px 0 5px !important;
}
</style>