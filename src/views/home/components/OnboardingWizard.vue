<script setup lang="ts">
import {
  ArrowBackOutlined,
  ArrowForwardOutlined,
  DoneOutlined,
} from '@vicons/material'
import StepWelcome from './onboarding/StepWelcome.vue'
import StepBasicSettings from './onboarding/StepBasicSettings.vue'
import StepFeatureShowcase from './onboarding/StepFeatureShowcase.vue'
import StepHomepageChoice from './onboarding/StepHomepageChoice.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()

const currentStep = ref(1)
const totalSteps = 4

// 选中的默认首页
const selectedHomepage = ref<'hqwb' | 'workflow'>(store.userConfig.default_homepage || 'hqwb')

const handlePrev = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleNext = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const handleFinish = () => {
  store.userConfig.default_homepage = selectedHomepage.value
  store.userConfig.onboarding_completed = true
  store.updateUserConfig()
  emit('complete')
}
</script>

<template>
  <div class="min-h-[70vh] md:min-h-[80vh] flex items-center justify-center pt-2 md:pt-10 pb-6 md:pb-12 px-1 md:px-3">
    <n-card
      embedded
      :bordered="false"
      :size="isMobile ? 'small' : 'medium'"
      class="max-w-240 w-[98%] rounded overflow-hidden"
      :class="store.userConfig.custom_background ? 'glasscard' : ''"
    >
      <!-- Stepper Header (Steps 2..4) -->
      <div class="mb-3 md:mb-6 px-0 md:px-2 onboarding-steps" :class="currentStep > 1 ? '' : 'hidden md:block md:opacity-0 pointer-events-none'">
        <n-steps :current="currentStep - 1" :status="'process'" size="small">
          <n-step :title="t('onboarding.step_2.name')" />
          <n-step :title="t('onboarding.step_3.name')" />
          <n-step :title="t('onboarding.step_4.name')" />
        </n-steps>
      </div>

      <div class="w-full md:min-h-95 md:max-h-[50vh] flex items-center justify-center">
        <Transition name="step-fade" mode="out-in">
          <StepWelcome
            v-if="currentStep === 1"
            key="step-1"
            @next="handleNext"
          />
          <StepBasicSettings
            v-else-if="currentStep === 2"
            key="step-2"
          />
          <StepFeatureShowcase
            v-else-if="currentStep === 3"
            key="step-3"
          />
          <StepHomepageChoice
            v-else-if="currentStep === 4"
            key="step-4"
            v-model:selected-homepage="selectedHomepage"
          />
        </Transition>
      </div>

      <!-- Action Footer (Steps 2..4) -->
      <template #action>
        <div class="flex items-center justify-between" :class="currentStep > 1 ? '' : 'hidden md:flex md:opacity-0 pointer-events-none'">
          <n-button quaternary @click="handlePrev">
            <template #icon>
              <n-icon><ArrowBackOutlined /></n-icon>
            </template>
            {{ t('onboarding.btn.prev') }}
          </n-button>

          <n-button
            v-if="currentStep < totalSteps"
            type="primary"
            class="px-6 font-bold"
            @click="handleNext"
          >
            {{ t('onboarding.btn.next') }}
            <template #icon>
              <n-icon><ArrowForwardOutlined /></n-icon>
            </template>
          </n-button>

          <n-button
            v-else
            type="primary"
            class="px-6 font-bold"
            @click="handleFinish"
          >
            <template #icon>
              <n-icon><DoneOutlined /></n-icon>
            </template>
            {{ t('onboarding.btn.finish') }}
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

<style scoped>
.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.step-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.step-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media screen and (max-width: 767px) {
  .onboarding-steps :deep(.n-step-indicator) {
    margin-right: 4px;
  }
  .onboarding-steps :deep(.n-step-content-header) {
    font-size: var(--app-font-size-xs);
  }
}
</style>
