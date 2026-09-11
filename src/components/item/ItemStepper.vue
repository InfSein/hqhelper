<script setup lang="ts">
import ItemButton from './ItemButton.vue'
import Stepper from '@/components/ui/Stepper.vue'
import { useResponsive } from '@/composables/useResponsive'
import type { ItemInfo } from '@/tools/item'

const { isMobile } = useResponsive()

const value = defineModel<number>('value', { required: true })
defineProps({
  itemInfo: {
    type: Object as PropType<ItemInfo>,
    required: true
  }
})
</script>

<template>
  <div class="grid gap-x-2.5 gap-y-1.25 grid-cols-[minmax(0,4fr)_minmax(0,3fr)] md:grid-cols-[minmax(0,8fr)_minmax(0,6fr)]">
    <ItemButton
      class="w-full"
      :item-info="itemInfo"
      show-icon show-name
      :btn-height="30"
      pop-use-custom-width
      :pop-custom-width="isMobile ? 300 : undefined"
    />
    <Stepper
      class="item-stepper"
      v-model:value="value"
    />
  </div>
</template>

<style scoped>
</style>