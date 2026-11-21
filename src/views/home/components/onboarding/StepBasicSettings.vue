<script setup lang="ts">
import type { Component } from 'vue'
import {
  ColorLensRound,
  DarkModeTwotone,
  LanguageOutlined,
  LightModeTwotone,
  SettingsBrightnessOutlined,
  TranslateOutlined,
} from '@vicons/material'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'

interface SettingOption {
  value: string
  label: string
  icon?: Component
}

interface SettingItem {
  id: string
  icon: Component
  label: string
  value: string
  options: SettingOption[]
  onChange: (val: any) => void
}

const store = useStore()
const { t, setLocale } = useLocale()
const { isMobile } = useResponsive()

const handleUiLanguageChange = (val: 'zh' | 'en' | 'ja') => {
  store.userConfig.language_ui = val
  setLocale(val)
  store.updateUserConfig()
}

const handleItemLanguageChange = (val: 'auto' | 'zh' | 'en' | 'ja') => {
  store.userConfig.language_item = val
  store.updateUserConfig()
}

const handleThemeChange = (val: 'light' | 'dark' | 'system') => {
  store.userConfig.theme = val
  store.updateUserConfig()
}

const settingItems = computed<SettingItem[]>(() => [
  {
    id: 'ui-lang',
    icon: LanguageOutlined,
    label: t('onboarding.step_2.ui_lang'),
    value: store.userConfig.language_ui,
    options: [
      { value: 'zh', label: '简体中文' },
      { value: 'en', label: 'English' },
      { value: 'ja', label: '日本語' },
    ],
    onChange: handleUiLanguageChange,
  },
  {
    id: 'item-lang',
    icon: TranslateOutlined,
    label: t('onboarding.step_2.item_lang'),
    value: store.userConfig.language_item,
    options: [
      { value: 'auto', label: t('common.auto') },
      { value: 'zh', label: '简体中文' },
      { value: 'en', label: 'English' },
      { value: 'ja', label: '日本語' },
    ],
    onChange: handleItemLanguageChange,
  },
  {
    id: 'theme',
    icon: ColorLensRound,
    label: t('onboarding.step_2.theme'),
    value: store.userConfig.theme,
    options: [
      { value: 'light', label: t('preference.theme.option.light'), icon: LightModeTwotone },
      { value: 'dark', label: t('preference.theme.option.dark'), icon: DarkModeTwotone },
      { value: 'system', label: t('preference.theme.option.follow_system'), icon: SettingsBrightnessOutlined },
    ],
    onChange: handleThemeChange,
  },
])
</script>

<template>
  <div class="w-full py-1 md:py-2 px-1 md:px-4">
    <div class="step-header mb-3 md:mb-5">
      <h2 class="text-app-xl font-bold text-text mb-1">{{ t('onboarding.step_2.title') }}</h2>
      <p class="text-app-xs text-sub">{{ t('onboarding.step_2.desc') }}</p>
    </div>

    <div class="settings-list flex flex-col gap-1">
      <div
        v-for="item in settingItems"
        :key="item.id"
        class="p-2 md:p-3.5"
      >
        <div class="flex items-center gap-1 mb-1.5 md:mb-2.5">
          <n-icon :component="item.icon" class="text-primary" />
          <div class="font-bold text-text">{{ item.label }}</div>
        </div>
        <n-radio-group
          :value="item.value"
          :name="item.id"
          :size="isMobile ? 'small' : 'medium'"
          class="onboarding-radio-group max-w-full"
          @update:value="item.onChange"
        >
          <n-radio-button
            v-for="option in item.options"
            :key="option.value"
            :value="option.value"
          >
            <div v-if="option.icon" class="flex items-center gap-1">
              <n-icon :component="option.icon" />
              <span>{{ option.label }}</span>
            </div>
            <template v-else>
              {{ option.label }}
            </template>
          </n-radio-button>
        </n-radio-group>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media screen and (max-width: 767px) {
  .onboarding-radio-group :deep(.n-radio-button) {
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
