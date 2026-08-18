<script setup lang="ts">
import { cloneVNode, useSlots } from 'vue'

const formSize = inject<Ref<"small" | "medium">>('formSize')!

interface CompactFormItemProps {
  label?: string
  size?: 'small' | 'medium' | 'large'
}
const props = defineProps<CompactFormItemProps>()
const slots = useSlots()

const size = computed(() => {
  return props.size || formSize.value
})
const calSize = (size: "tiny" | "small" | "medium" | "large") => {
  switch (size) {
    case 'tiny':
      return '23px'
    case 'small':
      return '28px'
    case 'medium':
      return '34px'
    case 'large':
      return '40px'
  }
}
const labelStyle = computed(() => {
  return {
    '--n-height': calSize(size.value),
  }
})

const renderInputSlot = () => {
  const defaultSlot = slots.default ? slots.default() : []
  return defaultSlot.map(vnode => {
    const props = vnode.props ?? {}
    if ('size' in props) return vnode
    return cloneVNode(vnode, { size: size.value })
  })
}
</script>

<template>
  <n-input-group :size="size" class="compact-form-item-wrapper">
    <n-input-group-label
      class="cf-label flex items-center min-w-0 overflow-hidden"
      :title="!slots.label ? label : undefined"
      :style="labelStyle"
    >
      <div class="overflow-hidden whitespace-nowrap text-ellipsis leading-[1.5]">
        <slot name="label">{{ label }}</slot>
      </div>
    </n-input-group-label>
    <div class="flex items-center gap-0"><component :is="renderInputSlot" /></div>
  </n-input-group>
</template>

<style scoped>
.compact-form-item-wrapper {
  display: contents;
}
</style>