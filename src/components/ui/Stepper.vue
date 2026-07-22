<script setup lang="ts">
import {
  AddSharp, MinusSharp
} from '@vicons/material'

const modelValue = defineModel<number>('value', { required: true })
const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 99999 },
  containerStyle: { type: String, default: '' },
  inputStyle: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const container = ref<HTMLElement>()
const showButtons = computed(() => {
  if (container.value?.offsetWidth) {
    return container.value.offsetWidth >= 100
  } else {
    return true
  }
})

const handleMinusClick = () => {
  if (modelValue!.value! > props.min) {
    modelValue!.value! -= 1
  }
}
const handlePlusClick = () => {
  if (modelValue!.value! < props.max) {
    modelValue!.value! += 1
  }
}
</script>

<template>
  <div class="stepper" ref="container" :style="containerStyle">
    <n-button v-if="showButtons" size="small" class="stepper-button" :disabled="disabled || modelValue === min" @click="handleMinusClick">
      <template #icon>
        <n-icon><minus-sharp /></n-icon>
      </template>
    </n-button>
    <div class="stepper-input" :style="inputStyle">
      <n-input-number
        v-model:value="modelValue"
        size="small"
        :input-props="{ type: 'number' }"
        :min="min"
        :max="max"
        :precision="0"
        :show-button="false"
        :disabled="disabled"
      />
    </div>
    <n-button v-if="showButtons" size="small" class="stepper-button" :disabled="disabled || modelValue === max" @click="handlePlusClick">
      <template #icon>
        <n-icon><add-sharp /></n-icon>
      </template>
    </n-button>
  </div>
</template>

<style scoped>
.stepper :deep(input.n-input__input-el) {
  text-align: center;
}

.stepper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;

  .stepper-button {
    width: var(--n-height);
  }
  .stepper-input {
    margin: 0 2px;
    max-width: 105px;
  }
}
</style>