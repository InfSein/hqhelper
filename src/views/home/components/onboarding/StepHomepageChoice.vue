<script setup lang="ts">
import type { Component } from 'vue'
import {
  CheckCircleFilled,
  CheckCircleOutlineRound,
  DashboardOutlined,
  CalculateOutlined,
} from '@vicons/material'
import { useLocale } from '@/composables/useLocale'

interface HomepageChoice {
  key: 'hqwb' | 'workflow'
  icon: Component
  title: string
  desc: string
}

const selectedHomepage = defineModel<'hqwb' | 'workflow'>('selectedHomepage', { required: true })

const { t } = useLocale()

const choices = computed<HomepageChoice[]>(() => [
  {
    key: 'workflow',
    icon: CalculateOutlined,
    title: t('onboarding.step_4.workflow_title'),
    desc: t('onboarding.step_4.workflow_desc'),
  },
  {
    key: 'hqwb',
    icon: DashboardOutlined,
    title: t('onboarding.step_4.hqwb_title'),
    desc: t('onboarding.step_4.hqwb_desc'),
  },
])
</script>

<template>
  <div class="w-full py-2 px-4">
    <div class="step-header mb-5">
      <h2 class="text-xl font-bold text-text mb-1">{{ t('onboarding.step_4.title') }}</h2>
      <p class="text-app-xs text-sub">{{ t('onboarding.step_4.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
      <div
        v-for="choice in choices"
        :key="choice.key"
        class="choice-card p-4.5 rounded border transition-all cursor-pointer flex flex-col gap-2.5 select-none"
        :class="selectedHomepage === choice.key ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-bg hover:border-primary/50 hover:bg-bg-hover/40'"
        @click="selectedHomepage = choice.key"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-2.5 rounded bg-primary/10 text-primary flex items-center justify-center">
              <n-icon :component="choice.icon" size="22" />
            </div>
            <span class="font-bold text-text text-app-base">{{ choice.title }}</span>
          </div>
          <n-icon
            :component="selectedHomepage === choice.key ? CheckCircleFilled : CheckCircleOutlineRound"
            size="22"
            :class="selectedHomepage === choice.key ? 'text-primary' : 'text-sub'"
          />
        </div>
        <p class="text-app-xs text-sub leading-relaxed mt-1">
          {{ choice.desc }}
        </p>
      </div>
    </div>
  </div>
</template>
