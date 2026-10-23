<script setup lang="ts">
import { computed, ref, watch, h, nextTick } from 'vue'
import {
  CloseRound,
  DeleteSweepRound,
  HistoryRound,
  InfoOutlined,
  JoinLeftOutlined,
  PlaylistAddOutlined,
  SearchRound,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  SettingsRound,
  StarRound,
  StarBorderRound,
} from '@vicons/material'
import type { ScrollbarInst, SelectOption } from 'naive-ui'
import ItemCell from '@/components/item/ItemCell.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import NotebookRecipeDetail from './NotebookRecipeDetail.vue'
import useConfig from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { useAppModals } from '@/composables/useAppModals'
import { useItemContextMenu } from '@/composables/useItemContextMenu'
import { useDialog } from '@/composables/useDialog'
import { useStore } from '@/store'
import CommonGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-common.svg'
import MasterGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-master.svg'
import SpecialGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-special.svg'
import { XivJobs, XivRecipeCustomLists, XivSrbMap, XivUnpackedRecipes, XivUnpackedItems } from '@/assets/data'
import { sortRecord } from '@/tools'
import { getItemInfo, sortItems, getItemNameRevertMap } from '@/tools/item'
import type { ItemInfo } from '@/types/item'
import { decodeShareCode } from '@/tools/shareCode'

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()
const { itemLanguage } = useConfig()
const { alertInfo } = useDialog()
const NAIVE_UI_MESSAGE = useMessage()

const props = defineProps<{
  selectedJob: number
  selectedMenu: 'common' | 'special' | 'master'
  selectedContentGroup: `i_${number}`
  selectedItem: number
  notebookSearchHistory?: string[]
  menuHeight: string
}>()

const emit = defineEmits<{
  'update:selectedJob': [value: number]
  'update:selectedMenu': [value: 'common' | 'special' | 'master']
  'update:selectedContentGroup': [value: `i_${number}`]
  'update:selectedItem': [value: number]
  'update:notebookSearchHistory': [value: string[]]
  'add-item': [itemId: number]
}>()

const itemListScrollbarRef = ref<ScrollbarInst | null>(null)
const itemListContainerRef = ref<HTMLElement | null>(null)
const scrollToTop = () => {
  nextTick(() => {
    itemListScrollbarRef.value?.scrollTo({ top: 0 })
  })
}

// #region notebook data structure
interface NotebookGroup {
  job: number
  menus: {
    /** 分级配方 */
    common: Record<`i_${number}`, NotebookMenu>
    /** 特殊配方 */
    special: Record<`i_${number}`, NotebookMenu>
    /** 秘籍配方 */
    master: Record<`i_${number}`, NotebookMenu>
  }
}
interface NotebookMenu {
  id: number
  name: string
  contentGroups: Record<number, {
    id: number
    name?: string
    items: ItemInfo[]
  }>
}

/** 特殊配方分类 ID 枚举 */
enum SpecialNotebookId {
  /** 房屋：内外装潢 */
  furn_inout = 1,
  /** 房屋：庭具 */
  furn_outdoor = 2,
  /** 房屋：家具 */
  furn_furnishing = 3,
  /** 房屋：桌台&地毯 */
  furn_tableOrFloor = 4,
  /** 房屋：桌上 */
  furn_tableTop = 5,
  /** 房屋：壁挂 */
  furn_wall = 6,

  /** 收藏品交易 */
  collectables = 10,

  /** 职业任务：珠串万货街交易 */
  jobQuest_wachumeqimeqi = 20,
  /** 职业任务：魔法大学交易 */
  jobQuest_studium = 21,
  /** 职业任务：中庸工艺馆交易 */
  jobQuest_crystarium = 22,

  /** 支线任务：天钢工具 */
  sideQuest_skysteel = 30,
  /** 支线任务：莫雯卓越工具 */
  sideQuest_splendorous = 31,
  /** 支线任务：重建伊修加德 */
  sideQuest_ishgardRestoration = 32,
  /** 支线任务：其他 */
  sideQuest_other = 33,

  /** 其他（染剂、头花） */
  other = 99,
}

/** 特殊配方一级分类定义接口 */
interface SpecialGroupDef {
  groupKey: string
  labelKey: string
  snidRange?: SpecialNotebookId[]
  match?: (id: number) => boolean
  sortChildren?: (a: SpecialMenuTreeNode['children'][number], b: SpecialMenuTreeNode['children'][number]) => number
}

interface SpecialMenuTreeNode {
  groupKey: string
  groupLabel: string
  children: {
    menuId: `i_${number}`
    menu: NotebookMenu
    subLabel: string
  }[]
}

/** 特殊配方一级分类定义 */
const specialGroupDefs: SpecialGroupDef[] = [
  {
    groupKey: 'furnishing',
    labelKey: 'recipe.notebookgroup.group_furnishing',
    snidRange: [
      SpecialNotebookId.furn_inout,
      SpecialNotebookId.furn_outdoor,
      SpecialNotebookId.furn_furnishing,
      SpecialNotebookId.furn_tableOrFloor,
      SpecialNotebookId.furn_tableTop,
      SpecialNotebookId.furn_wall,
    ],
  },
  {
    groupKey: 'collectables',
    labelKey: 'recipe.notebookgroup.collectable',
    match: (id: number) => (id >= 1050 && id < 2000) || id === SpecialNotebookId.collectables,
    sortChildren: (a, b) => b.menu.id - a.menu.id, // 按制作等级从高到低排序 (91-100, 81-90, 71-80, 61-70, 50-60，预留 101-110 等)
  },
  {
    groupKey: 'jobQuest',
    labelKey: 'recipe.notebookgroup.group_jobQuest',
    snidRange: [
      SpecialNotebookId.jobQuest_wachumeqimeqi,
      SpecialNotebookId.jobQuest_studium,
      SpecialNotebookId.jobQuest_crystarium,
    ],
  },
  {
    groupKey: 'sideQuest',
    labelKey: 'recipe.notebookgroup.group_sideQuest',
    snidRange: [
      SpecialNotebookId.sideQuest_skysteel,
      SpecialNotebookId.sideQuest_splendorous,
      SpecialNotebookId.sideQuest_ishgardRestoration,
      SpecialNotebookId.sideQuest_other,
    ],
  },
  {
    groupKey: 'other',
    labelKey: 'recipe.notebookgroup.other',
    snidRange: [SpecialNotebookId.other],
  },
]

/**
 * 获取收藏品配方的等级区间
 * @param clv 配方制作等级
 * @returns minLv, maxLv, name ('91-100', '50-60' 等)
 */
const getCollectableLevelRange = (clv: number) => {
  const maxLv = Math.max(60, Math.ceil(clv / 10) * 10)
  const minLv = maxLv === 60 ? 50 : maxLv - 9
  return {
    minLv,
    maxLv,
    name: `${minLv}-${maxLv}`,
  }
}

