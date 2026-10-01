<script setup lang="ts">
import CraftRecommProcess from '@/components/craft/CraftRecommProcess.vue'
import { useWorkflowState } from '@/composables/useWorkflowState'
import { useWorkflowStatistics } from '@/composables/useWorkflowStatistics'

const { currentWorkflow } = useWorkflowState()
const { recommProcessGroups } = useWorkflowStatistics(currentWorkflow)
</script>

<template>
  <div id="main-container" class="w-full h-full relative flex flex-col gap-2">
    <CraftRecommProcess
      v-model:expanded-blocks="currentWorkflow.recommData.expandedBlocks"
      v-model:completed-items="currentWorkflow.recommData.completedItems"
      :item-groups="recommProcessGroups"
      content-max-height="auto"
      content-max-width="auto"
    />

    <n-back-top />
  </div>
</template>

<style scoped>
</style>
