<script setup lang="ts">
import { formatTimestamp } from '@/tools'

interface ItemPriceLogCellProps {
  hq: boolean
  time: number
  pricePerUnit: number
  quantity: number
  worldName?: string
  buyerName?: string
}
defineProps<ItemPriceLogCellProps>()
</script>

<template>
  <div class="iplc-container">
    <n-button>
      <div class="w-full h-[64px] grid grid-cols-[auto_1fr] items-center">
        <div class="text-left flex flex-col gap-[2px]">
          <div>{{ worldName }}</div>
          <div v-if="buyerName" class="text-xs">{{ buyerName }}</div>
        </div>
        <div class="text-right flex flex-col gap-[2px]">
          <div>
            <span class="text-[20px]">{{ pricePerUnit.toLocaleString() }}</span>
            <i class="xiv gil"></i>
          </div>
          <div class="text-xs">
            x{{ quantity.toLocaleString() }}
            <i class="xiv hq" v-if="hq"></i>
          </div>
          <div v-if="time" class="text-xs text-sub">
            {{ formatTimestamp(time * 1000) }}
          </div>
        </div>
        <template v-if="time">
        </template>
      </div>
    </n-button>
  </div>
</template>

<style scoped>
.iplc-container :deep(.n-button__content) {
  width: 100%;
  height: 100%;
}
.iplc-container {
  width: 100%;

  button {
    width: 100%;
    height: 100%;
  }
}
</style>