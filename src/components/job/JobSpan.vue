<script setup lang="ts">
import XivFARImage from '@/components/ui/XivFARImage.vue'
import useConfig from '@/composables/useConfig'
import { XivJobs, type XivJob } from '@/assets/data'

const {
  itemLanguage,
} = useConfig()

const props = defineProps({
  jobId: {
    type: Number,
    required: true
  },
  imgSize: {
    type: Number,
    default: 14
  },
  hideIcon: {
    type: Boolean,
    default: false
  },
  hideName: {
    type: Boolean,
    default: false
  }
})

const jobInfo = computed(() : XivJob => {
  if (XivJobs[props.jobId]) {
    return XivJobs[props.jobId]
  } else {
    return {
      job_id: 0,
      short_name: 'NON',
      job_name_en: 'Unknown',
      job_name_zh: '未知',
      job_name_ja: '未知',
      job_icon_url: './image/game-job/companion/none.png'
    }
  }
})

const getJobName = () => {
  switch (itemLanguage.value) {
    case 'ja':
      return jobInfo.value.job_name_ja
    case 'en':
      return jobInfo.value.job_name_en
    case 'zh':
    default:
      return jobInfo.value.job_name_zh || '未知'
  }
}
</script>

<template>
  <div class="flex items-center">
    <XivFARImage
      v-show="!hideIcon"
      class="img"
      :lazy="false"
      :size="imgSize"
      :src="jobInfo.job_icon_url"
    />
    <span v-show="!hideName" class="name">
      {{ getJobName() }}
    </span>
  </div>
</template>

<style scoped>
</style>