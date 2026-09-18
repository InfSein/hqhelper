<script setup lang="ts">
import ModalGearOverview, { type ModalGearOverviewProps } from '@/components/modals/ModalGearOverview.vue'

export type { ModalGearOverviewProps }

const props = defineProps<ModalGearOverviewProps>()
const showModal = defineModel<boolean>('show', { required: true })
</script>

<template>
  <ModalGearOverview
    v-model:show="showModal"
    v-bind="props"
  />
</template>