const notebookGroups = computed(() => {
  const groups: Record<number, NotebookGroup> = {}
  Object.values(XivUnpackedRecipes).forEach(recipe => {
    const item = getItemInfo(recipe.target)
    if (!recipe.job && recipe.job !== 0) return
    const job = recipe.job + 8

    groups[job] ??= {
      job,
      menus: {
        common: {},
        special: {},
        master: {}
      }
    }
    const group = groups[job]

    const snid = SpecialNotebookId

    // * 秘籍
    if (recipe.srb) {
      const srbInfo = XivSrbMap[recipe.srb]
      const menu = group.menus.master
      const srb = recipe.srb
      const srbItem = getItemInfo(srb)
      if (srbInfo) {
        const id = srbInfo.id
        menu[`i_${id}`] ??= { id, name: srbInfo[`name_${itemLanguage.value}`], contentGroups: {} }
        menu[`i_${id}`].contentGroups[0] ??= { id: 0, name: srbItem[`name_${itemLanguage.value}`], items: [] }
        menu[`i_${id}`].contentGroups[0].items.push(item)
      } else {
        const id = 0
        menu[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.other_master_recipes'), contentGroups: {} }
        menu[`i_${id}`].contentGroups[srb] ??= { id: srb, name: srbItem[`name_${itemLanguage.value}`], items: [] }
        menu[`i_${id}`].contentGroups[srb].items.push(item)
      }
    }

    // * 特殊
    else if (item.isFurnishing) {
      switch (item.uiTypeId) {
        default: {
          const id = snid.furn_inout
          group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.furn_inout'), contentGroups: {} }
          group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
          group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
          break
        }
        case /*庭具*/76: {
          const id = snid.furn_outdoor
          group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.furn_outdoor'), contentGroups: {} }
          group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
          group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
          break
        }
        case /*家具*/57: {
          const id = snid.furn_furnishing
          group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.furn_furnishing'), contentGroups: {} }
          group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
          group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
          break
        }
        case /*桌台*/77:
        case /*地毯*/80: {
          const id = snid.furn_tableOrFloor
          group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.furn_tableOrFloor'), contentGroups: {} }
          group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
          group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
          break
        }
        case /*桌上*/78: {
          const id = snid.furn_tableTop
          group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.furn_tableTop'), contentGroups: {} }
          group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
          group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
          break
        }
        case /*壁挂*/79: {
          const id = snid.furn_wall
          group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.furn_wall'), contentGroups: {} }
          group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
          group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
          break
        }
      }
    } else if (item.id >= 43887 && item.id <= 43898) {
      const id = snid.jobQuest_wachumeqimeqi
      group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.jobQuest_wachumeqimeqi'), contentGroups: {} }
      group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
    } else if (item.id >= 35588 && item.id <= 35599) {
      const id = snid.jobQuest_studium
      group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.jobQuest_studium'), contentGroups: {} }
      group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
    } else if (item.id >= 27232 && item.id <= 27251) {
      const id = snid.jobQuest_crystarium
      group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.jobQuest_crystarium'), contentGroups: {} }
      group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
    } else if (
      (item.id >= 29645 && item.id <= 29660)
      || (item.id >= 31101 && item.id <= 31116)
      || (item.id >= 31750 && item.id <= 31757)
    ) {
      const id = snid.sideQuest_skysteel
      group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.sideQuest_skysteel'), contentGroups: {} }
      group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
    } else if (item.collectable) {
      if (item.collectInfo || item.name_zh.startsWith('收藏用')) {
        const { name, maxLv } = getCollectableLevelRange(recipe.clv)
        const id = 1000 + maxLv
        group.menus.special[`i_${id}`] ??= {
          id,
          name: `${t('recipe.notebookgroup.collectable')}：${name}`,
          contentGroups: {},
        }
        group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
        group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
      } else if (item.name_zh.includes('重建用')) {
        const id = snid.sideQuest_ishgardRestoration
        group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.sideQuest_ishgardRestoration'), contentGroups: {} }
        group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
        group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
      } /*else if (item.name_zh.includes('改良用')) {
        const id = snid.sideQuest_skysteel
        group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.skysteel'), contentGroups: {} }
        group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
        group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
      } */else if (item.name_zh.startsWith('面向收藏家的')) {
        const id = snid.sideQuest_splendorous
        group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.splendorous'), contentGroups: {} }
        group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
        group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
      } else {
        const id = snid.other // 未归类收藏品，版本更新时需要处理
        group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.collectable_other'), contentGroups: {} }
        group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
        group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
      }
    } else if (
      item.name_zh.endsWith('（复制品）') && (
        item.name_zh.includes('空贼') || item.name_zh.includes('空鼠')
      )
    ) {
      const id = snid.sideQuest_other
      group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.sideQuest_other'), contentGroups: {} }
      group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
    } else if (
      item.uiTypeId === /*染剂*/55
      || item.name_zh.endsWith('头花')
      || (item.id >= 21926 && item.id <= 21934) // 郁金香腕带
      || (item.id >= 38560 && item.id <= 38568) // 香豌豆花项链
      || (item.id >= 47941 && item.id <= 47949) // 叶子花耳环
      || (item.id >= 47212 && item.id <= 47222) // 大季花花环
      || (item.id >= 51199 && item.id <= 51207) // 矢车菊手链
    ) {
      const id = snid.other
      group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.other'), contentGroups: {} }
      group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
    }

    // * 普通（分级）
    else {
      const minLv = Math.floor(recipe.clv / 5) * 5 + (recipe.clv % 5 === 0 ? -4 : 1)
      const maxLv = minLv + 4
      const id = minLv
      group.menus.common[`i_${id}`] ??= { id, name: `${minLv}-${maxLv}`, contentGroups: {} }
      group.menus.common[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.common[`i_${id}`].contentGroups[0].items.push(item)
    }
  })
  Object.values(groups).forEach(group => {
    // * 对菜单项进行排序
    group.menus.common = sortRecord(group.menus.common, true)
    group.menus.special = sortRecord(group.menus.special)
    group.menus.master = sortRecord(group.menus.master, true)
    // * 对菜单中的物品进行排序
    const sortBy = store.userConfig.notebook_item_sortby || 'recipeOrder'
    Object.values(group.menus.common).forEach(menu => {
      Object.values(menu.contentGroups).forEach(contentGroup => {
        sortItems(contentGroup.items, sortBy)
      })
    })
    Object.values(group.menus.special).forEach(menu => {
      Object.values(menu.contentGroups).forEach(contentGroup => {
        sortItems(contentGroup.items, sortBy)
      })
    })
    Object.values(group.menus.master).forEach(menu => {
      Object.values(menu.contentGroups).forEach(contentGroup => {
        sortItems(contentGroup.items, sortBy)
      })
    })
  })
  return groups
})

const currGroup = computed(() => notebookGroups.value[props.selectedJob])
const currMenus = computed(() => currGroup.value?.menus?.[props.selectedMenu] ?? {})

const specialMenuTree = computed<SpecialMenuTreeNode[]>(() => {
  const menus = currMenus.value
  if (props.selectedMenu !== 'special') return []

  const tree: SpecialMenuTreeNode[] = []
  const usedKeys = new Set<string>()

  for (const def of specialGroupDefs) {
    const children: SpecialMenuTreeNode['children'] = []
    if (def.snidRange) {
      for (const id of def.snidRange) {
        const key = `i_${id}` as `i_${number}`
        const menu = menus[key]
        if (!menu) continue
        usedKeys.add(key)
        const subLabel = menu.name.replace(/^.+?[：:]\s*/, '') || menu.name
        children.push({
          menuId: key,
          menu,
          subLabel,
        })
      }
    } else if (def.match) {
      for (const [key, menu] of Object.entries(menus)) {
        if (def.match(menu.id)) {
          usedKeys.add(key)
          const subLabel = menu.name.replace(/^.+?[：:]\s*/, '') || menu.name
          children.push({
            menuId: key as `i_${number}`,
            menu,
            subLabel,
          })
        }
      }
    }
    if (def.sortChildren) {
      children.sort(def.sortChildren)
    }
    if (children.length > 0) {
      tree.push({
        groupKey: def.groupKey,
        groupLabel: t(def.labelKey),
        children,
      })
    }
  }

  // 兜底：处理未匹配到任何预定义分组的特殊菜单项
  for (const [key, menu] of Object.entries(menus)) {
    if (!usedKeys.has(key)) {
      tree.push({
        groupKey: key,
        groupLabel: menu.name,
        children: [{
          menuId: key as `i_${number}`,
          menu,
          subLabel: menu.name,
        }],
      })
    }
  }

  return tree
})
const currContentGroups = computed(() => currMenus.value?.[props.selectedContentGroup]?.contentGroups ?? {})
const currSelectedItem = computed(() => {
  const itemId = props.selectedItem
  if (!itemId) return null
  return getItemInfo(itemId)
})

const skipMenuSwitchEffect = ref(false)
const onNotebookMenuSwitched = () => {
  if (skipMenuSwitchEffect.value) {
    skipMenuSwitchEffect.value = false
    return
  }
  const keys = Object.keys(currMenus.value) as `i_${number}`[]
  if (!keys.length) return
  const firstKey = keys[0]
  emit('update:selectedContentGroup', firstKey)
}
watch(() => props.selectedMenu, onNotebookMenuSwitched)

const showMobileRecipeDrawer = ref(false)
const handleItemClick = (itemId: number) => {
  emit('update:selectedItem', itemId)
  // 移动端点击配方项（非长按呼出右键菜单时）打开底部详情抽屉
  if (isMobile.value && !notebookDropdownShow.value) {
    showMobileRecipeDrawer.value = true
  }
}
// #endregion

// #region notebook search
interface SearchGroupResult {
  groupKey: string
  groupLabel: string
  items: ItemInfo[]
}

const searchKeyword = ref('')
const isSearchMode = ref(false)
const searchResults = ref<SearchGroupResult[]>([])
const showHistoryDrawer = ref(false)

watch(isSearchMode, (val) => {
  if (!val) {
    searchKeyword.value = ''
  }
})

const matchItem = (item: ItemInfo, pattern: string) => {
  const p = pattern.trim().toLowerCase()
  if (!p) return false
  const availableKeywords = [item.name_zh, item.name_en, item.name_ja]
  for (const keyword of availableKeywords) {
    if (keyword?.toLowerCase().includes(p)) {
      return true
    }
  }
  if (item.id.toString() === p) return true
  if (item.itemLevel.toString() === p) return true
  if (item.patch === p) return true
  return false
}

/**
 * 尝试将版本字符串解析为数字
 * 版本号如 7.0、7.05、7.1 等可以解析为标准浮点数
 * 若存在意外值（如包含非数字字符 "7.0a"），尝试提取有效数字前缀；若完全没有数字则返回 null
 */
const parsePatchNumber = (val: string): number | null => {
  if (!val) return null
  const trimmed = val.trim()
  const num = Number(trimmed)
  if (!isNaN(num) && isFinite(num)) {
    return num
  }
  const match = trimmed.match(/^(\d+(?:\.\d+)?)/)
  if (match) {
    const floatNum = parseFloat(match[1])
    if (!isNaN(floatNum) && isFinite(floatNum)) {
      return floatNum
    }
  }
  return null
}

/**
 * 根据搜索关键字构建物品匹配函数
 * 支持普通搜索与高级指令：@版本、@ID、@IL
 */
const getItemMatcher = (trimmed: string): ((item: ItemInfo) => boolean) | null => {
  // 1. 版本匹配指令：@版本: / @Patch: / @パッチ:
  const patchPrefixMatch = trimmed.match(/^@(?:版本|Patch|パッチ)(?:[:：]\s*(.*))?$/i)
  if (patchPrefixMatch) {
    const rawVal = patchPrefixMatch[1]?.trim()
    if (!rawVal) {
      NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
      return null
    }
    const rangeParts = rawVal.split(/[~～]/)
    if (rangeParts.length === 2) {
      const startStr = rangeParts[0].trim()
      const endStr = rangeParts[1].trim()
      if (!startStr || !endStr) {
        NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
        return null
      }
      const startNum = parsePatchNumber(startStr)
      const endNum = parsePatchNumber(endStr)
      if (startNum !== null && endNum !== null) {
        const min = Math.min(startNum, endNum)
        const max = Math.max(startNum, endNum)
        return (item: ItemInfo) => {
          const itemNum = parsePatchNumber(item.patch)
          if (itemNum !== null) {
            return itemNum >= min && itemNum <= max
          }
          // 兜底：若物品版本非标准数字，使用字典序比较
          const pStr = (item.patch ?? '').trim()
          const [minStr, maxStr] = startStr.localeCompare(endStr) <= 0 ? [startStr, endStr] : [endStr, startStr]
          return pStr.localeCompare(minStr) >= 0 && pStr.localeCompare(maxStr) <= 0
        }
      }
      // 兜底：若输入范围包含非标准数字
      const [minStr, maxStr] = startStr.localeCompare(endStr) <= 0 ? [startStr, endStr] : [endStr, startStr]
      return (item: ItemInfo) => {
        const pStr = (item.patch ?? '').trim()
        return pStr.localeCompare(minStr) >= 0 && pStr.localeCompare(maxStr) <= 0
      }
    } else if (rangeParts.length === 1) {
      const targetStr = rawVal.toLowerCase()
      const targetNum = parsePatchNumber(rawVal)
      return (item: ItemInfo) => {
        const pStr = (item.patch ?? '').trim().toLowerCase()
        if (pStr === targetStr) return true
        if (targetNum !== null) {
          const itemNum = parsePatchNumber(item.patch)
          if (itemNum !== null && itemNum === targetNum) return true
        }
        return false
      }
    } else {
      NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
      return null
    }
  }

  // 2. ID 匹配指令：@ID: / @id:
  const idPrefixMatch = trimmed.match(/^@ID(?:[:：]\s*(.*))?$/i)
  if (idPrefixMatch) {
    const rawVal = idPrefixMatch[1]?.trim()
    if (!rawVal) {
      NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
      return null
    }
    const rangeParts = rawVal.split(/[~～]/)
    if (rangeParts.length === 2) {
      const s = parseInt(rangeParts[0].trim(), 10)
      const e = parseInt(rangeParts[1].trim(), 10)
      if (isNaN(s) || isNaN(e)) {
        NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
        return null
      }
      const min = Math.min(s, e)
      const max = Math.max(s, e)
      return (item: ItemInfo) => item.id >= min && item.id <= max
    } else if (rangeParts.length === 1) {
      const targetId = parseInt(rawVal, 10)
      if (isNaN(targetId)) {
        NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
        return null
      }
      return (item: ItemInfo) => item.id === targetId
    } else {
      NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
      return null
    }
  }

  // 3. 品级匹配指令：@IL: / @ILv: / @品级:
  const ilPrefixMatch = trimmed.match(/^@(?:IL|ILv|品级)(?:[:：]\s*(.*))?$/i)
  if (ilPrefixMatch) {
    const rawVal = ilPrefixMatch[1]?.trim()
    if (!rawVal) {
      NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
      return null
    }
    const rangeParts = rawVal.split(/[~～]/)
    if (rangeParts.length === 2) {
      const s = parseInt(rangeParts[0].trim(), 10)
      const e = parseInt(rangeParts[1].trim(), 10)
      if (isNaN(s) || isNaN(e)) {
        NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
        return null
      }
      const min = Math.min(s, e)
      const max = Math.max(s, e)
      return (item: ItemInfo) => item.itemLevel >= min && item.itemLevel <= max
    } else if (rangeParts.length === 1) {
      const targetIL = parseInt(rawVal, 10)
      if (isNaN(targetIL)) {
        NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
        return null
      }
      return (item: ItemInfo) => item.itemLevel === targetIL
    } else {
      NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_invalid_format'))
      return null
    }
  }

  // 4. 普通搜索
  return (item: ItemInfo) => matchItem(item, trimmed)
}

const handleSearch = (keyword?: string) => {
  const targetKeyword = typeof keyword === 'string' ? keyword : searchKeyword.value
  searchKeyword.value = targetKeyword
  if (!targetKeyword || !targetKeyword.trim()) {
    NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_empty'))
    return
  }
  const trimmed = targetKeyword.trim()

  // 检查是否为素材反查前缀
  const materialPrefixMatch = trimmed.match(/^@(?:素材|Material)[:：]\s*(.+)$/i)
  if (materialPrefixMatch) {
    const rawMaterialName = materialPrefixMatch[1].trim()
    const revertMap = getItemNameRevertMap()
    let itemId = revertMap.get(rawMaterialName)
    if (!itemId && !isNaN(Number(rawMaterialName))) {
      itemId = Number(rawMaterialName)
    }
    if (!itemId) {
      for (const item of Object.values(XivUnpackedItems)) {
        if (
          item.name[0] === rawMaterialName ||
          item.name[1] === rawMaterialName ||
          item.name[2] === rawMaterialName ||
          item.name[0].toLowerCase() === rawMaterialName.toLowerCase() ||
          item.name[1].toLowerCase() === rawMaterialName.toLowerCase() ||
          item.name[2].toLowerCase() === rawMaterialName.toLowerCase()
        ) {
          itemId = item.id
          break
        }
      }
    }
    if (itemId) {
      searchByMaterial(itemId)
      return
    }
  }

  const matcher = getItemMatcher(trimmed)
  if (!matcher) {
    return
  }

  const results: SearchGroupResult[] = []
  const menuTypes: ('common' | 'special' | 'master')[] = ['common', 'special', 'master']

  Object.values(notebookGroups.value).forEach(group => {
    const job = group.job
    const jobName = XivJobs[job]?.[`job_name_${itemLanguage.value}`] || XivJobs[job]?.job_name_zh || ''

    menuTypes.forEach(menuType => {
      const menus = group.menus[menuType]
      Object.values(menus).forEach(menu => {
        Object.values(menu.contentGroups).forEach(cg => {
          const matched = cg.items.filter(item => matcher(item))
          if (matched.length > 0) {
            const groupLabel = cg.name && cg.name !== menu.name
              ? `${jobName} / ${menu.name} / ${cg.name}`
              : `${jobName} / ${menu.name}`
            results.push({
              groupKey: `${job}_${menuType}_${menu.id}_${cg.id}`,
              groupLabel,
              items: matched,
            })
          }
        })
      })
    })
  })

  const totalCount = results.reduce((sum, g) => sum + g.items.length, 0)

  if (totalCount === 0) {
    NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_no_result'))
    return
  }

  if (totalCount > 1000) {
    NAIVE_UI_MESSAGE.warning(t('workflow.notebook_search.error_too_many_results', { count: totalCount }))
    return
  }

  searchResults.value = results
  isSearchMode.value = true
  isCustomListMode.value = false
  isStarredMode.value = false

  NAIVE_UI_MESSAGE.success(t('workflow.notebook_search.success_count', { count: totalCount }))
  scrollToTop()

  // 记录搜索历史 (最多10条，去重且最新排在最前)
  const currentHistory = props.notebookSearchHistory ?? []
  const newHistory = [trimmed, ...currentHistory.filter(h => h !== trimmed)].slice(0, 10)
  emit('update:notebookSearchHistory', newHistory)
}

const searchByMaterial = (itemOrId: ItemInfo | number) => {
  const itemInfo = typeof itemOrId === 'number' ? getItemInfo(itemOrId) : itemOrId
  if (!itemInfo?.id) {
    NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_empty'))
    return
  }
  if (itemInfo.id < 100) {
    NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_material_id_too_small'))
    return
  }

  const targetItemId = itemInfo.id
  const itemName = itemInfo[`name_${itemLanguage.value}`] || itemInfo.name_zh
  const prefix = t('workflow.notebook_search.material_history_prefix')
  const historyLabel = `@${prefix}:${itemName}`

  const results: SearchGroupResult[] = []
  const menuTypes: ('common' | 'special' | 'master')[] = ['common', 'special', 'master']

  Object.values(notebookGroups.value).forEach(group => {
    const job = group.job
    const jobName = XivJobs[job]?.[`job_name_${itemLanguage.value}`] || XivJobs[job]?.job_name_zh || ''

    menuTypes.forEach(menuType => {
      const menus = group.menus[menuType]
      Object.values(menus).forEach(menu => {
        Object.values(menu.contentGroups).forEach(cg => {
          const matched = cg.items.filter(item => {
            const matchMaterial = item.craftRequires?.some(req => req.id === targetItemId)
            const matchCrystal = item.craftRequireCrystals?.some(req => req.id === targetItemId)
            return matchMaterial || matchCrystal
          })
          if (matched.length > 0) {
            const groupLabel = cg.name && cg.name !== menu.name
              ? `${jobName} / ${menu.name} / ${cg.name}`
              : `${jobName} / ${menu.name}`
            results.push({
              groupKey: `${job}_${menuType}_${menu.id}_${cg.id}`,
              groupLabel,
              items: matched,
            })
          }
        })
      })
    })
  })

  const totalCount = results.reduce((sum, g) => sum + g.items.length, 0)

  if (totalCount === 0) {
    NAIVE_UI_MESSAGE.error(t('item.text.reverse_recipe_lookup_no_result'))
    return
  }

  if (totalCount > 1000) {
    NAIVE_UI_MESSAGE.warning(t('workflow.notebook_search.error_too_many_results', { count: totalCount }))
    return
  }

  searchKeyword.value = historyLabel
  searchResults.value = results
  isSearchMode.value = true
  isCustomListMode.value = false
  isStarredMode.value = false
  showMobileRecipeDrawer.value = false

  NAIVE_UI_MESSAGE.success(t('workflow.notebook_search.success_count', { count: totalCount }))
  scrollToTop()

  if (results[0]?.items?.[0]?.id) {
    emit('update:selectedItem', results[0].items[0].id)
  }

  // 记录搜索历史 (最多10条，去重且最新排在最前)
  const currentHistory = props.notebookSearchHistory ?? []
  const newHistory = [historyLabel, ...currentHistory.filter(h => h !== historyLabel)].slice(0, 10)
  emit('update:notebookSearchHistory', newHistory)
}

const handleSelectHistoryItem = (item: string) => {
  showHistoryDrawer.value = false
  handleSearch(item)
}

const handleDeleteHistoryItem = (targetIndex: number) => {
  const currentHistory = [...(props.notebookSearchHistory ?? [])]
  currentHistory.splice(targetIndex, 1)
  emit('update:notebookSearchHistory', currentHistory)
}

const handleClearAllHistory = () => {
  emit('update:notebookSearchHistory', [])
}

const handleShowSearchHelp = () => {
  alertInfo({
    title: t('workflow.notebook_search.help_dialog_title'),
    content: t('workflow.notebook_search.help_dialog_content'),
  })
}

// #region custom lists
const { joinItemsToWorkflow } = useAppModals()
const isCustomListMode = ref(false)
const selectedCustomListIndex = ref(0)

interface CustomListEntry {
  index: number
  name: string
  code: string
  items: ItemInfo[]
  itemsMap: Record<number, number>
}

const customLists = computed<CustomListEntry[]>(() => {
  return XivRecipeCustomLists.map((customList, index) => {
    const name = customList[`name_${itemLanguage.value}`] || customList.name_zh || ''
    const itemsMap = decodeShareCode(customList.code) || {}
    const items: ItemInfo[] = []
    for (const [idStr, amount] of Object.entries(itemsMap)) {
      const itemInfo = getItemInfo(Number(idStr))
      if (itemInfo && itemInfo.id) {
        itemInfo.amount = amount
        items.push(itemInfo)
      }
    }
    sortItems(items, 'recipeOrder')
    return {
      index,
      name,
      code: customList.code,
      items,
      itemsMap,
    }
  })
})

const currCustomList = computed<CustomListEntry | undefined>(() => {
  return customLists.value[selectedCustomListIndex.value] || customLists.value[0]
})

const handleEnterCustomListMode = () => {
  isSearchMode.value = false
  isStarredMode.value = false
  isCustomListMode.value = true
  if (currCustomList.value?.items?.length) {
    emit('update:selectedItem', currCustomList.value.items[0].id)
  }
  scrollToTop()
}

const handleCustomListSelect = (index: number) => {
  selectedCustomListIndex.value = index
  const cl = customLists.value[index]
  if (cl?.items?.length) {
    emit('update:selectedItem', cl.items[0].id)
  }
  scrollToTop()
}

const handleJoinCustomList = (entry: CustomListEntry) => {
  if (Object.keys(entry.itemsMap).length > 0) {
    joinItemsToWorkflow(entry.itemsMap)
  }
}
// #endregion

// #region starred recipes
const isStarredMode = ref(false)

const starredItems = computed<ItemInfo[]>(() => {
  const ids = store.userConfig.notebook_starred_recipes || []
  const items: ItemInfo[] = []
  for (const id of ids) {
    const itemInfo = getItemInfo(id)
    if (itemInfo && itemInfo.id) {
      items.push(itemInfo)
    }
  }
  const sortBy = store.userConfig.notebook_item_sortby || 'recipeOrder'
  sortItems(items, sortBy)
  return items
})

const isRecipeStarred = (id: number) => {
  return store.userConfig.notebook_starred_recipes.includes(id)
}

const toggleStarRecipe = (id: number) => {
  const starredList = store.userConfig.notebook_starred_recipes
  const idx = starredList.indexOf(id)
  if (idx >= 0) {
    starredList.splice(idx, 1)
  } else {
    if (starredList.length >= 100) {
      NAIVE_UI_MESSAGE.warning(t('workflow.notebook_starred.max_reached', { max: 100 }))
      return
    }
    starredList.push(id)
  }
  store.updateUserConfig()
}

const handleEnterStarredMode = () => {
  isSearchMode.value = false
  isCustomListMode.value = false
  isStarredMode.value = true
  if (starredItems.value.length > 0) {
    emit('update:selectedItem', starredItems.value[0].id)
  }
  scrollToTop()
}
// #endregion

const handleJobSelect = (job: number) => {
  isSearchMode.value = false
  isCustomListMode.value = false
  isStarredMode.value = false
  emit('update:selectedJob', job)
  scrollToTop()
}

const handleMenuTabUpdate = (val: 'common' | 'special' | 'master') => {
  if (isCustomListMode.value || isStarredMode.value) return
  isSearchMode.value = false
  searchKeyword.value = ''
  emit('update:selectedMenu', val)
  scrollToTop()
}

const handleContentGroupSelect = (menuId: `i_${number}`) => {
  isSearchMode.value = false
  isCustomListMode.value = false
  isStarredMode.value = false
  searchKeyword.value = ''
  emit('update:selectedContentGroup', menuId)
  scrollToTop()
}

interface DisplayedNotebookGroup {
  key: string | number
  label?: string
  items: {
    item: ItemInfo
    amount: number
  }[]
}

const displayedNotebookGroups = computed<DisplayedNotebookGroup[]>(() => {
  if (isSearchMode.value) {
    return searchResults.value.map(group => ({
      key: group.groupKey,
      label: group.groupLabel,
      items: group.items.map(item => ({ item, amount: 0 })),
    }))
  }
  if (isStarredMode.value) {
    return [{
      key: 'starred',
      label: t('workflow.notebook_starred.title'),
      items: starredItems.value.map(item => ({ item, amount: 0 })),
    }]
  }
  if (isCustomListMode.value) {
    if (!currCustomList.value) return []
    return [{
      key: currCustomList.value.index,
      label: currCustomList.value.name,
      items: currCustomList.value.items.map(item => ({ item, amount: item.amount })),
    }]
  }
  return Object.values(currContentGroups.value).map(cg => ({
    key: cg.id,
    label: cg.name,
    items: cg.items.map(item => ({ item, amount: 0 })),
  }))
})

// #region filter and settings
const selectedUiType = ref<number>(-1)

const getItemTypeName = (item: ItemInfo) => {
  switch (itemLanguage.value) {
    case 'ja':
      return item.uiTypeNameJA
    case 'en':
      return item.uiTypeNameEN
    case 'zh':
    default:
      return item.uiTypeNameZH
  }
}

const filterOptions = computed(() => {
  const allItems = displayedNotebookGroups.value.flatMap(g => g.items.map(i => i.item))
  const totalCount = allItems.length

  const categoryMap = new Map<number, {
    uiTypeId: number
    uiTypeOrder: number
    name: string
    iconUrl: string
    count: number
  }>()

  allItems.forEach(item => {
    const typeId = item.uiTypeId
    if (!typeId && typeId !== 0) return
    const existing = categoryMap.get(typeId)
    if (existing) {
      existing.count++
    } else {
      categoryMap.set(typeId, {
        uiTypeId: typeId,
        uiTypeOrder: item.uiTypeOrder ?? 0,
        name: getItemTypeName(item),
        iconUrl: item.uiTypeIconUrl,
        count: 1,
      })
    }
  })

  const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
    return (a.uiTypeOrder - b.uiTypeOrder) || (a.uiTypeId - b.uiTypeId)
  })

  return [
    {
      value: -1,
      label: t('workflow.notebook_filter.all'),
      iconUrl: '',
      count: totalCount,
    },
    ...sortedCategories.map(cat => ({
      value: cat.uiTypeId,
      label: cat.name,
      iconUrl: cat.iconUrl,
      count: cat.count,
    })),
  ]
})

