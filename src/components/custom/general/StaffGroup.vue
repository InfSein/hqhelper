<script setup lang="ts">
import type { StaffMember } from '@/types/staff'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

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
  <div class="member-group">
    <n-popover
      :placement="isMobile ? 'bottom' : 'right-start'"
      :trigger="popTrigger"
      v-for="member in groupMembers"
      :key="'staff-member-' + member.name"
    >
      <template #trigger>
        <a href="javascript:void(0);" class="member">
          <n-avatar round :size="15" :src="member.avatar_url" fallback-src="./image/game-job/companion/none.png" />
          <div class="member-name">{{ member.name }}</div>
        </a>
      </template>
      <div class="intro-popover">
        <div class="base-info">
          <div class="avatar">
            <n-avatar round size="medium" :src="member.avatar_url"
              fallback-src="./image/game-job/companion/none.png" />
          </div>
          <div class="text">
            <div class="name">{{ member.name }}</div>
            <div class="desc">{{ member.desc }}</div>
          </div>
        </div>
        <n-divider />
        <div class="intro">
          <p v-for="(intro, i) in member.introductions" :key="member.name + '-intro-' + i">
            {{ intro }}
          </p>
        </div>
        <div class="tail">
          <div class="title">{{ t('about_app.staff.jobs.personal_page') }}</div>
          <div class="pages">
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
.n-divider {
  margin: 5px 0;
}
.member-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;

  .member {
    display: flex;
    align-items: center;
    line-height: 20px;
    width: fit-content;
    padding: 1px 3px;

    .member-name {
      margin-left: 2px;
    }
  }
}
.intro-popover {
  width: 220px;
  max-width: 98%;
  user-select: text;

  .base-info {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 5px;
    line-height: 1.2;

    .name {
      font-weight: bold;
      font-size: calc(var(--n-font-size) + 2px);
    }
    .desc {
      font-size: calc(var(--n-font-size) - 2px);
    }
  }
  .tail {
    margin-top: 5px;
  }
  .title {
    font-weight: bold;
  }
}
</style>