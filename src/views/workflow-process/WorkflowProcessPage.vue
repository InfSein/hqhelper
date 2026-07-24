<script setup lang="ts">
import { useWorkflowState } from '@/composables/useWorkflowState'
import { useWorkflowStatistics } from '@/composables/useWorkflowStatistics'
import CraftRecommProcess from '@/components/craft/CraftRecommProcess.vue'

const { currentWorkflow } = useWorkflowState()
const { recommProcessGroups } = useWorkflowStatistics(currentWorkflow)
</script>

<template>
  <div id="main-container" class="wrapper">
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
.wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>