watch(filterOptions, (options) => {
  if (selectedUiType.value !== -1 && !options.some(o => o.value === selectedUiType.value)) {
    selectedUiType.value = -1
  }
})

const filteredNotebookGroups = computed<DisplayedNotebookGroup[]>(() => {
  if (selectedUiType.value === -1) {
    return displayedNotebookGroups.value
  }
  return displayedNotebookGroups.value
    .map(group => ({
      ...group,
      items: group.items.filter(entry => entry.item.uiTypeId === selectedUiType.value),
    }))
    .filter(group => group.items.length > 0)
})

// 监听菜单切换、搜索结果更新或分类筛选变化，自动将物品列表滚动回顶部
watch(
  [
    () => props.selectedJob,
    () => props.selectedMenu,
    () => props.selectedContentGroup,
    isSearchMode,
    searchResults,
    isCustomListMode,
    selectedCustomListIndex,
    isStarredMode,
    selectedUiType,
  ],
  () => {
    scrollToTop()
  },
)

const handleFilterPrev = () => {
  if (filterOptions.value.length <= 1) return
  const currentIndex = filterOptions.value.findIndex(o => o.value === selectedUiType.value)
  const prevIndex = (currentIndex - 1 + filterOptions.value.length) % filterOptions.value.length
  selectedUiType.value = filterOptions.value[prevIndex].value
}

