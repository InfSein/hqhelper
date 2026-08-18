<script setup lang="ts">
import {
  FestivalOutlined,
} from '@vicons/material'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()

const showModal = defineModel<boolean>('show', { required: true })
interface ModalFestivalEggProps {
}
defineProps<ModalFestivalEggProps>()

const content = computed(() => {
  return [
    t('festival_egg.chirstmas.text.text_2'),
    t('festival_egg.chirstmas.text.text_3'),
    t('festival_egg.chirstmas.text.text_4')
  ]
})
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="FestivalOutlined"
    :title="t('festival_egg.chirstmas.text.text_1')"
    max-width="800px"
  >
    <div class="wrapper">
      <!-- <img alt="-" :src="'./image/IMG_7324.jpg'" :width="isMobile ? '100%' : '750px'" height="auto" /> -->
      <div class="font-small select-text text-right">
        Photographed by 旭柠, 2024.
      </div>
    </div>
    <template #action>
      <div class="select-text">
        <p v-for="(line, lineIndex) in content" :key="`content-${lineIndex}`">
          {{ line }}
        </p>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
</style>
