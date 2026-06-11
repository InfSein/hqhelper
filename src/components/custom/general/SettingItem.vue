<script setup lang="ts">
import {
  KeyboardArrowRightOutlined
} from '@vicons/material'
import HelpButton from './HelpButton.vue'
import type { AppTextUi, PreferenceItem } from '@/types/index.ts'
import useUiTools from '@/tools/ui'
import ImageSelector from './ImageSelector.vue'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const { optionsRenderer } = useUiTools(isMobile)

const formData = defineModel<any>('formData', { required: true })
interface SettingItemProps {
  settingItem: PreferenceItem
}
const props = defineProps<SettingItemProps>()

const descriptions = computed(() : AppTextUi[] => {
  return (props.settingItem.descriptions ?? []).map(desc => {
    if (typeof desc === 'string') {
      return { value: desc }
    } else {
      return desc
    }
  })
})
const warnings = computed(() => {
  return (props.settingItem.warnings ?? []).map(warn => {
    if (typeof warn === 'string') {
      return { value: warn }
    } else {
      return warn
    }
  })
})
</script>

<template>
  <div class="setting-item" v-show="!settingItem.hide" :style="{}">
    <n-collapse arrow-placement="right">
      <n-collapse-item>
        <template #header>
          <div class="item-title">{{ settingItem.label }}</div>
          <HelpButton
            v-if="settingItem.require_reload"
            icon="warning"
            color="#F0A020"
            :descriptions="[t('preference.shared.warn.need_refresh')]"
          />
        </template>
        <template #arrow>
          <n-icon v-if="descriptions.length" :title="t('preference.shared.tooltip.click_to_desc')"><KeyboardArrowRightOutlined /></n-icon>
          <n-icon v-else></n-icon>
        </template>

        <div class="item-descriptions">
          <p
            v-for="(description, index) in descriptions"
            :key="settingItem.key + '-description-' + index"
            :class="description.class"
            :style="description.style"
          >
            {{ description.value }}
          </p>
        </div>
      </n-collapse-item>
    </n-collapse>
    <div class="item-descriptions">
      <p
        v-for="(warning, index) in warnings"
        :key="settingItem.key + '-warning-' + index"
        :class="warning.class"
        :style="warning.style"
      >
        {{ warning.value }}
      </p>
    </div>
    <div class="item-input">
      <n-switch
        v-if="settingItem.type ==='switch'"
        v-model:value="formData[settingItem.key]"
      />
      <n-radio-group
        v-if="settingItem.type === 'radio-group'"
        v-model:value="formData[settingItem.key]"
        :name="settingItem.key"
      >
        <n-radio-button
          v-for="(option, index) in settingItem.options"
          :key="settingItem.key + '-option-' + index"
          :value="option.value"
          :label="option.label"
        />
      </n-radio-group>
      <n-select
        v-if="settingItem.type === 'select'"
        v-model:value="formData[settingItem.key]"
        :multiple="settingItem.multiple"
        :options="settingItem.options"
        :render-option="optionsRenderer"
        :style="{ width: isMobile ? '75%' : '60%' }"
        :placeholder="settingItem.placeholder"
      />
      <n-cascader
        v-if="settingItem.type === 'cascader'"
        v-model:value="formData[settingItem.key]"
        :expand-trigger="!isMobile ? 'hover' : 'click'"
        :options="settingItem.options"
        check-strategy="child"
        show-path
        filterable
        :style="{ width: isMobile ? '85%' : '70%' }"
        :placeholder="settingItem.placeholder"
      />
      <n-input
        v-if="settingItem.type === 'string'"
        v-model:value="formData[settingItem.key]"
        type="text"
        :style="{ width: isMobile ? '85%' : '70%' }"
        :placeholder="settingItem.placeholder"
      />
      <n-button
        v-if="settingItem.type === 'button'"
        :type="settingItem.buttonProps?.type ?? 'default'"
        @click="settingItem.buttonProps?.onClick"
      >
        <template #icon>
          <n-icon v-if="settingItem.buttonProps?.icon" :component="settingItem.buttonProps!.icon" />
        </template>
        {{ settingItem.buttonProps?.text }}
      </n-button>
      <ImageSelector
        v-if="settingItem.type === 'image-select'"
        v-model:selectedImage="formData[settingItem.key]"
        :images="settingItem.options"
        :customable="settingItem.custom"
        style="max-width: 90%;"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.n-collapse-item__content-inner) {
  padding-top: 0 !important;
}

.setting-item {
  .item-title {
    font-weight: bold;
  }
  .item-descriptions {
    user-select: text;
  }
  .item-input {
    margin-top: 5px;
  }
}
</style>