const handleFilterNext = () => {
  if (filterOptions.value.length <= 1) return
  const currentIndex = filterOptions.value.findIndex(o => o.value === selectedUiType.value)
  const nextIndex = (currentIndex + 1) % filterOptions.value.length
  selectedUiType.value = filterOptions.value[nextIndex].value
}

const renderFilterLabel = (option: SelectOption) => {
  return h(
    'div',
    { class: 'flex items-center justify-between w-full gap-1' },
    [
      h('div', { class: 'flex items-center gap-0.5 min-w-0' }, [
        option.iconUrl
          ? h(XivFARImage, { src: option.iconUrl as string, size: 14, class: 'shrink-0' })
          : null,
        h('span', { class: 'truncate' }, option.label as string),
      ]),
      h('span', { class: 'text-sub text-app-xs shrink-0 tabular-nums' }, `(${String(option.count ?? 0)})`),
    ]
  )
}

const sortOptions = computed(() => [
  { value: 'recipeOrder', label: t('preference.processes_craftable_item_sortby.option.crafting_log') },
  { value: 'recipeOrderSearch', label: t('preference.processes_craftable_item_sortby.option.crafting_log_search') },
  { value: 'itemId', label: t('game.item_id') },
])

const handleSortbyChange = (val: 'recipeOrder' | 'recipeOrderSearch' | 'itemId') => {
  store.userConfig.notebook_item_sortby = val
  store.updateUserConfig()
}

