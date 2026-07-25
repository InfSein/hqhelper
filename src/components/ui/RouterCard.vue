<script setup lang="ts">
import {
  HomeOutlined,
} from '@vicons/material'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'

const store = useStore()
const { t } = useLocale()

defineProps({
  pageName: {
    type: String,
    required: true
  },
  pageIcon: {
    type: Object as () => any,
    required: true
  }
})

const cardClasses = computed(() => {
  return [
    store.userConfig.custom_background ? 'glasscard' : ''
  ].join(' ')
})
</script>

<template>
  <n-card id="router-card" :class="cardClasses" embedded :bordered="false">
    <div class="wrapper">
      <n-breadcrumb separator=">">
        <n-breadcrumb-item @click="$router.push('/')" :title="t('common.back_to_index')">
          <n-icon :component="HomeOutlined" /> {{ t('common.index' )}}
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          <n-icon :component="pageIcon" /> {{ pageName }}
        </n-breadcrumb-item>
      </n-breadcrumb>
      <div class="tip-container">
        <p>{{ t('common.route_card_desc') }}</p>
      </div>
    </div>
  </n-card>
</template>

<style scoped>
.tip-container {
  text-indent: 1em;
}
</style>