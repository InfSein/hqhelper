<script setup lang="ts">
import XivFARImage from '../custom/general/XivFARImage.vue'
import JobButton from '../custom/job/JobButton.vue'
import {
  XivJobs,
  XivRoles,
  type HqDataVer
}from '@/assets/data'
import type { GearSelections } from '@/models/gears'
import { useStore } from '@/store'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const store = useStore()

const jobSelected = defineModel<number>('jobSelected', { required: true })
const affixesSelected = defineModel<any>('affixesSelected', { required: true })
const gearsSelected = defineModel<GearSelections>('gearsSelected', { required: true })
interface JobPanelProps {
  patchSelected: string
  patchData?: HqDataVer
}
const props = defineProps<JobPanelProps>()
const emit = defineEmits(['onJobButtonDupliClick'])

const cardDescription = computed(() => {
  if (!jobSelected.value) return t('main.shared.desc.not_selected')
  else return t('main.select_job.desc.selected', getJobName(jobSelected.value))
})
const handleJobSelect = (jobId: number, role: any) => {
  if (jobSelected.value === jobId) {
    emit('onJobButtonDupliClick')
  }
  jobSelected.value = jobId
  affixesSelected.value = {
    attire: role.attire,
    accessory: role.accessory
  }
}

const uiLanguage = computed(() => {
  return store.userConfig?.language_ui ?? 'zh'
})

const getRoleName = (role: any) => {
  switch (uiLanguage.value) {
    case 'ja':
      return role.role_name_ja
    case 'en':
      return role.role_name_en
    default:
      return role.role_name_zh
  }
}
const getJobName = (jobId: number) => {
  const _job = XivJobs[jobId]
  switch (uiLanguage.value) {
    case 'ja':
      return _job.job_name_ja
    case 'en':
      return _job.job_name_en
    default:
      return _job.job_name_zh
  }
}
const jobImageSize = computed(() => {
  // * 移动端
  if (isMobile.value) {
    return 32
  }
  // * PC端
  if (window.devicePixelRatio >= 2) {
    return 36 // 4k
  } else if (window.devicePixelRatio >= 1.2) {
    return 32 // 2k
  } else {
    return 28 // default or 1080p
  }
})

const isJobAvailable = (jobId: number) => {
  return !!props.patchData?.mainHand?.[jobId]
}
const isJobGroupAvailable = (group: number[]) => {
  return group.some((jobId: number) => isJobAvailable(jobId))
}
</script>

<template>
  <FoldableCard card-key="select-job" :description="cardDescription">
    <template #header>
      <i class="xiv square-2"></i>
      <span class="card-title-text">{{ t('main.select_job.title') }}</span>
    </template>
    <n-alert
      v-if="!patchSelected"
      type="warning"
      style="margin-bottom: 15px;"
    >
      {{ t('main.select_job.warn.select_patch_first') }}
    </n-alert>
    <n-alert
      v-else-if="jobSelected && !isJobAvailable(jobSelected)"
      type="info"
      style="margin-bottom: 15px;"
    >
      {{ t('main.message.curr_job_not_valid') }}
    </n-alert>

    <n-flex :size="[8,15]">
      <GroupBox
        v-for="(role, roleIndex) in XivRoles"
        :key="roleIndex"
        v-show="!patchSelected || isJobGroupAvailable(role.jobs)"
        :border-color="role.role_color"
      >
        <template #title>
          <XivFARImage
            :src="role.role_icon_url"
            :size="14"
          />
          <span>
            {{ getRoleName(role) }}
          </span>
        </template>
        <n-flex :size="[4,4]">
          <div
            v-for="job in role.jobs"
            :key="'job-'+job"
          >
            <JobButton
              v-model:gears-selected="gearsSelected"
              :selected="jobSelected === job"
              :role="roleIndex"
              :role-name="getRoleName(role)"
              :job-id="job"
              :job-name="getJobName(job)"
              :job-icon="XivJobs[job].job_icon_url"
              :img-size="jobImageSize"
              :btn-color="role.role_color"
              :count="gearsSelected?.mainHand?.[job] || 0"
              :class="{'selected': jobSelected === job}"
              :disabled="!patchSelected || !isJobAvailable(job)"
              :patch-selected="patchSelected"
              :patch-data="patchData"
              @on-btn-clicked="handleJobSelect(job, role)"
            />
          </div>
        </n-flex>
      </GroupBox>
    </n-flex>
  </FoldableCard>
</template>