const handleActionButtonsChange = (val: (string | number)[]) => {
  const validValues = val.filter((v): v is 'reverse_lookup' | 'star_recipe' | 'add_to_workflow' =>
    v === 'reverse_lookup' || v === 'star_recipe' || v === 'add_to_workflow'
  )
  if (!validValues.includes('add_to_workflow')) {
    validValues.push('add_to_workflow')
  }
  store.userConfig.notebook_action_buttons = validValues
  store.updateUserConfig()
}
// #endregion
// #endregion

// #region item context menu
const activeContextItem = ref<ItemInfo | null>(null)
const {
  showDropdown: notebookDropdownShow,
  dropdownX: notebookDropdownX,
  dropdownY: notebookDropdownY,
  dropdownOptions: notebookDropdownOptions,
  handleContextMenu: _notebookHandleContextMenu,
  handleSelect: notebookHandleSelect,
  onClickOutside: notebookOnClickOutside,
  handleTouchStart: _notebookHandleTouchStart,
  handleTouchMove: notebookHandleTouchMove,
  handleTouchEnd: notebookHandleTouchEnd,
} = useItemContextMenu(
  () => activeContextItem.value ?? ({} as ItemInfo),
)
const handleNotebookItemContextMenu = (e: MouseEvent, item: ItemInfo) => {
  activeContextItem.value = item
  _notebookHandleContextMenu(e)
}
const handleNotebookItemTouchStart = (e: TouchEvent, item: ItemInfo) => {
  activeContextItem.value = item
  _notebookHandleTouchStart(e)
}
// #endregion

