<script setup lang="ts">
import { type PreferenceItemImageSelectOption } from '@/types'
import { deepCopy } from '@/tools'
import { useDialog } from '@/composables/useDialog'
import useIdb from '@/utils/app.idb'
import type { dbKey } from '@/utils/app.idb'

const t = inject<(message: string, args?: any) => string>('t')!

const idb = useIdb()
const { confirm } = useDialog()

const selectedImage = defineModel<string>('selectedImage', { required: true })

interface ImageSelectorProps {
  images: PreferenceItemImageSelectOption[]
  customable?: {
    allow: boolean
    key: dbKey
  }
}
const props = defineProps<ImageSelectorProps>()

const customImage = ref('')
const uploadInputRef = useTemplateRef('uploadInputRef')

onMounted(async () => {
  await loadCustomImage()
})

const images = computed(() => {
  const _images = deepCopy(props.images)
  if (customImage.value) {
    _images.push({ value: 'custom' })
  }
  return _images
})

const getImageSrc = (img: string) => {
  switch (img) {
    case '':
      return ''
    case 'custom':
      return customImage.value
    default:
      return img
  }
}

const loadCustomImage = async () => {
  if (!props.customable?.key) return
  const imgBlob = await idb[props.customable.key].get()
  if (imgBlob) {
    customImage.value = URL.createObjectURL(imgBlob)
  }
}

const handleStartUpload = async () => {
  if (!uploadInputRef.value) {
    console.error('uploadInputRef is not defined')
    return
  }
  if (customImage.value) {
    if (!await confirm(
      t('common.image_selector.tooltip.custom_image_would_be_rewritten')
      + '\n' + t('common.message.ask_continue')
    )) return
  }
  uploadInputRef.value.click()
}
const handleImageUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (!props.customable?.key) {
    console.error('handleImageUploaded called without custom key'); return
  }

  await idb[props.customable.key].set(file)
  await loadCustomImage()
  
  if (customImage.value) {
    selectedImage.value = 'custom'
  }
}
</script>

<template>
  <div class="isr-container">
    <n-button
      v-for="image in images"
      :key="`isr-${image}`"
      class="image-button"
      :class="image.value === selectedImage ? 'selected no-border' : ''"
      :disabled="image.value === 'custom' && !customImage"
      :style="`background-image: url(${getImageSrc(image.value)});`"
      @click="selectedImage = image.value"
    >
      <div
        class="image-button-content"
      >
        <div class="image-button-text">
          {{ image.label }}
        </div>
      </div>
    </n-button>
    <n-button
      v-if="customable"
      class="image-button"
      @click="handleStartUpload"
    >
      <div class="image-button-content">
        <div class="image-button-text">
          {{ t('common.image_selector.text.custom_image') }}
        </div>
      </div>
    </n-button>

    <input
      type="file"
      accept="image/*"
      ref="uploadInputRef"
      class="hidden"
      @change="handleImageUpload"
    />
  </div>
</template>

<style scoped>
.isr-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .image-button {
    padding: 5px 10px;
    width: 128px;
    height: 72px;
    background-position-x: center;
    background-position-y: center;
    background-repeat: no-repeat;
    background-size: auto 100%;

    .image-button-content {
      display: flex;
      justify-content: center;
      align-items: end;
      width: 100%;
      height: 100%;
      background-position-x: center;
      background-position-y: center;
      background-repeat: no-repeat;
      background-size: auto 100%;
    }
  }
  .image-button.selected {
    border: var(--n-border-pressed);
    color: var(--n-text-color-hover);
    .image-button-text {
      color: white;
      text-shadow: 2px 2px 4px #000000;
    }
    .n-button__border {
      display: none;
    }
  }
}
</style>