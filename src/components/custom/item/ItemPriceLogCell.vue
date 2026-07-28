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
      <div class="iplc-content">
        <div class="iplc-left">
          <div>{{ worldName }}</div>
          <div v-if="buyerName" class="buyer">{{ buyerName }}</div>
        </div>
        <div class="iplc-right">
          <div>
            <span class="price">{{ pricePerUnit.toLocaleString() }}</span>
            <i class="xiv gil"></i>
          </div>
          <div class="quantity">
            x{{ quantity.toLocaleString() }}
            <i class="xiv hq" v-if="hq"></i>
          </div>
          <div v-if="time" class="time">
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

  .iplc-content {
    width: 100%;
    height: 64px;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;

    .iplc-left {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .buyer {
        font-size: 12px;
      }
    }
    .iplc-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .price {
        font-size: 20px;
      }
      .quantity {
        font-size: 12px;
      }
      .time {
        font-size: 12px;
        color: var(--color-text-sub);
      }
    }
  }
}
</style>