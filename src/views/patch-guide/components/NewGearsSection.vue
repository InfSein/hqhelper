<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import {
  ShieldOutlined,
  HandymanOutlined,
  ViewModuleOutlined,
  TableViewOutlined,
} from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { useResponsive } from '@/composables/useResponsive'
import { XivJobs, XivRoles, HqData, type XivPatchVer, type XivRoleKey, type XivRole } from '@/assets/data'
import {
  calcJobGearMaterials,
  calcCrafterGearMaterials,
  calcGathererGearMaterials,
  mergeCategorizedMaterials,
  type CategorizedMaterials,
} from '@/tools/game/patch-guide'
import type { ItemInfo } from '@/tools/item'

interface NewGearsSectionProps {
  patchVer: string
}
const props = defineProps<NewGearsSectionProps>()

const store = useStore()
const { t } = useLocale()
const { uiLanguage } = useConfig()
const { isMobile } = useResponsive()
const precraftChunkSize = computed(() => (isMobile.value ? 1 : 3))

// 表格展示模式与切换加载动画状态
const activeMode = ref<'tile' | 'overview'>(store.userConfig.patchguide_gear_table_mode)
const isSwitching = ref(false)

watch(
  () => store.userConfig.patchguide_gear_table_mode,
  (newVal) => {
    if (newVal !== activeMode.value) {
      activeMode.value = newVal
    }
  },
)

const isOverviewMode = computed(() => {
  return activeMode.value === 'overview'
})

const handleModeChange = (val: 'tile' | 'overview') => {
  if (val === activeMode.value) return
  isSwitching.value = true

  // 先让加载动画绘制上屏，避免大量 DOM 挂载阻塞动画帧
  requestAnimationFrame(() => {
    setTimeout(() => {
      activeMode.value = val
      store.userConfig.patchguide_gear_table_mode = val
      store.updateUserConfig()

      nextTick(() => {
        requestAnimationFrame(() => {
          isSwitching.value = false
        })
      })
    }, 60)
  })
}

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

// 计算战斗职业表格各列去重物品（按 id 增序排序）
const combatColumnItems = computed(() => {
  const normalMap = new Map<number, ItemInfo>()
  const aethersandMap = new Map<number, ItemInfo>()
  const masterMap = new Map<number, ItemInfo>()

  for (const row of combatJobsData.value) {
    for (const item of row.materials.normalPrecrafts) {
      if (!normalMap.has(item.id)) normalMap.set(item.id, item)
    }
    for (const item of row.materials.aethersands) {
      if (!aethersandMap.has(item.id)) aethersandMap.set(item.id, item)
    }
    for (const item of row.materials.masterPrecrafts) {
      if (!masterMap.has(item.id)) masterMap.set(item.id, item)
    }
  }

  const normalPrecrafts = Array.from(normalMap.values()).sort((a, b) => a.id - b.id)
  const aethersands = Array.from(aethersandMap.values()).sort((a, b) => a.id - b.id)
  const masterPrecrafts = Array.from(masterMap.values()).sort((a, b) => a.id - b.id)

  return {
    normalPrecrafts,
    aethersands,
    masterPrecrafts,
  }
})

// 计算生产采集职业表格各列去重物品（按 id 增序排序）
const lifeColumnItems = computed(() => {
  if (lifeTotalData.value) {
    return {
      normalPrecrafts: [...lifeTotalData.value.normalPrecrafts].sort((a, b) => a.id - b.id),
      aethersands: [...lifeTotalData.value.aethersands].sort((a, b) => a.id - b.id),
      masterPrecrafts: [...lifeTotalData.value.masterPrecrafts].sort((a, b) => a.id - b.id),
    }
  }
  return {
    normalPrecrafts: [],
    aethersands: [],
    masterPrecrafts: [],
  }
})

// 在材料列表中查找某物品的数量
const findAmount = (items: ItemInfo[] | undefined, itemId: number): number => {
  if (!items) return 0
  return items.find(i => i.id === itemId)?.amount ?? 0
}

