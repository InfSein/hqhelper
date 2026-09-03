<script setup lang="ts">
import { computed } from 'vue'
import { ShieldOutlined } from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { XivJobs, XivRoles, HqData, type XivPatchVer, type XivRoleKey, type XivRole } from '@/assets/data'
import { calcJobGearMaterials, calcLifeJobsGearMaterials, type CategorizedMaterials } from '@/tools/game/patch-guide'

interface NewGearsSectionProps {
  patchVer: string
}
const props = defineProps<NewGearsSectionProps>()

const { t } = useLocale()
const { uiLanguage } = useConfig()

// 战斗职业角色顺序（与 HQ 工作台一致）
const battleRoleKeys: XivRoleKey[] = [
  'tank',
  'healer',
  'dps_maim',
  'dps_strike',
  'dps_scout',
  'dps_ranged',
  'dps_magic',
]

// 汇总本版本所有可用战斗职业的一整套装备素材
const combatJobsData = computed(() => {
  const patchData = HqData.patches[props.patchVer as XivPatchVer]
  if (!patchData?.mainHand) return []

  const list: {
    jobId: number
    roleKey: XivRoleKey
    role: XivRole
    materials: CategorizedMaterials
  }[] = []

  battleRoleKeys.forEach(roleKey => {
    const role = XivRoles[roleKey]
    const roleJobs = role?.jobs ?? []
    roleJobs.forEach(jobId => {
      if (patchData.mainHand[jobId] && patchData.mainHand[jobId] > 0) {
        const materials = calcJobGearMaterials(props.patchVer, jobId)
        if (materials) {
          list.push({
            jobId,
            roleKey,
            role,
            materials,
          })
        }
      }
    })
  })
  return list
})

// 生产采集全套装备素材
const lifeJobsData = computed(() => {
  return calcLifeJobsGearMaterials(props.patchVer)
})

const getJobName = (jobId: number) => {
  const job = XivJobs[jobId]
  if (!job) return t('common.unknown')
  switch (uiLanguage.value) {
    case 'ja':
      return job.job_name_ja
    case 'en':
      return job.job_name_en
    case 'zh':
    default:
      return job.job_name_zh
  }
}

const getRoleName = (role: XivRole) => {
  if (!role) return ''
  switch (uiLanguage.value) {
    case 'ja':
      return role.role_name_ja
    case 'en':
      return role.role_name_en
    case 'zh':
    default:
      return role.role_name_zh
  }
}
</script>

