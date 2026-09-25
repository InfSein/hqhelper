<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import type { StaffMember } from '@/types/staff'

const { t } = useLocale()
const { isMobile } = useResponsive()

interface StaffGroupProps {
  groupMembers: StaffMember[]
  popTrigger?: 'hover' | 'click' | 'manual'
}
const props = defineProps<StaffGroupProps>()

const popTrigger = computed(() => {
  return props.popTrigger ?? (isMobile.value ? 'click' : 'hover')
})
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <n-popover
      placement="bottom"
      :trigger="popTrigger"
      v-for="member in groupMembers"
      :key="'staff-member-' + member.name"
    >
      <template #trigger>
        <a href="javascript:void(0);" class="flex items-center leading-5 w-fit px-1! py-px!">
          <n-avatar round :size="15" :src="member.avatar_url" fallback-src="./image/game-job/companion/none.png" />
          <div class="ml-0.5">{{ member.name }}</div>
        </a>
      </template>
      <div class="w-50 max-w-[98%] select-text">
        <div class="grid grid-cols-[auto_1fr] gap-1 leading-[1.2]">
          <div>
            <n-avatar round size="medium" :src="member.avatar_url"
              fallback-src="./image/game-job/companion/none.png" />
          </div>
          <div>
            <div class="font-bold text-app-xl">{{ member.name }}</div>
            <div class="text-app-xs">{{ member.desc }}</div>
          </div>
        </div>
        <n-divider class="mx-0! my-1!" />
        <div>
          <p v-for="(intro, i) in member.introductions" :key="member.name + '-intro-' + i">
            {{ intro }}
          </p>
        </div>
        <div class="mt-1">
          <div class="font-bold">{{ t('about_app.staff.jobs.personal_page') }}</div>
          <div>
            <a target="_blank" v-for="(page, pIndex) in member.pages" :key="member.name + '-page-' + pIndex" :href="page.url">
              {{ page.name }}
            </a>
          </div>
        </div>
      </div>
    </n-popover>
  </div>
</template>

<style scoped>
</style>