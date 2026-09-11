<script setup lang="ts">
import { ArrowForwardOutlined } from '@vicons/material'
import AppLogoPlate from '@/components/app/AppLogoPlate.vue'
import { useLocale } from '@/composables/useLocale'

const emit = defineEmits<{
  (e: 'next'): void
}>()

const { t } = useLocale()
</script>

<template>
  <div class="text-center py-4 flex flex-col items-center justify-center">
    <div class="logo-wrapper mb-5">
      <AppLogoPlate />
    </div>
    <h1 class="text-2xl font-bold text-text">{{ t('onboarding.welcome.title') }}</h1>
    <p class="text-app-base text-primary font-medium mb-4">{{ t('onboarding.welcome.subtitle') }}</p>
    <p class="text-app-sm text-sub max-w-125 leading-relaxed">
      {{ t('onboarding.welcome.desc_1') }}
    </p>
    <p class="text-app-sm text-sub max-w-125 mb-8 leading-relaxed">
      {{ t('onboarding.welcome.desc_2') }}
    </p>

    <n-button type="primary" size="large" class="px-8 font-bold" @click="emit('next')">
      <template #icon>
        <n-icon><ArrowForwardOutlined /></n-icon>
      </template>
      {{ t('onboarding.welcome.start_btn') }}
    </n-button>
  </div>
</template>
