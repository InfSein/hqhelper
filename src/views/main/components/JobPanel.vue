<script setup lang="ts">
import JobButton from '@/components/job/JobButton.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { XivJobs, XivRoles, type HqDataVer, type XivPatchVer }from '@/assets/data'
import type { GearSelections } from '@/types/game/gear'

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()

const jobSelected = defineModel<number | undefined>('jobSelected', { required: true })
const gearsSelected = defineModel<GearSelections>('gearsSelected', { required: true })
interface JobPanelProps {
  patchSelected: XivPatchVer | undefined
  patchData?: HqDataVer
}
const props = defineProps<JobPanelProps>()
const emit = defineEmits(['onJobButtonDupliClick'])

const cardDescription = computed(() => {
  if (!jobSelected.value) return t('main.shared.desc.not_selected')
  else return t('main.select_job.desc.selected', getJobName(jobSelected.value))
})
const handleJobSelect = (jobId: number) => {
  if (jobSelected.value === jobId) {
    emit('onJobButtonDupliClick')
  }
  jobSelected.value = jobId
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
      <span class="card-title__text">{{ t('main.select_job.title') }}</span>
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
              @on-btn-clicked="handleJobSelect(job)"
            />
          </div>
        </n-flex>
      </GroupBox>
    </n-flex>
  </FoldableCard>
</template>