<script setup lang="ts">
import type { GearSlot } from '@/types/game/gear'
import ItemButton from '@/components/item/ItemButton.vue'
import { getItemInfo } from '@/tools/item'
import { getGearIcon } from '@/tools/game/gear'

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
      <n-divider class="mt-px! mb-1!" />
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
</style>