<template>
  <FoldableCard card-key="patch-guide-gears">
    <template #header>
      <div class="card-title">
        <n-icon :component="ShieldOutlined" />
        <span class="card-title__text">{{ t('patch_guide.section.new_gears') }}</span>
      </div>
    </template>

    <n-empty
      v-if="!combatJobsData.length && !lifeJobsData"
      :description="t('patch_guide.empty')"
      class="my-4"
    />

    <div v-else class="flex flex-col gap-2.5">
      <!-- 说明提示栏 -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-app-xs text-sub pl-1">
        <div v-if="combatJobsData.length" class="flex items-center gap-1">
          <span class="font-bold text-text">• {{ t('patch_guide.table.job') }}:</span>
          <span>{{ t('patch_guide.gear.one_set_desc') }}</span>
        </div>
        <div v-if="lifeJobsData" class="flex items-center gap-1">
          <span class="font-bold text-primary">• {{ t('patch_guide.gear.crafter_gatherer') }}:</span>
          <span>{{ t('patch_guide.gear.life_set_desc') }}</span>
        </div>
      </div>

      <!-- 汇总大表格 -->
      <div class="overflow-x-auto rounded border border-border">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-bg-embedded text-app-sm border-b border-border">
              <th class="py-2.5 px-3 font-bold w-44 min-w-40 border-r border-border">{{ t('patch_guide.table.job') }}</th>
              <th class="py-2.5 px-3 font-bold border-r border-border">{{ t('patch_guide.gear.normal_precraft') }}</th>
              <th class="py-2.5 px-3 font-bold border-r border-border min-w-44">{{ t('patch_guide.gear.aethersand') }}</th>
              <th class="py-2.5 px-3 font-bold">{{ t('patch_guide.gear.master_precraft') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <!-- 各战斗职业行 -->
            <tr
              v-for="row in combatJobsData"
              :key="`job-${row.jobId}`"
              class="transition-colors duration-150 hover:bg-bg-hover align-top"
            >
              <!-- 职业列 -->
              <td class="py-2.5 px-3 border-r border-border">
                <div class="flex items-center gap-2">
                  <XivFARImage
                    v-if="XivJobs[row.jobId]"
                    :size="22"
                    :src="XivJobs[row.jobId].job_icon_url"
                  />
                  <div class="flex flex-col">
                    <span class="font-bold text-app-sm">{{ getJobName(row.jobId) }}</span>
                    <span
                      class="text-app-2xs font-medium"
                      :style="{ color: row.role?.role_color }"
                    >
                      {{ getRoleName(row.role) }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- 普通半成品列 -->
              <td class="py-2.5 px-3 border-r border-border">
                <div v-if="row.materials.normalPrecrafts.length" class="flex flex-wrap gap-x-3 gap-y-1.5">
                  <ItemSpan
                    v-for="item in row.materials.normalPrecrafts"
                    :key="item.id"
                    :item-info="item"
                    :amount="item.amount"
                    show-amount
                    :img-size="18"
                  />
                </div>
                <span v-else class="text-sub text-app-xs">-</span>
              </td>

              <!-- 灵砂列 -->
              <td class="py-2.5 px-3 border-r border-border">
                <div v-if="row.materials.aethersands.length" class="flex flex-wrap gap-x-3 gap-y-1.5">
                  <ItemSpan
                    v-for="item in row.materials.aethersands"
                    :key="item.id"
                    :item-info="item"
                    :amount="item.amount"
                    show-amount
                    :img-size="18"
                  />
                </div>
                <span v-else class="text-sub text-app-xs">-</span>
              </td>

              <!-- 秘籍半成品列 -->
              <td class="py-2.5 px-3">
                <div v-if="row.materials.masterPrecrafts.length" class="flex flex-wrap gap-x-3 gap-y-1.5">
                  <ItemSpan
                    v-for="item in row.materials.masterPrecrafts"
                    :key="item.id"
                    :item-info="item"
                    :amount="item.amount"
                    show-amount
                    :img-size="18"
                  />
                </div>
                <span v-else class="text-sub text-app-xs">-</span>
              </td>
            </tr>

            <!-- 生产采集全套行 -->
            <tr
              v-if="lifeJobsData"
              class="bg-bg-embedded/40 transition-colors duration-150 hover:bg-bg-hover align-top border-t-2 border-border"
            >
              <td class="py-2.5 px-3 border-r border-border">
                <div class="flex flex-col gap-0.5">
                  <span class="font-bold text-app-sm text-primary">{{ t('patch_guide.gear.crafter_gatherer') }}</span>
                  <span class="text-app-2xs text-sub">{{ t('patch_guide.gear.life_set_badge') }}</span>
                </div>
              </td>
              <td class="py-2.5 px-3 border-r border-border">
                <div v-if="lifeJobsData.normalPrecrafts.length" class="flex flex-wrap gap-x-3 gap-y-1.5">
                  <ItemSpan
                    v-for="item in lifeJobsData.normalPrecrafts"
                    :key="item.id"
                    :item-info="item"
                    :amount="item.amount"
                    show-amount
                    :img-size="18"
                  />
                </div>
                <span v-else class="text-sub text-app-xs">-</span>
              </td>
              <td class="py-2.5 px-3 border-r border-border">
                <div v-if="lifeJobsData.aethersands.length" class="flex flex-wrap gap-x-3 gap-y-1.5">
                  <ItemSpan
                    v-for="item in lifeJobsData.aethersands"
                    :key="item.id"
                    :item-info="item"
                    :amount="item.amount"
                    show-amount
                    :img-size="18"
                  />
                </div>
                <span v-else class="text-sub text-app-xs">-</span>
              </td>
              <td class="py-2.5 px-3">
                <div v-if="lifeJobsData.masterPrecrafts.length" class="flex flex-wrap gap-x-3 gap-y-1.5">
                  <ItemSpan
                    v-for="item in lifeJobsData.masterPrecrafts"
                    :key="item.id"
                    :item-info="item"
                    :amount="item.amount"
                    show-amount
                    :img-size="18"
                  />
                </div>
                <span v-else class="text-sub text-app-xs">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </FoldableCard>
</template>

<style scoped>
</style>
