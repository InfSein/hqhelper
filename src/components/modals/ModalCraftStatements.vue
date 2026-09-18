<script setup lang="ts">
import {
  TableViewOutlined,
} from '@vicons/material'
import ModalPreferences from './ModalPreferences.vue'
import CraftStatements from '@/components/craft/CraftStatements.vue'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import type { ItemInfo } from '@/tools/item'

const { t } = useLocale()
const { isMobile } = useResponsive()

const showModal = defineModel<boolean>('show', { required: true })

const props = defineProps({
  craftTargets: {
    type: Array as () => ItemInfo[],
    required: true
  },
  materialsLv1: {
    type: Array as () => ItemInfo[],
    required: true
  },
  materialsLv2: {
    type: Array as () => ItemInfo[],
    required: true
  },
  materialsLv3: {
    type: Array as () => ItemInfo[],
    required: true
  },
  materialsLv4: {
    type: Array as () => ItemInfo[],
    required: true
  },
  materialsLv5: {
    type: Array as () => ItemInfo[],
    required: true
  },
  materialsLvBase: {
    type: Array as () => ItemInfo[],
    required: true
  }
})

const showPreferencesModal = ref(false)
const handleSettingButtonClick = () => {
  showPreferencesModal.value = true
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    id="modal-pro-statements"
    :icon="TableViewOutlined"
    :title="t('common.appfunc.craft_statement')"
    max-width="1500px"
    :height="isMobile ? '650px' : '600px'"
    show-setting
    @on-setting-button-clicked="handleSettingButtonClick"
  >
    <CraftStatements
      inside-modal
      container-id="modal-pro-statements"
      :craft-targets="props.craftTargets"
      :materials-lv1="props.materialsLv1"
      :materials-lv2="props.materialsLv2"
      :materials-lv3="props.materialsLv3"
      :materials-lv4="props.materialsLv4"
      :materials-lv5="props.materialsLv5"
      :materials-lv-base="props.materialsLvBase"
    />
    
    <ModalPreferences
      v-model:show="showPreferencesModal"
      setting-group="craft_statement"
      app-show-fp
    />
  </MyModal>
</template>

<style scoped>
/* All */
.wrapper {
  user-select: text;
}
.wrapper.desktop {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.group .container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
  user-select: text;
}

/* Mobile only */
/* @media (max-width: 768px)*/
</style>