// 将数组切片为每 size 个一组，用于平铺模式下的 flex 布局
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

    <div v-else class="flex flex-col gap-4">
      <!-- 模式切换控制器 -->
      <div class="ml-6 flex items-center gap-2">
        <span class="font-bold">
          <i class="xiv ime-en-jp"></i>
          {{ t('patch_guide.gear.view_mode') }}
        </span>
        <n-radio-group
          :value="activeMode"
          size="small"
          name="gear-table-view-mode"
          @update:value="handleModeChange"
        >
          <n-radio-button value="tile">
            <div class="flex items-center gap-1">
              <n-icon :component="ViewModuleOutlined" />
              <span>{{ t('patch_guide.gear.mode_tile') }}</span>
            </div>
          </n-radio-button>
          <n-radio-button value="overview">
            <div class="flex items-center gap-1">
              <n-icon :component="TableViewOutlined" />
              <span>{{ t('patch_guide.gear.mode_overview') }}</span>
            </div>
          </n-radio-button>
        </n-radio-group>
      </div>

      <!-- 表格区域：带 n-spin 加载动画平滑过渡 -->
      <n-spin :show="isSwitching">
        <div class="flex flex-col gap-6">
          <!-- 1. 战斗职业装备表格 -->
          <div v-if="combatJobsData.length" class="flex flex-col gap-2">
        <!-- 当同时有生产采集装备时显示区分标题 -->
        <div v-if="lifeTotalData" class="flex items-center gap-1.5 font-bold text-app-sm text-sub">
          <n-icon :component="ShieldOutlined" />
          <span>{{ t('patch_guide.gear.combat_gears') }}</span>
        </div>

        <!-- 1.A 总览模式表格 -->
        <n-scrollbar v-if="isOverviewMode" class="max-h-[70vh] rounded border border-border">
          <table class="w-full border-collapse text-left">
            <thead>
              <!-- 第一行：分类标题 -->
              <tr class="bg-bg-embedded text-app-sm border-b border-border h-9">
                <th
                  rowspan="2"
                  class="sticky top-0 z-20 bg-bg-embedded py-1.5 px-3 font-bold w-44 min-w-40 border-r border-b border-border align-middle"
                >
                  {{ t('patch_guide.table.job') }}
                </th>
                <th
                  :colspan="Math.max(combatColumnItems.normalPrecrafts.length, 1)"
                  class="sticky top-0 z-10 bg-bg-embedded py-1.5 px-2 font-bold border-r border-b border-border text-center align-middle"
                >
                  {{ t('patch_guide.gear.normal_precraft') }}
                </th>
                <th
                  :colspan="Math.max(combatColumnItems.aethersands.length, 1)"
                  class="sticky top-0 z-10 bg-bg-embedded py-1.5 px-2 font-bold border-r border-b border-border text-center align-middle"
                >
                  {{ t('patch_guide.gear.aethersand') }}
                </th>
                <th
                  :colspan="Math.max(combatColumnItems.masterPrecrafts.length, 1)"
                  class="sticky top-0 z-10 bg-bg-embedded py-1.5 px-2 font-bold border-b border-border text-center align-middle"
                >
                  {{ t('patch_guide.gear.master_precraft') }}
                </th>
              </tr>
              <!-- 第二行：各分类下的物品图标 -->
              <tr class="bg-bg-embedded text-app-sm border-b border-border h-9">
                <!-- 普通半成品图标 -->
                <template v-if="combatColumnItems.normalPrecrafts.length">
                  <th
                    v-for="(item, idx) in combatColumnItems.normalPrecrafts"
                    :key="`c-np-${item.id}`"
                    class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal min-w-14 border-b border-border align-middle"
                    :class="idx === combatColumnItems.normalPrecrafts.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <div class="flex items-center justify-center">
                      <ItemSpan :item-info="item" hide-name :img-size="20" />
                    </div>
                  </th>
                </template>
                <th v-else class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal border-r border-b border-border text-sub text-app-xs min-w-14 align-middle">
                  -
                </th>

                <!-- 灵砂图标 -->
                <template v-if="combatColumnItems.aethersands.length">
                  <th
                    v-for="(item, idx) in combatColumnItems.aethersands"
                    :key="`c-as-${item.id}`"
                    class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal min-w-14 border-b border-border align-middle"
                    :class="idx === combatColumnItems.aethersands.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <div class="flex items-center justify-center">
                      <ItemSpan :item-info="item" hide-name :img-size="20" />
                    </div>
                  </th>
                </template>
                <th v-else class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal border-r border-b border-border text-sub text-app-xs min-w-14 align-middle">
                  -
                </th>

                <!-- 秘籍半成品图标 -->
                <template v-if="combatColumnItems.masterPrecrafts.length">
                  <th
                    v-for="(item, idx) in combatColumnItems.masterPrecrafts"
                    :key="`c-mp-${item.id}`"
                    class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal min-w-14 border-b border-border align-middle"
                    :class="idx === combatColumnItems.masterPrecrafts.length - 1 ? '' : 'border-r border-border/40'"
                  >
                    <div class="flex items-center justify-center">
                      <ItemSpan :item-info="item" hide-name :img-size="20" />
                    </div>
                  </th>
                </template>
                <th v-else class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal border-b border-border text-sub text-app-xs min-w-14 align-middle">
                  -
                </th>
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

                <!-- 普通半成品数量单元格 -->
                <template v-if="combatColumnItems.normalPrecrafts.length">
                  <td
                    v-for="(colItem, idx) in combatColumnItems.normalPrecrafts"
                    :key="`np-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === combatColumnItems.normalPrecrafts.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(row.materials.normalPrecrafts, colItem.id)">
                      {{ findAmount(row.materials.normalPrecrafts, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle border-r border-border text-sub text-app-sm">
                  -
                </td>

                <!-- 灵砂数量单元格 -->
                <template v-if="combatColumnItems.aethersands.length">
                  <td
                    v-for="(colItem, idx) in combatColumnItems.aethersands"
                    :key="`as-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === combatColumnItems.aethersands.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(row.materials.aethersands, colItem.id)">
                      {{ findAmount(row.materials.aethersands, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle border-r border-border text-sub text-app-sm">
                  -
                </td>

                <!-- 秘籍半成品数量单元格 -->
                <template v-if="combatColumnItems.masterPrecrafts.length">
                  <td
                    v-for="(colItem, idx) in combatColumnItems.masterPrecrafts"
                    :key="`mp-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === combatColumnItems.masterPrecrafts.length - 1 ? '' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(row.materials.masterPrecrafts, colItem.id)">
                      {{ findAmount(row.materials.masterPrecrafts, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle text-sub text-app-sm">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </n-scrollbar>

        <!-- 1.B 平铺模式表格 -->
        <div v-else class="overflow-x-auto rounded border border-border">
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
              <tr
                v-for="row in combatJobsData"
                :key="`job-tile-${row.jobId}`"
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

                <!-- 普通半成品列：纯 flex 布局，移动端一行 1 个，桌面端一行最多 3 个 -->
                <td class="py-2.5 px-3 border-r border-border text-center align-middle">
                  <div v-if="row.materials.normalPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(row.materials.normalPrecrafts, precraftChunkSize)"
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

                <!-- 秘籍半成品列：纯 flex 布局，移动端一行 1 个，桌面端一行最多 3 个 -->
                <td class="py-2.5 px-3 text-center align-middle">
                  <div v-if="row.materials.masterPrecrafts.length" class="flex flex-col items-center justify-center gap-1.5">
                    <div
                      v-for="(subGroup, sIdx) in chunkArray(row.materials.masterPrecrafts, precraftChunkSize)"
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

        <!-- 2.A 总览模式表格 -->
        <n-scrollbar v-if="isOverviewMode" class="max-h-[70vh] rounded border border-border">
          <table class="w-full border-collapse text-left">
            <thead>
              <!-- 第一行：分类标题 -->
              <tr class="bg-bg-embedded text-app-sm border-b border-border h-9">
                <th
                  rowspan="2"
                  class="sticky top-0 z-20 bg-bg-embedded py-1.5 px-3 font-bold w-44 min-w-40 border-r border-b border-border align-middle"
                >
                  {{ t('patch_guide.table.job') }}
                </th>
                <th
                  :colspan="Math.max(lifeColumnItems.normalPrecrafts.length, 1)"
                  class="sticky top-0 z-10 bg-bg-embedded py-1.5 px-2 font-bold border-r border-b border-border text-center align-middle"
                >
                  {{ t('patch_guide.gear.normal_precraft') }}
                </th>
                <th
                  :colspan="Math.max(lifeColumnItems.aethersands.length, 1)"
                  class="sticky top-0 z-10 bg-bg-embedded py-1.5 px-2 font-bold border-r border-b border-border text-center align-middle"
                >
                  {{ t('patch_guide.gear.aethersand') }}
                </th>
                <th
                  :colspan="Math.max(lifeColumnItems.masterPrecrafts.length, 1)"
                  class="sticky top-0 z-10 bg-bg-embedded py-1.5 px-2 font-bold border-b border-border text-center align-middle"
                >
                  {{ t('patch_guide.gear.master_precraft') }}
                </th>
              </tr>
              <!-- 第二行：各分类下的物品图标 -->
              <tr class="bg-bg-embedded text-app-sm border-b border-border h-9">
                <!-- 普通半成品图标 -->
                <template v-if="lifeColumnItems.normalPrecrafts.length">
                  <th
                    v-for="(item, idx) in lifeColumnItems.normalPrecrafts"
                    :key="`l-np-${item.id}`"
                    class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal min-w-14 border-b border-border align-middle"
                    :class="idx === lifeColumnItems.normalPrecrafts.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <div class="flex items-center justify-center">
                      <ItemSpan :item-info="item" hide-name :img-size="20" />
                    </div>
                  </th>
                </template>
                <th v-else class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal border-r border-b border-border text-sub text-app-xs min-w-14 align-middle">
                  -
                </th>

                <!-- 灵砂图标 -->
                <template v-if="lifeColumnItems.aethersands.length">
                  <th
                    v-for="(item, idx) in lifeColumnItems.aethersands"
                    :key="`l-as-${item.id}`"
                    class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal min-w-14 border-b border-border align-middle"
                    :class="idx === lifeColumnItems.aethersands.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <div class="flex items-center justify-center">
                      <ItemSpan :item-info="item" hide-name :img-size="20" />
                    </div>
                  </th>
                </template>
                <th v-else class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal border-r border-b border-border text-sub text-app-xs min-w-14 align-middle">
                  -
                </th>

                <!-- 秘籍半成品图标 -->
                <template v-if="lifeColumnItems.masterPrecrafts.length">
                  <th
                    v-for="(item, idx) in lifeColumnItems.masterPrecrafts"
                    :key="`l-mp-${item.id}`"
                    class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal min-w-14 border-b border-border align-middle"
                    :class="idx === lifeColumnItems.masterPrecrafts.length - 1 ? '' : 'border-r border-border/40'"
                  >
                    <div class="flex items-center justify-center">
                      <ItemSpan :item-info="item" hide-name :img-size="20" />
                    </div>
                  </th>
                </template>
                <th v-else class="sticky top-9 z-10 bg-bg-embedded py-1 px-1 text-center font-normal border-b border-border text-sub text-app-xs min-w-14 align-middle">
                  -
                </th>
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
                <!-- 普通半成品 -->
                <template v-if="lifeColumnItems.normalPrecrafts.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.normalPrecrafts"
                    :key="`c-np-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === lifeColumnItems.normalPrecrafts.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(crafterData.normalPrecrafts, colItem.id)">
                      {{ findAmount(crafterData.normalPrecrafts, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle border-r border-border text-sub text-app-sm">
                  -
                </td>

                <!-- 灵砂 -->
                <template v-if="lifeColumnItems.aethersands.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.aethersands"
                    :key="`c-as-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === lifeColumnItems.aethersands.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(crafterData.aethersands, colItem.id)">
                      {{ findAmount(crafterData.aethersands, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle border-r border-border text-sub text-app-sm">
                  -
                </td>

                <!-- 秘籍半成品 -->
                <template v-if="lifeColumnItems.masterPrecrafts.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.masterPrecrafts"
                    :key="`c-mp-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === lifeColumnItems.masterPrecrafts.length - 1 ? '' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(crafterData.masterPrecrafts, colItem.id)">
                      {{ findAmount(crafterData.masterPrecrafts, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle text-sub text-app-sm">
                  -
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
                <!-- 普通半成品 -->
                <template v-if="lifeColumnItems.normalPrecrafts.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.normalPrecrafts"
                    :key="`g-np-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === lifeColumnItems.normalPrecrafts.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(gathererData.normalPrecrafts, colItem.id)">
                      {{ findAmount(gathererData.normalPrecrafts, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle border-r border-border text-sub text-app-sm">
                  -
                </td>

                <!-- 灵砂 -->
                <template v-if="lifeColumnItems.aethersands.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.aethersands"
                    :key="`g-as-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === lifeColumnItems.aethersands.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(gathererData.aethersands, colItem.id)">
                      {{ findAmount(gathererData.aethersands, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle border-r border-border text-sub text-app-sm">
                  -
                </td>

                <!-- 秘籍半成品 -->
                <template v-if="lifeColumnItems.masterPrecrafts.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.masterPrecrafts"
                    :key="`g-mp-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm"
                    :class="idx === lifeColumnItems.masterPrecrafts.length - 1 ? '' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(gathererData.masterPrecrafts, colItem.id)">
                      {{ findAmount(gathererData.masterPrecrafts, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle text-sub text-app-sm">
                  -
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
                <!-- 普通半成品 -->
                <template v-if="lifeColumnItems.normalPrecrafts.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.normalPrecrafts"
                    :key="`t-np-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm font-bold"
                    :class="idx === lifeColumnItems.normalPrecrafts.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(lifeTotalData.normalPrecrafts, colItem.id)">
                      {{ findAmount(lifeTotalData.normalPrecrafts, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle border-r border-border text-sub text-app-sm">
                  -
                </td>

                <!-- 灵砂 -->
                <template v-if="lifeColumnItems.aethersands.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.aethersands"
                    :key="`t-as-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm font-bold"
                    :class="idx === lifeColumnItems.aethersands.length - 1 ? 'border-r border-border' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(lifeTotalData.aethersands, colItem.id)">
                      {{ findAmount(lifeTotalData.aethersands, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle border-r border-border text-sub text-app-sm">
                  -
                </td>

                <!-- 秘籍半成品 -->
                <template v-if="lifeColumnItems.masterPrecrafts.length">
                  <td
                    v-for="(colItem, idx) in lifeColumnItems.masterPrecrafts"
                    :key="`t-mp-${colItem.id}`"
                    class="py-2.5 px-1 text-center align-middle text-app-sm font-bold"
                    :class="idx === lifeColumnItems.masterPrecrafts.length - 1 ? '' : 'border-r border-border/40'"
                  >
                    <span v-if="findAmount(lifeTotalData.masterPrecrafts, colItem.id)">
                      {{ findAmount(lifeTotalData.masterPrecrafts, colItem.id) }}
                    </span>
                    <span v-else class="text-sub">-</span>
                  </td>
                </template>
                <td v-else class="py-2.5 px-1 text-center align-middle text-sub text-app-sm">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </n-scrollbar>

        <!-- 2.B 平铺模式表格 -->
        <div v-else class="overflow-x-auto rounded border border-border">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="bg-bg-embedded text-app-sm border-b border-border">
                <th class="py-2.5 px-3 font-bold w-44 min-w-40 border-r border-border">{{ t('patch_guide.table.job') }}</th>
                <th class="py-2.5 px-3 font-bold min-w-30 border-r border-border text-center">{{ t('patch_guide.gear.normal_precraft') }}</th>
                <th class="py-2.5 px-3 font-bold border-r border-border min-w-44 text-center">{{ t('patch_guide.gear.aethersand') }}</th>
                <th class="py-2.5 px-3 font-bold min-w-30 text-center">{{ t('patch_guide.gear.master_precraft') }}</th>
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
                      v-for="(subGroup, sIdx) in chunkArray(crafterData.normalPrecrafts, precraftChunkSize)"
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
                      v-for="(subGroup, sIdx) in chunkArray(crafterData.masterPrecrafts, precraftChunkSize)"
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
                      v-for="(subGroup, sIdx) in chunkArray(gathererData.normalPrecrafts, precraftChunkSize)"
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
                      v-for="(subGroup, sIdx) in chunkArray(gathererData.masterPrecrafts, precraftChunkSize)"
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
                      v-for="(subGroup, sIdx) in chunkArray(lifeTotalData.normalPrecrafts, precraftChunkSize)"
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
                      v-for="(subGroup, sIdx) in chunkArray(lifeTotalData.masterPrecrafts, precraftChunkSize)"
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
      </n-spin>
    </div>
  </FoldableCard>
</template>

<style scoped>
</style>


