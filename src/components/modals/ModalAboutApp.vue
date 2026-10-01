<script setup lang="ts">
import {
  InfoSharp,
} from '@vicons/material'
import AboutApp from '@/components/app/AboutApp.vue'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'

const { t } = useLocale()
const { isMobile } = useResponsive()

const showModal = defineModel<boolean>('show', { required: true })
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="InfoSharp"
    :title="t('common.appfunc.about_app')"
    :height="isMobile ? '650px' : '600px'"
  >
    <div class="flex flex-col select-text overflow-y-auto" :style="{ height: isMobile ? '550px' : '500px' }">
      <AboutApp />
    </div>
  </MyModal>
</template>

<style scoped>
</style>
