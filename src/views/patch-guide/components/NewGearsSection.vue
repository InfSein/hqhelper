<script setup lang="ts">
import { computed } from 'vue'
import { ShieldOutlined, HandymanOutlined } from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { XivJobs, XivRoles, HqData, type XivPatchVer, type XivRoleKey, type XivRole } from '@/assets/data'
import {
  calcJobGearMaterials,
  calcCrafterGearMaterials,
  calcGathererGearMaterials,
  mergeCategorizedMaterials,
  type CategorizedMaterials,
} from '@/tools/game/patch-guide'

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

// 生产职业素材
const crafterData = computed(() => {
  return calcCrafterGearMaterials(props.patchVer)
})

// 采集职业素材
const gathererData = computed(() => {
  return calcGathererGearMaterials(props.patchVer)
})

// 汇总生产采集
const lifeTotalData = computed(() => {
  if (!crafterData.value && !gathererData.value) return null
  if (!crafterData.value) return gathererData.value
  if (!gathererData.value) return crafterData.value
  return mergeCategorizedMaterials(crafterData.value, gathererData.value)
})

// 将数组切片为每 size 个一组，用于纯 flex 布局中实现一行最多 N 个
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

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
      v-if="!combatJobsData.length && !lifeTotalData"
      :description="t('patch_guide.empty')"
      class="my-4"
    />

    <div v-else class="flex flex-col gap-6">
      <!-- 1. 战斗职业装备表格 -->
      <div v-if="combatJobsData.length" class="flex flex-col gap-2">
        <!-- 当同时有生产采集装备时显示区分标题 -->
        <div v-if="lifeTotalData" class="flex items-center gap-1.5 font-bold text-app-sm text-sub">
          <n-icon :component="ShieldOutlined" />
          <span>{{ t('patch_guide.gear.combat_gears') }}</span>
        </div>

        <div class="overflow-x-auto rounded border border-border">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="bg-bg-embedded text-app-sm border-b border-border">
                <th class="py-2.5 px-3 font-bold w-44 min-w-40 border-r border-border">{{ t('patch_guide.table.job') }}</th>
                <th class="py-2.5 px-3 font-bold border-r border-border text-center">{{ t('patch_guide.gear.normal_precraft') }}</th>
                <th class="py-2.5 px-3 font-bold border-r border-border min-w-44 text-center">{{ t('patch_guide.gear.aethersand') }}</th>
                <th class="py-2.5 px-3 font-bold text-center">{{ t('patch_guide.gear.master_precraft') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <!-- 各战斗职业行 -->
              <tr
                v-for="row in combatJobsData"
                :key="`job-${row.jobId}`"
                class="transition-colors duration-150 hover:bg-bg-hover align-middle"
              >
                <!-- 职业列 -->
                <td class="py-2.5 px-3 border-r border-border align-middle">
                  <div class="flex items-center gap-2">
                    <XivFARImage
                      v-if="XivJobs[row.jobId]"
                      :size="32"
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

                <!-- 普通半成品列：纯 flex 布局，一行最多 3 个 -->
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="row.materials.normalPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(row.materials.normalPrecrafts, 3)"
                      :key="sIdx"
                      class="flex flex-wrap items-center justify-center gap-3"
                    >
                      <ItemSpan
                        v-for="item in subGroup"
                        :key="item.id"
                        :item-info="item"
                        :amount="item.amount"
                        show-amount
                        :img-size="18"
                      />
                    </div>
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>

                <!-- 灵砂列：纯 flex 布局，一行最多 1 个 -->
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="row.materials.aethersands.length" class="flex flex-col items-center justify-center gap-1.5">
                    <ItemSpan
                      v-for="item in row.materials.aethersands"
                      :key="item.id"
                      :item-info="item"
                      :amount="item.amount"
                      show-amount
                      :img-size="18"
                    />
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>

                <!-- 秘籍半成品列：纯 flex 布局，一行最多 3 个 -->
                <td class="py-2.5 px-3 text-center align-middle">
                  <div v-if="row.materials.masterPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(row.materials.masterPrecrafts, 3)"
                      :key="sIdx"
                      class="flex flex-wrap items-center justify-center gap-3"
                    >
                      <ItemSpan
                        v-for="item in subGroup"
                        :key="item.id"
                        :item-info="item"
                        :amount="item.amount"
                        show-amount
                        :img-size="18"
                      />
                    </div>
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. 生产采集职业装备表格 -->
      <div v-if="lifeTotalData" class="flex flex-col gap-2">
        <!-- 当同时有战斗职业装备时显示区分标题 -->
        <div v-if="combatJobsData.length" class="flex items-center gap-1.5 font-bold text-app-sm text-sub">
          <n-icon :component="HandymanOutlined" />
          <span>{{ t('patch_guide.gear.life_gears') }}</span>
        </div>

        <div class="overflow-x-auto rounded border border-border">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="bg-bg-embedded text-app-sm border-b border-border">
                <th class="py-2.5 px-3 font-bold w-44 min-w-40 border-r border-border">{{ t('patch_guide.table.job') }}</th>
                <th class="py-2.5 px-3 font-bold border-r border-border text-center">{{ t('patch_guide.gear.normal_precraft') }}</th>
                <th class="py-2.5 px-3 font-bold border-r border-border min-w-44 text-center">{{ t('patch_guide.gear.aethersand') }}</th>
                <th class="py-2.5 px-3 font-bold text-center">{{ t('patch_guide.gear.master_precraft') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <!-- 生产职业总需求行 -->
              <tr
                v-if="crafterData"
                class="transition-colors duration-150 hover:bg-bg-hover align-middle"
              >
                <td class="py-2.5 px-3 border-r border-border align-middle">
                  <span class="font-bold text-app-sm">{{ t('patch_guide.gear.crafter_total') }}</span>
                </td>
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="crafterData.normalPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(crafterData.normalPrecrafts, 3)"
                      :key="sIdx"
                      class="flex flex-wrap items-center justify-center gap-3"
                    >
                      <ItemSpan
                        v-for="item in subGroup"
                        :key="item.id"
                        :item-info="item"
                        :amount="item.amount"
                        show-amount
                        :img-size="18"
                      />
                    </div>
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="crafterData.aethersands.length" class="flex flex-col items-center justify-center gap-1.5">
                    <ItemSpan
                      v-for="item in crafterData.aethersands"
                      :key="item.id"
                      :item-info="item"
                      :amount="item.amount"
                      show-amount
                      :img-size="18"
                    />
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
                <td class="py-2.5 px-3 text-center align-middle">
                  <div v-if="crafterData.masterPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(crafterData.masterPrecrafts, 3)"
                      :key="sIdx"
                      class="flex flex-wrap items-center justify-center gap-3"
                    >
                      <ItemSpan
                        v-for="item in subGroup"
                        :key="item.id"
                        :item-info="item"
                        :amount="item.amount"
                        show-amount
                        :img-size="18"
                      />
                    </div>
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
              </tr>

              <!-- 采集职业总需求行 -->
              <tr
                v-if="gathererData"
                class="transition-colors duration-150 hover:bg-bg-hover align-middle"
              >
                <td class="py-2.5 px-3 border-r border-border align-middle">
                  <span class="font-bold text-app-sm">{{ t('patch_guide.gear.gatherer_total') }}</span>
                </td>
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="gathererData.normalPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(gathererData.normalPrecrafts, 3)"
                      :key="sIdx"
                      class="flex flex-wrap items-center justify-center gap-3"
                    >
                      <ItemSpan
                        v-for="item in subGroup"
                        :key="item.id"
                        :item-info="item"
                        :amount="item.amount"
                        show-amount
                        :img-size="18"
                      />
                    </div>
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="gathererData.aethersands.length" class="flex flex-col items-center justify-center gap-1.5">
                    <ItemSpan
                      v-for="item in gathererData.aethersands"
                      :key="item.id"
                      :item-info="item"
                      :amount="item.amount"
                      show-amount
                      :img-size="18"
                    />
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
                <td class="py-2.5 px-3 text-center align-middle">
                  <div v-if="gathererData.masterPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(gathererData.masterPrecrafts, 3)"
                      :key="sIdx"
                      class="flex flex-wrap items-center justify-center gap-3"
                    >
                      <ItemSpan
                        v-for="item in subGroup"
                        :key="item.id"
                        :item-info="item"
                        :amount="item.amount"
                        show-amount
                        :img-size="18"
                      />
                    </div>
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
              </tr>

              <!-- 生产采集汇总行 -->
              <tr
                v-if="lifeTotalData"
                class="bg-bg-embedded/40 transition-colors duration-150 hover:bg-bg-hover align-middle border-t-2 border-border font-bold"
              >
                <td class="py-2.5 px-3 border-r border-border align-middle">
                  <span class="font-bold text-app-sm">{{ t('patch_guide.gear.life_total') }}</span>
                </td>
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="lifeTotalData.normalPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(lifeTotalData.normalPrecrafts, 3)"
                      :key="sIdx"
                      class="flex flex-wrap items-center justify-center gap-3"
                    >
                      <ItemSpan
                        v-for="item in subGroup"
                        :key="item.id"
                        :item-info="item"
                        :amount="item.amount"
                        show-amount
                        :img-size="18"
                      />
                    </div>
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="lifeTotalData.aethersands.length" class="flex flex-col items-center justify-center gap-1.5">
                    <ItemSpan
                      v-for="item in lifeTotalData.aethersands"
                      :key="item.id"
                      :item-info="item"
                      :amount="item.amount"
                      show-amount
                      :img-size="18"
                    />
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
                <td class="py-2.5 px-3 text-center align-middle">
                  <div v-if="lifeTotalData.masterPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(lifeTotalData.masterPrecrafts, 3)"
                      :key="sIdx"
                      class="flex flex-wrap items-center justify-center gap-3"
                    >
                      <ItemSpan
                        v-for="item in subGroup"
                        :key="item.id"
                        :item-info="item"
                        :amount="item.amount"
                        show-amount
                        :img-size="18"
                      />
                    </div>
                  </div>
                  <span v-else class="text-sub text-app-xs">{{ t('common.nothing') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </FoldableCard>
</template>

<style scoped>
</style>
