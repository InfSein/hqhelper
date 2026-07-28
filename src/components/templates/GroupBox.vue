<script setup lang="ts">
import HelpButton from '../custom/general/HelpButton.vue'

// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

defineProps({
  tiny: {
    type: Boolean,
    default: false
  },
  borderColor: {
    type: String,
    default: '#919191',
  },
  title: {
    type: String,
    default: ''
  },
  titleMaxWidth: {
    type: String,
    default: 'unset'
  },
  descriptions: {
    type: Array as () => string[],
    default: () => []
  },
  containerExtraStyle: {
    type: String,
    default: ''
  },
  contentStyle: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <fieldset class="group-box" :style="`border: 1px dashed ${borderColor}; ${tiny ? 'padding: 0 8px 4px 8px' : ''}; ${containerExtraStyle}`">
    <legend class="group-box-title" :style="{ maxWidth: titleMaxWidth, marginBottom: tiny ? '-7px' : undefined }">
      <slot name="title">
        <div>{{ title }}</div>
        <div v-if="descriptions?.length" style="margin-left: 1px;">
          <HelpButton icon="info" :size="18" :descriptions="descriptions" />
        </div>
      </slot>
    </legend>
    <div class="group-box-content" :style="contentStyle">
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.group-box {
  padding: 0 8px 8px;
  margin-top: -12px;
  border-radius: var(--n-border-radius);

  .group-box-title {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    width: fit-content;
    color: var(--color-text);
    white-space: nowrap;       /* 防止文本换行 */
    overflow: hidden;          /* 隐藏溢出的内容 */
    text-overflow: ellipsis;
  }
  .group-box-content {
    height: 100%;
  }
}
</style>