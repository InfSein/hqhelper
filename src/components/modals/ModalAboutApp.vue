<script setup lang="ts">
import AboutApp from '../custom/general/AboutApp.vue'
import { InfoSharp } from '@vicons/material'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const showModal = defineModel<boolean>('show', { required: true })
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="InfoSharp"
    :title="t('common.appfunc.about_app')"
    :height="isMobile ? '650px' : '600px'"
  >
    <div class="wrapper" :style="{ height: isMobile ? '550px' : '500px' }">
      <AboutApp />
    </div>
  </MyModal>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  user-select: text;
  overflow-y: auto;
}
</style>