const focusRecipe = (itemOrId: ItemInfo | number) => {
  const itemInfo = typeof itemOrId === 'number' ? getItemInfo(itemOrId) : itemOrId
  if (!itemInfo?.id) return

  const targetItemId = itemInfo.id

  let targetJob: number | null = null
  let targetMenuType: ('common' | 'special' | 'master') | null = null
  let targetContentGroupKey: `i_${number}` | null = null

  // 检查指定职业的菜单中是否包含该配方
  const checkJob = (job: number) => {
    const group = notebookGroups.value[job]
    if (!group) return false
    const menuTypes: ('common' | 'special' | 'master')[] = ['common', 'special', 'master']
    for (const menuType of menuTypes) {
      const menus = group.menus[menuType]
      for (const [menuKey, menu] of Object.entries(menus)) {
        for (const cg of Object.values(menu.contentGroups)) {
          if (cg.items.some(it => it.id === targetItemId)) {
            targetJob = job
            targetMenuType = menuType
            targetContentGroupKey = menuKey as `i_${number}`
            return true
          }
        }
      }
    }
    return false
  }

  // 1. 优先在当前选中的职业中查找
  if (!checkJob(props.selectedJob)) {
    // 2. 检查物品的主生产职业
    const primaryJob = itemInfo.craftInfo?.jobId
    if (primaryJob && checkJob(primaryJob)) {
      // 成功匹配主职业
    } else {
      // 3. 遍历其他所有职业查找
      for (const jobStr of Object.keys(notebookGroups.value)) {
        const job = Number(jobStr)
        if (job !== props.selectedJob && checkJob(job)) {
          break
        }
      }
    }
  }

  // 退出搜索、自定列表、收藏列表模式
  isSearchMode.value = false
  isCustomListMode.value = false
  isStarredMode.value = false
  searchKeyword.value = ''

  // 若分类筛选导致该物品不可见，重置分类筛选为全部
  if (selectedUiType.value !== -1 && itemInfo.uiTypeId !== selectedUiType.value) {
    selectedUiType.value = -1
  }

  if (targetJob !== null && targetJob !== props.selectedJob) {
    emit('update:selectedJob', targetJob)
  }
  if (targetMenuType !== null && targetMenuType !== props.selectedMenu) {
    skipMenuSwitchEffect.value = true
    emit('update:selectedMenu', targetMenuType)
    setTimeout(() => {
      skipMenuSwitchEffect.value = false
    }, 500)
  }
  if (targetContentGroupKey !== null && targetContentGroupKey !== props.selectedContentGroup) {
    emit('update:selectedContentGroup', targetContentGroupKey)
  }
  emit('update:selectedItem', targetItemId)

  // 滚动定位到物品列表中的对应项
  nextTick(() => {
    setTimeout(() => {
      const container = itemListContainerRef.value
      const targetEl = container?.querySelector(`[data-item-id="${targetItemId}"]`) as HTMLElement | null
      if (targetEl) {
        targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      } else {
        scrollToTop()
      }
    }, 100)
  })
}

defineExpose({
  searchByMaterial,
  focusRecipe,
})
</script>

