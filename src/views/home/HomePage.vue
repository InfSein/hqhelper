<script setup lang="ts">
import OnboardingWizard from './components/OnboardingWizard.vue'
import MainPage from '@/views/main/MainPage.vue'
import WorkflowPage from '@/views/workflow/WorkflowPage.vue'
import { useStore } from '@/store'
import { useResponsive } from '@/composables/useResponsive'

const store = useStore()
const { isMobile } = useResponsive()

const isOnboardingCompleted = computed(() => {
  return !!store.userConfig.onboarding_completed
})

const activeComponent = computed(() => {
  if (isMobile.value) {
    // 移动端固定前往 HQ工作台
    return MainPage
  }
  if (store.userConfig.default_homepage === 'workflow') {
    return WorkflowPage
  }
  return MainPage
})
</script>

<template>
  <div v-if="!isOnboardingCompleted" id="main-container">
    <OnboardingWizard />
  </div>
  <component :is="activeComponent" v-else />
</template>

<style scoped>
</style>
