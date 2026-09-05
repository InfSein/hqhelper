<script setup lang="ts">
import { computed, ref, watch, nextTick, h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
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

interface CombatTableRow {
  key: number
  jobId: number
  roleKey: XivRoleKey
  role: XivRole
  materials: CategorizedMaterials
}

// 汇总本版本所有可用战斗职业的一整套装备素材
const combatJobsData = computed<CombatTableRow[]>(() => {
  const patchData = HqData.patches[props.patchVer as XivPatchVer]
  if (!patchData?.mainHand) return []

  const list: CombatTableRow[] = []

  battleRoleKeys.forEach(roleKey => {
    const role = XivRoles[roleKey]
    const roleJobs = role?.jobs ?? []
    roleJobs.forEach(jobId => {
      if (patchData.mainHand[jobId] && patchData.mainHand[jobId] > 0) {
        const materials = calcJobGearMaterials(props.patchVer, jobId)
        if (materials) {
          list.push({
            key: jobId,
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

interface LifeTableRow {
  key: string
  type: 'crafter' | 'gatherer' | 'total'
  name: string
  materials: CategorizedMaterials
}

// 生产采集表格行数据
const lifeTableData = computed<LifeTableRow[]>(() => {
  const list: LifeTableRow[] = []
  if (crafterData.value) {
    list.push({
      key: 'crafter',
      type: 'crafter',
      name: t('patch_guide.gear.crafter_total'),
      materials: crafterData.value,
    })
  }
  if (gathererData.value) {
    list.push({
      key: 'gatherer',
      type: 'gatherer',
      name: t('patch_guide.gear.gatherer_total'),
      materials: gathererData.value,
    })
  }
  if (lifeTotalData.value) {
    list.push({
      key: 'total',
      type: 'total',
      name: t('patch_guide.gear.life_total'),
      materials: lifeTotalData.value,
    })
  }
  return list
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

const precraftChunkSize = computed(() => (isMobile.value ? 1 : 3))

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// 渲染平铺模式下的普通半成品与秘籍半成品单元格（移动端1个一行，桌面端最多3个一行）
const renderTilePrecrafts = (items?: ItemInfo[]) => {
  if (!items || !items.length) {
    return h('span', { class: 'text-sub text-app-xs' }, t('common.nothing'))
  }
  const chunks = chunkArray(items, precraftChunkSize.value)
  return h(
    'div',
    { class: 'flex flex-col items-center justify-center gap-1.5 py-1.5' },
    chunks.map((subGroup, sIdx) =>
      h(
        'div',
        { key: sIdx, class: 'flex items-center justify-center gap-3' },
        subGroup.map(item =>
          h(ItemSpan, {
            key: item.id,
            itemInfo: item,
            amount: item.amount,
            showAmount: true,
            imgSize: 18,
          }),
        ),
      ),
    ),
  )
}

// 渲染平铺模式下的灵砂单元格（单列垂直排列）
const renderTileAethersands = (items?: ItemInfo[]) => {
  if (!items || !items.length) {
    return h('span', { class: 'text-sub text-app-xs' }, t('common.nothing'))
  }
  return h(
    'div',
    { class: 'flex flex-col items-center justify-center gap-1.5 py-1.5' },
    items.map(item =>
      h(ItemSpan, {
        key: item.id,
        itemInfo: item,
        amount: item.amount,
        showAmount: true,
        imgSize: 18,
      }),
    ),
  )
}

// 通用辅助函数：生成总览模式下的二级表头子列
const createMaterialSubColumns = <T>(
  keyPrefix: string,
  items: ItemInfo[],
  getMaterials: (row: T) => ItemInfo[] | undefined,
  isBoldRow?: (row: T) => boolean,
) => {
  if (!items.length) {
    return [
      {
        title: '-',
        key: `${keyPrefix}-empty`,
        align: 'center' as const,
        width: 56,
        render: () => h('span', { class: 'text-sub text-app-xs' }, '-'),
      },
    ]
  }
  return items.map(item => ({
    title: () =>
      h('div', { class: 'flex items-center justify-center py-1' }, [
        h(ItemSpan, { itemInfo: item, hideName: true, imgSize: 20 }),
      ]),
    key: `${keyPrefix}-${item.id}`,
    align: 'center' as const,
    width: 56,
    render(row: T) {
      const amount = findAmount(getMaterials(row), item.id)
      if (amount) {
        const bold = isBoldRow ? isBoldRow(row) : false
        return h(
          'span',
          { class: bold ? 'font-bold text-app-sm' : 'text-app-sm' },
          amount,
        )
      }
      return h('span', { class: 'text-sub text-app-xs' }, '-')
    },
  }))
}

// 1. 战斗职业总览模式列定义
const combatOverviewColumns = computed<DataTableColumns<CombatTableRow>>(() => [
  {
    title: t('patch_guide.table.job'),
    key: 'job',
    fixed: 'left',
    width: isMobile.value ? 140 : 160,
    render(row) {
      return h('div', { class: 'flex items-center gap-2' }, [
        XivJobs[row.jobId]
          ? h(XivFARImage, {
              size: 32,
              src: XivJobs[row.jobId].job_icon_url,
            })
          : null,
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-bold text-app-sm' }, getJobName(row.jobId)),
          h(
            'span',
            {
              class: 'text-app-2xs font-medium',
              style: { color: row.role?.role_color },
            },
            getRoleName(row.role),
          ),
        ]),
      ])
    },
  },
  {
    title: t('patch_guide.gear.normal_precraft'),
    key: 'combatNormalPrecraftsGroup',
    align: 'center',
    children: createMaterialSubColumns<CombatTableRow>(
      'c-np',
      combatColumnItems.value.normalPrecrafts,
      row => row.materials.normalPrecrafts,
    ),
  },
  {
    title: t('patch_guide.gear.aethersand'),
    key: 'combatAethersandsGroup',
    align: 'center',
    children: createMaterialSubColumns<CombatTableRow>(
      'c-as',
      combatColumnItems.value.aethersands,
      row => row.materials.aethersands,
    ),
  },
  {
    title: t('patch_guide.gear.master_precraft'),
    key: 'combatMasterPrecraftsGroup',
    align: 'center',
    children: createMaterialSubColumns<CombatTableRow>(
      'c-mp',
      combatColumnItems.value.masterPrecrafts,
      row => row.materials.masterPrecrafts,
    ),
  },
])

// 战斗职业总览模式横向宽度
const combatOverviewScrollX = computed(() => {
  const c = combatColumnItems.value
  const subColCount =
    Math.max(c.normalPrecrafts.length, 1) +
    Math.max(c.aethersands.length, 1) +
    Math.max(c.masterPrecrafts.length, 1)
  return (isMobile.value ? 140 : 160) + subColCount * 56
})

// 2. 战斗职业平铺模式列定义
const combatTileColumns = computed<DataTableColumns<CombatTableRow>>(() => [
  {
    title: t('patch_guide.table.job'),
    key: 'job',
    fixed: isMobile.value ? 'left' : undefined,
    width: isMobile.value ? 130 : 160,
    render(row) {
      return h('div', { class: 'flex items-center gap-2' }, [
        XivJobs[row.jobId]
          ? h(XivFARImage, {
              size: 32,
              src: XivJobs[row.jobId].job_icon_url,
            })
          : null,
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-bold text-app-sm' }, getJobName(row.jobId)),
          h(
            'span',
            {
              class: 'text-app-2xs font-medium',
              style: { color: row.role?.role_color },
            },
            getRoleName(row.role),
          ),
        ]),
      ])
    },
  },
  {
    title: t('patch_guide.gear.normal_precraft'),
    key: 'normalPrecrafts',
    align: 'center',
    minWidth: 160,
    render: row => renderTilePrecrafts(row.materials.normalPrecrafts),
  },
  {
    title: t('patch_guide.gear.aethersand'),
    key: 'aethersands',
    align: 'center',
    width: isMobile.value ? 140 : 160,
    render: row => renderTileAethersands(row.materials.aethersands),
  },
  {
    title: t('patch_guide.gear.master_precraft'),
    key: 'masterPrecrafts',
    align: 'center',
    minWidth: 160,
    render: row => renderTilePrecrafts(row.materials.masterPrecrafts),
  },
])

// 3. 生产采集总览模式列定义
const lifeOverviewColumns = computed<DataTableColumns<LifeTableRow>>(() => [
  {
    title: t('patch_guide.table.job'),
    key: 'job',
    fixed: 'left',
    width: isMobile.value ? 140 : 160,
    render(row) {
      return h('span', { class: 'font-bold text-app-sm' }, row.name)
    },
  },
  {
    title: t('patch_guide.gear.normal_precraft'),
    key: 'lifeNormalPrecraftsGroup',
    align: 'center',
    children: createMaterialSubColumns<LifeTableRow>(
      'l-np',
      lifeColumnItems.value.normalPrecrafts,
      row => row.materials?.normalPrecrafts,
      row => row.type === 'total',
    ),
  },
  {
    title: t('patch_guide.gear.aethersand'),
    key: 'lifeAethersandsGroup',
    align: 'center',
    children: createMaterialSubColumns<LifeTableRow>(
      'l-as',
      lifeColumnItems.value.aethersands,
      row => row.materials?.aethersands,
      row => row.type === 'total',
    ),
  },
  {
    title: t('patch_guide.gear.master_precraft'),
    key: 'lifeMasterPrecraftsGroup',
    align: 'center',
    children: createMaterialSubColumns<LifeTableRow>(
      'l-mp',
      lifeColumnItems.value.masterPrecrafts,
      row => row.materials?.masterPrecrafts,
      row => row.type === 'total',
    ),
  },
])

// 生产采集总览模式横向宽度
const lifeOverviewScrollX = computed(() => {
  const l = lifeColumnItems.value
  const subColCount =
    Math.max(l.normalPrecrafts.length, 1) +
    Math.max(l.aethersands.length, 1) +
    Math.max(l.masterPrecrafts.length, 1)
  return (isMobile.value ? 140 : 160) + subColCount * 56
})

// 4. 生产采集平铺模式列定义
const lifeTileColumns = computed<DataTableColumns<LifeTableRow>>(() => [
  {
    title: t('patch_guide.table.job'),
    key: 'job',
    fixed: isMobile.value ? 'left' : undefined,
    width: isMobile.value ? 130 : 160,
    render(row) {
      return h('span', { class: 'font-bold text-app-sm' }, row.name)
    },
  },
  {
    title: t('patch_guide.gear.normal_precraft'),
    key: 'normalPrecrafts',
    align: 'center',
    minWidth: 160,
    render: row => renderTilePrecrafts(row.materials?.normalPrecrafts),
  },
  {
    title: t('patch_guide.gear.aethersand'),
    key: 'aethersands',
    align: 'center',
    width: isMobile.value ? 140 : 160,
    render: row => renderTileAethersands(row.materials?.aethersands),
  },
  {
    title: t('patch_guide.gear.master_precraft'),
    key: 'masterPrecrafts',
    align: 'center',
    minWidth: 160,
    render: row => renderTilePrecrafts(row.materials?.masterPrecrafts),
  },
])

// 生产采集职业行样式（突出汇总行）
const lifeRowClassName = (row: LifeTableRow) => {
  if (row.type === 'total') {
    return 'life-total-row'
  }
  return ''
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
      :description="t('common.nothing')"
      class="my-4"
    />

    <div v-else class="flex flex-col gap-4">
      <!-- 模式切换控制器 -->
      <div class="md:ml-6 flex items-center gap-2">
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
            <n-data-table
              v-if="isOverviewMode"
              bordered
              :single-line="false"
              size="small"
              :columns="combatOverviewColumns"
              :data="combatJobsData"
              :scroll-x="combatOverviewScrollX"
              :max-height="600"
            />

            <!-- 1.B 平铺模式表格 -->
            <n-data-table
              v-else
              bordered
              :single-line="false"
              size="small"
              :columns="combatTileColumns"
              :data="combatJobsData"
              :scroll-x="isMobile ? 700 : undefined"
              :max-height="645"
            />
          </div>

          <!-- 2. 生产采集职业装备表格 -->
          <div v-if="lifeTotalData" class="flex flex-col gap-2">
            <!-- 当同时有战斗职业装备时显示区分标题 -->
            <div v-if="combatJobsData.length" class="flex items-center gap-1.5 font-bold text-app-sm text-sub">
              <n-icon :component="HandymanOutlined" />
              <span>{{ t('patch_guide.gear.life_gears') }}</span>
            </div>

            <!-- 2.A 总览模式表格 -->
            <n-data-table
              v-if="isOverviewMode"
              bordered
              :single-line="false"
              size="small"
              :columns="lifeOverviewColumns"
              :data="lifeTableData"
              :scroll-x="lifeOverviewScrollX"
              :row-class-name="lifeRowClassName"
            />

            <!-- 2.B 平铺模式表格 -->
            <n-data-table
              v-else
              bordered
              :single-line="false"
              size="small"
              :columns="lifeTileColumns"
              :data="lifeTableData"
              :scroll-x="isMobile ? 700 : undefined"
              :row-class-name="lifeRowClassName"
            />
          </div>
        </div>
      </n-spin>
    </div>
  </FoldableCard>
</template>

<style scoped>
:deep(.life-total-row td) {
  background-color: var(--app-color-bg-embedded) !important;
  font-weight: bold;
}
</style>