<template>
  <FoldableCard
    card-key="workflow-content-notebooks"
    class="block-a"
    :unfoldable="!isMobile"
  >
    <template #header>
      <i class="xiv square-0"></i>
      <span class="card-title__text">{{ t('recipe.notebook') }}</span>
    </template>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-1 md:gap-1.5">
        <n-tooltip
          v-for="job in Object.keys(notebookGroups)"
          :key="job"
          placement="top"
          :trigger="isMobile ? 'manual' : 'hover'"
        >
          <template #trigger>
            <n-button
              class="p-px w-8.5! h-8.5! md:w-9! md:h-9!"
              :type="!isSearchMode && !isCustomListMode && !isStarredMode && selectedJob === Number(job) ? 'primary' : 'default'"
              @click="handleJobSelect(Number(job))"
            >
              <XivFARImage
                :src="XivJobs[Number(job)].job_icon_url"
                :size="isMobile ? 30 : 32"
              />
            </n-button>
          </template>
          {{ XivJobs[Number(job)]?.[`job_name_${itemLanguage}`] || XivJobs[Number(job)]?.job_name_zh }}
        </n-tooltip>
        <n-tooltip placement="top" :trigger="isMobile ? 'manual' : 'hover'">
          <template #trigger>
            <n-button
              class="p-px w-8.5! h-8.5! md:w-9! md:h-9!"
              :type="!isSearchMode && isCustomListMode ? 'primary' : 'default'"
              @click="handleEnterCustomListMode"
            >
              <XivFARImage
                src="./ui/mog.png"
                :size="isMobile ? 30 : 32"
              />
            </n-button>
          </template>
          {{ t('recipe.notebookgroup.custom_lists') }}
        </n-tooltip>
        <n-tooltip placement="top" :trigger="isMobile ? 'manual' : 'hover'">
          <template #trigger>
            <n-button
              class="p-px w-8.5! h-8.5! md:w-9! md:h-9!"
              :type="!isSearchMode && isStarredMode ? 'primary' : 'default'"
              @click="handleEnterStarredMode"
            >
              <XivFARImage
                src="./ui/star.png"
                :size="isMobile ? 30 : 32"
              />
            </n-button>
          </template>
          {{ t('workflow.notebook_starred.title') }}
        </n-tooltip>
      </div>
      <n-input-group class="search-input-group">
        <n-input-group-label>
          <div class="px-1 flex items-center gap-1">
            <div>{{ t('common.search') }}</div>
          </div>
        </n-input-group-label>
        <n-input
          v-model:value="searchKeyword"
          :placeholder="t('workflow.notebook_search.placeholder')"
          :maxlength="100"
          clearable
          @keydown.enter="handleSearch()"
        />
        <!-- 搜索说明信息按钮 -->
        <n-button
          class="n-square-button"
          :title="t('workflow.notebook_search.help_button_title')"
          @click="handleShowSearchHelp"
        >
          <template #icon>
            <n-icon :size="16"><InfoOutlined /></n-icon>
          </template>
        </n-button>
        <!-- 桌面端搜索历史 -->
        <n-popover v-if="!isMobile" trigger="hover" placement="bottom-end">
          <template #trigger>
            <n-button class="n-square-button">
              <template #icon>
                <n-icon :size="16"><HistoryRound /></n-icon>
              </template>
            </n-button>
          </template>
          <div class="py-1 min-w-44 max-w-64">
            <div class="text-app-xs font-bold mb-1.5 px-1 select-none text-sub">
              {{ t('workflow.notebook_search.history') }}
            </div>
            <n-divider class="my-1!" />
            <template v-if="notebookSearchHistory?.length">
              <n-scrollbar style="max-height: 192px;" trigger="none">
                <div class="flex flex-col gap-0.5 pr-1.5">
                  <div
                    v-for="(item, idx) in notebookSearchHistory"
                    :key="idx"
                    class="flex items-center justify-between gap-1 rounded hover:bg-bg-hover px-1 group transition-colors"
                  >
                    <span
                      class="flex-1 text-app-xs py-1 truncate cursor-pointer select-none text-text hover:text-primary transition-colors"
                      @click="handleSearch(item)"
                    >
                      {{ item }}
                    </span>
                    <n-button
                      quaternary
                      circle
                      size="tiny"
                      class="opacity-60 hover:opacity-100 shrink-0"
                      @click.stop="handleDeleteHistoryItem(idx)"
                    >
                      <template #icon>
                        <n-icon :size="12"><CloseRound /></n-icon>
                      </template>
                    </n-button>
                  </div>
                </div>
              </n-scrollbar>
              <n-divider class="my-1.5!" />
              <div class="flex justify-end">
                <n-button
                  quaternary
                  size="tiny"
                  type="error"
                  @click="handleClearAllHistory"
                >
                  <template #icon>
                    <n-icon :size="14"><DeleteSweepRound /></n-icon>
                  </template>
                  {{ t('workflow.notebook_search.clear_history') }}
                </n-button>
              </div>
            </template>
            <template v-else>
              <n-empty size="small" :description="t('workflow.notebook_search.empty_history')" class="my-2" />
            </template>
          </div>
        </n-popover>
        <!-- 移动端搜索历史 -->
        <n-button
          v-if="isMobile"
          class="n-square-button"
          @click="showHistoryDrawer = true"
        >
          <template #icon>
            <n-icon :size="16"><HistoryRound /></n-icon>
          </template>
        </n-button>
        <!-- 搜索按钮 -->
        <n-button type="primary" class="n-square-button" @click="handleSearch()">
          <template #icon>
            <n-icon :size="16"><SearchRound /></n-icon>
          </template>
        </n-button>
      </n-input-group>
    </div>
    <n-divider class="my-2!" />
    <div class="w-full flex">
      <div class="w-27 md:w-48 flex flex-col pr-1.5 md:pr-2 shrink-0" :style="{ height: menuHeight, borderRight: '1px solid var(--color-border)' }">
        <n-tabs
          :value="selectedMenu"
          :disabled="isCustomListMode || isStarredMode"
          type="segment" animated
          class="notebook-menu-tabs mb-2 transition-opacity"
          :class="isCustomListMode || isStarredMode ? 'opacity-40' : ''"
          @update:value="handleMenuTabUpdate"
        >
          <n-tab name="common">
            <n-tooltip placement="top" :trigger="isMobile ? 'manual' : 'hover'">
              <template #trigger>
                <n-icon
                  :size="18"
                  :color="(isCustomListMode || isStarredMode) ? 'var(--app-color-text-sub)' : (!isSearchMode && selectedMenu === 'common' ? 'var(--color-primary)' : undefined)"
                >
                  <component :is="CommonGroupIcon" />
                </n-icon>
              </template>
              {{ t('recipe.notebookgroup.common') }}
            </n-tooltip>
          </n-tab>
          <n-tab name="special">
            <n-tooltip placement="top" :trigger="isMobile ? 'manual' : 'hover'">
              <template #trigger>
                <n-icon
                  :size="18"
                  :color="(isCustomListMode || isStarredMode) ? 'var(--app-color-text-sub)' : (!isSearchMode && selectedMenu === 'special' ? 'var(--color-primary)' : undefined)"
                >
                  <component :is="SpecialGroupIcon" />
                </n-icon>
              </template>
              {{ t('recipe.notebookgroup.special') }}
            </n-tooltip>
          </n-tab>
          <n-tab name="master">
            <n-tooltip placement="top" :trigger="isMobile ? 'manual' : 'hover'">
              <template #trigger>
                <n-icon
                  :size="18"
                  :color="(isCustomListMode || isStarredMode) ? 'var(--app-color-text-sub)' : (!isSearchMode && selectedMenu === 'master' ? 'var(--color-primary)' : undefined)"
                >
                  <component :is="MasterGroupIcon" />
                </n-icon>
              </template>
              {{ t('recipe.notebookgroup.master') }}
            </n-tooltip>
          </n-tab>
        </n-tabs>
        <n-scrollbar trigger="none" class="flex-1">
          <div class="flex flex-col gap-0.5">
            <template v-if="isStarredMode">
              <n-button
                size="small"
                :tertiary="true"
                class="justify-start truncate"
              >
                <span class="truncate">{{ t('workflow.notebook_starred.title') }}</span>
              </n-button>
            </template>
            <template v-else-if="isCustomListMode">
              <div
                v-for="cl in customLists"
                :key="cl.index"
                class="flex items-center gap-1 group"
              >
                <n-button
                  size="small"
                  :tertiary="selectedCustomListIndex === cl.index"
                  :quaternary="selectedCustomListIndex !== cl.index"
                  class="flex-1 justify-start truncate"
                  @click="handleCustomListSelect(cl.index)"
                >
                  <span class="truncate">{{ cl.name }}</span>
                </n-button>
                <n-button
                  size="small"
                  :type="selectedCustomListIndex === cl.index ? 'primary' : 'default'"
                  :tertiary="selectedCustomListIndex === cl.index"
                  :quaternary="selectedCustomListIndex !== cl.index"
                  class="shrink-0 n-square-button"
                  :title="t('workflow.custom_list.join_list')"
                  @click.stop="handleJoinCustomList(cl)"
                >
                  <template #icon>
                    <n-icon :size="16"><JoinLeftOutlined /></n-icon>
                  </template>
                </n-button>
              </div>
            </template>
            <template v-else>
              <!-- 特殊配方：二级分类菜单展示 -->
              <template v-if="selectedMenu === 'special' && specialMenuTree.length">
                <div
                  v-for="node in specialMenuTree"
                  :key="node.groupKey"
                  class="flex flex-col"
                >
                  <!-- 单子项分类：直接作为一级按钮展示 -->
                  <template v-if="node.children.length === 1">
                    <n-button
                      size="small"
                      :tertiary="!isSearchMode && selectedContentGroup === node.children[0].menuId"
                      :quaternary="isSearchMode || selectedContentGroup !== node.children[0].menuId"
                      class="justify-start truncate"
                      @click="handleContentGroupSelect(node.children[0].menuId)"
                    >
                      <span class="truncate">{{ node.children[0].menu.name }}</span>
                    </n-button>
                  </template>

                  <!-- 多子项分类：一级标题 + 带树枝线条的二级菜单 -->
                  <template v-else>
                    <div class="text-sub px-1 pt-0.5 select-none truncate">
                      {{ node.groupLabel }}
                    </div>
                    <div
                      v-for="(child, childIdx) in node.children"
                      :key="child.menuId"
                      class="relative pb-0.5"
                    >
                      <!-- 树枝线条：垂直线条 -->
                      <div
                        class="absolute left-2 top-0 border-l border-sub opacity-50"
                        :class="childIdx === node.children.length - 1 ? 'h-3.5' : 'bottom-0'"
                      />
                      <!-- 树枝线条：水平线条 -->
                      <div
                        class="absolute left-2 top-3.5 w-1.5 md:w-2.5 border-t border-sub opacity-50"
                      />
                      <div class="pl-3.5 md:pl-5">
                        <n-button
                          size="small"
                          :tertiary="!isSearchMode && selectedContentGroup === child.menuId"
                          :quaternary="isSearchMode || selectedContentGroup !== child.menuId"
                          class="justify-start w-full truncate pl-1!"
                          @click="handleContentGroupSelect(child.menuId)"
                        >
                          <span class="truncate">{{ child.subLabel }}</span>
                        </n-button>
                      </div>
                    </div>
                  </template>
                </div>
              </template>

              <!-- 普通/秘籍配方：扁平菜单展示 -->
              <template v-else>
                <n-button
                  v-for="menu in Object.values(currMenus)"
                  :key="menu.id + menu.name"
                  size="small"
                  :tertiary="!isSearchMode && selectedContentGroup === `i_${menu.id}`"
                  :quaternary="isSearchMode || selectedContentGroup !== `i_${menu.id}`"
                  class="justify-start truncate"
                  @click="handleContentGroupSelect(`i_${menu.id}`)"
                >
                  <span class="truncate">{{ menu.name }}</span>
                </n-button>
              </template>
            </template>
          </div>
        </n-scrollbar>
      </div>
      <div class="flex-1 pl-1.5 md:pl-2 flex min-w-0" :style="{ height: menuHeight }">
        <div class="flex-1 flex flex-col h-full min-w-0">
          <div class="flex items-center gap-1.5 md:gap-2 justify-between mb-2 pr-0 md:pr-3 shrink-0">
            <div class="flex-1 min-w-0 md:w-80 md:flex-none flex items-center gap-1">
              <n-select
                v-model:value="selectedUiType"
                size="small"
                :options="filterOptions"
                :render-label="renderFilterLabel"
                :to="false"
                class="flex-1 min-w-0"
              />
              <n-button
                v-if="!isMobile"
                size="small"
                class="n-square-button shrink-0"
                :disabled="filterOptions.length <= 1"
                :title="t('workflow.notebook_actions.previous')"
                @click="handleFilterPrev"
              >
                <template #icon>
                  <n-icon :size="16"><ChevronLeftOutlined /></n-icon>
                </template>
              </n-button>
              <n-button
                v-if="!isMobile"
                size="small"
                class="n-square-button shrink-0"
                :disabled="filterOptions.length <= 1"
                :title="t('workflow.notebook_actions.next')"
                @click="handleFilterNext"
              >
                <template #icon>
                  <n-icon :size="16"><ChevronRightOutlined /></n-icon>
                </template>
              </n-button>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <n-popover
                trigger="click"
                placement="bottom-end"
                style="width: 220px;"
              >
                <template #trigger>
                  <n-button
                    size="small"
                    class="n-square-button shrink-0"
                    :title="t('workflow.notebook_settings.title')"
                  >
                    <template #icon>
                      <n-icon :size="16"><SettingsRound /></n-icon>
                    </template>
                  </n-button>
                </template>
                <div class="flex flex-col p-1">
                  <div class="flex items-center gap-0.75 text-app-xl">
                    <n-icon :size="16"><SettingsRound /></n-icon>
                    <span>{{ t('workflow.notebook_settings.title') }}</span>
                  </div>
                  <n-divider class="mt-0! mb-1!" />
                  <div>
                    <div class="font-bold">{{ t('preference.notebook_item_sortby.title') }}</div>
                    <n-select
                      v-model:value="store.userConfig.notebook_item_sortby"
                      size="small"
                      :options="sortOptions"
                      @update:value="handleSortbyChange"
                    />
                  </div>
                  <div class="mt-2">
                    <div class="font-bold">{{ t('workflow.notebook_settings.custom_action_buttons') }}</div>
                    <n-checkbox-group
                      size="small"
                      v-model:value="store.userConfig.notebook_action_buttons"
                      @update:value="handleActionButtonsChange"
                    >
                      <div class="flex flex-col mt-1 pl-2">
                        <n-checkbox value="reverse_lookup">
                          <span class="inline-flex items-center gap-1">
                            <n-icon :size="16"><SearchRound /></n-icon>
                            <span>{{ t('item.text.reverse_recipe_lookup') }}</span>
                          </span>
                        </n-checkbox>
                        <n-checkbox value="star_recipe">
                          <span class="inline-flex items-center gap-1">
                            <n-icon :size="16"><StarBorderRound /></n-icon>
                            <span>{{ t('workflow.notebook_settings.star_recipe') }}</span>
                          </span>
                        </n-checkbox>
                        <n-checkbox value="add_to_workflow" disabled>
                          <span class="inline-flex items-center gap-1">
                            <n-icon :size="16"><PlaylistAddOutlined /></n-icon>
                            <span>{{ t('workflow.text.join_in_curr_workflow') }}</span>
                          </span>
                        </n-checkbox>
                      </div>
                    </n-checkbox-group>
                  </div>
                </div>
              </n-popover>
            </div>
          </div>
          <n-scrollbar ref="itemListScrollbarRef" trigger="none" class="flex-1">
            <div ref="itemListContainerRef">
              <div
                v-for="group in filteredNotebookGroups"
                :key="group.key"
                class="flex flex-col gap-1 pr-0 md:pr-3 mb-2"
              >
                <div v-if="group.label" class="sticky top-0 z-10 w-full rounded px-1 bg-border truncate">
                  <i class="xiv e032"></i>
                  {{ group.label }}
                </div>
                <div
                  v-for="entry in group.items"
                  :key="entry.item.id"
                  :data-item-id="entry.item.id"
                  class="flex gap-1"
                >
                  <n-button
                    :type="selectedItem === entry.item.id ? 'primary' : 'default'"
                    class="item-list-btn flex-1 justify-start px-1.5! md:px-2! py-1! h-auto! min-w-0 overflow-hidden"
                    @click="handleItemClick(entry.item.id)"
                    @contextmenu="handleNotebookItemContextMenu($event, entry.item)"
                    @touchstart.passive="handleNotebookItemTouchStart($event, entry.item)"
                    @touchmove.passive="notebookHandleTouchMove"
                    @touchend.passive="notebookHandleTouchEnd"
                  >
                    <ItemCell
                      :item-info="entry.item"
                      :amount="entry.amount"
                      show-item-details
                    />
                  </n-button>
                  <n-button
                    v-if="store.userConfig.notebook_action_buttons?.includes('reverse_lookup')"
                    class="w-7! md:w-10! h-auto! px-0.5! md:px-1! shrink-0"
                    :title="t('item.text.reverse_recipe_lookup')"
                    @click.stop="searchByMaterial(entry.item)"
                  >
                    <template #icon>
                      <n-icon :size="isMobile ? 16 : 20"><SearchRound /></n-icon>
                    </template>
                  </n-button>
                  <n-button
                    v-if="store.userConfig.notebook_action_buttons?.includes('star_recipe')"
                    class="w-7! md:w-10! h-auto! px-0.5! md:px-1! shrink-0"
                    :type="isRecipeStarred(entry.item.id) ? 'warning' : 'default'"
                    :ghost="true"
                    :title="isRecipeStarred(entry.item.id) ? t('workflow.notebook_starred.unstar_recipe') : t('workflow.notebook_starred.star_recipe')"
                    @click.stop="toggleStarRecipe(entry.item.id)"
                  >
                    <n-icon :size="isMobile ? 16 : 20" :color="isRecipeStarred(entry.item.id) ? '#F6CA45' : undefined">
                      <StarRound v-if="isRecipeStarred(entry.item.id)" />
                      <StarBorderRound v-else />
                    </n-icon>
                  </n-button>
                  <n-button
                    type="info"
                    :ghost="selectedItem !== entry.item.id"
                    class="w-7! md:w-10! h-auto! px-0.5! md:px-1! shrink-0"
                    :title="t('workflow.text.add_item_to_curr_workflow.tip_1') + '\r\n' + t('workflow.text.add_item_to_curr_workflow.tip_2')"
                    @click="emit('add-item', entry.item.id)"
                  >
                    <n-icon :size="isMobile ? 16 : 20"><PlaylistAddOutlined /></n-icon>
                  </n-button>
                </div>
              </div>
              <div
                v-if="filteredNotebookGroups.length === 0"
                class="h-full flex items-center justify-center py-8"
              >
                <n-empty :description="isStarredMode ? t('workflow.notebook_starred.empty') : t('common.no_data')" />
              </div>
            </div>
          </n-scrollbar>
        </div>
        <n-dropdown
          size="small"
          placement="bottom-start"
          trigger="manual"
          :x="notebookDropdownX"
          :y="notebookDropdownY"
          :options="notebookDropdownOptions"
          :show="notebookDropdownShow"
          :on-clickoutside="notebookOnClickOutside"
          @select="notebookHandleSelect"
        />
        <div v-if="!isMobile" class="w-1/2 pl-2" style="border-left: 1px solid var(--color-border);">
          <NotebookRecipeDetail
            :item="currSelectedItem"
            :selected-item="selectedItem"
            :is-starred="currSelectedItem ? isRecipeStarred(currSelectedItem.id) : false"
            @toggle-star="toggleStarRecipe"
            @add-item="emit('add-item', $event)"
          />
        </div>
      </div>
    </div>

    <!-- 移动端配方详情抽屉 -->
    <n-drawer
      v-if="isMobile"
      id="mobile-notebook-recipe-drawer"
      v-model:show="showMobileRecipeDrawer"
      placement="bottom"
      height="72vh"
      :auto-focus="false"
    >
      <n-drawer-content :body-content-style="{ padding: '8px 4px', height: '100%' }">
        <NotebookRecipeDetail
          :item="currSelectedItem"
          :selected-item="selectedItem"
          :is-starred="currSelectedItem ? isRecipeStarred(currSelectedItem.id) : false"
          in-drawer
          container-id="mobile-notebook-recipe-drawer"
          @toggle-star="toggleStarRecipe"
          @add-item="emit('add-item', $event)"
          @close="showMobileRecipeDrawer = false"
        />
      </n-drawer-content>
    </n-drawer>

    <!-- 移动端搜索历史抽屉 -->
    <n-drawer
      v-model:show="showHistoryDrawer"
      placement="bottom"
      height="340"
      :auto-focus="false"
    >
      <n-drawer-content :title="t('workflow.notebook_search.history')" closable>
        <template v-if="notebookSearchHistory?.length">
          <div class="flex flex-col gap-1 py-1">
            <div
              v-for="(item, idx) in notebookSearchHistory"
              :key="idx"
              class="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-bg-hover border border-border"
            >
              <span
                class="flex-1 text-app-sm truncate cursor-pointer select-none"
                @click="handleSelectHistoryItem(item)"
              >
                {{ item }}
              </span>
              <n-button
                quaternary
                circle
                size="small"
                class="shrink-0"
                @click.stop="handleDeleteHistoryItem(idx)"
              >
                <template #icon>
                  <n-icon :size="16"><CloseRound /></n-icon>
                </template>
              </n-button>
            </div>
          </div>
          <n-divider class="my-2!" />
          <div class="flex justify-end">
            <n-button
              quaternary
              size="small"
              type="error"
              @click="handleClearAllHistory"
            >
              <template #icon>
                <n-icon :size="16"><DeleteSweepRound /></n-icon>
              </template>
              {{ t('workflow.notebook_search.clear_history') }}
            </n-button>
          </div>
        </template>
        <template v-else>
          <n-empty size="medium" :description="t('workflow.notebook_search.empty_history')" class="my-6" />
        </template>
      </n-drawer-content>
    </n-drawer>
  </FoldableCard>
</template>

<style scoped>
:deep(.n-select .n-virtual-list.v-vl) {
  --n-option-height: 28px !important;
  max-height: calc(var(--n-option-height) * 7.6);
}
.item-list-btn :deep(.n-button__content) {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
.search-input-group {
  max-width: 458px;
}
@media screen and (max-width: 767px) {
  .search-input-group {
    width: 100%;
    max-width: 100%;
  }
  .notebook-menu-tabs :deep(.n-tabs-tab) {
    padding: 3px 0 !important;
  }
}
</style>
