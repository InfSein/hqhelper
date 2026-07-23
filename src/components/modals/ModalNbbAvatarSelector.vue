<script setup lang="ts">
import { 
  FaceRetouchingNaturalFilled, DoneOutlined,
} from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { getImgCdnUrl } from '@/tools/game'

import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()

const showModal = defineModel<boolean>('show', { required: true })
const avatarId = defineModel<number>('avatarId', { required: true })

const selectedAvatar = ref(0)

const availableAvatars = computed(() => {
  const min = 64326; const max = 64467
  const exclude = [
    64350,64351,
    64460,64463,64465,
  ]
  const data = [
    //29021
  ]
  data.push(
    ...Array.from(
      { length: max - min + 1 },
      (_, i) => i + min
    ).filter(n => !exclude.includes(n))
  )
  return data
})

const onLoad = () => {
  selectedAvatar.value = avatarId.value || 64384
}

const handleAvatarButtonClick = (aid: number) => {
  if (selectedAvatar.value === aid) {
    handleSubmit()
  } else {
    selectedAvatar.value = aid
  }
}

const handleSubmit = () => {
  avatarId.value = selectedAvatar.value
  showModal.value = false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="FaceRetouchingNaturalFilled"
    :title="t('cloud.text.select_avatar')"
    max-width="500px"
    @on-load="onLoad"
  >
    <div class="wrapper" ref="wrapper">
      <n-button
        v-for="aid in availableAvatars"
        :key="`avatar-${aid}`"
        :type="selectedAvatar === aid ? 'primary' : 'default'"
        class="avatar-button"
        :title="aid"
        @click="handleAvatarButtonClick(aid)"
      >
        <XivFARImage
          :src="getImgCdnUrl(aid)"
          :size="36"
        />
      </n-button>
    </div>

    <template #action>
      <div class="modal-submit-container">
        <n-button type="primary" size="large" @click="handleSubmit">
          <template #icon>
            <n-icon><DoneOutlined /></n-icon>
          </template>
          {{ t('common.confirm') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
.wrapper {
  height: 300px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .avatar-button {
    padding: 1px;
    width: 42px;
    height: 42px;
  }
}
</style>