<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BookmarkOutlined,
  CloseRound,
  DeleteSweepRound,
  HistoryRound,
  OpenInNewFilled,
  PlaylistAddOutlined,
  SearchRound,
} from '@vicons/material'
import ItemCell from '@/components/item/ItemCell.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import TooltipButton from '@/components/ui/TooltipButton.vue'
import ItemInfoHeader from '@/components/item/ItemInfoHeader.vue'
import ItemRecipeTree from '@/components/item/ItemRecipeTree.vue'
import useConfig from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { useAppModals } from '@/composables/useAppModals'
import { useItemContextMenu } from '@/composables/useItemContextMenu'
import CommonGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-common.svg'
import MasterGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-master.svg'
import SpecialGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-special.svg'
import { XivJobs, XivRecipeCustomLists, XivSrbMap, XivUnpackedRecipes } from '@/assets/data'
import { sortRecord } from '@/tools'
import { getItemInfo, sortItems, type ItemInfo } from '@/tools/item'
import { decodeShareCode } from '@/tools/shareCode'

const { t } = useLocale()
const { isMobile } = useResponsive()
const { itemLanguage } = useConfig()
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
        const id = 99
        menu[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.other_master_recipes'), contentGroups: {} }
        menu[`i_${id}`].contentGroups[srb] ??= { id: srb, name: srbItem[`name_${itemLanguage.value}`], items: [] }
        menu[`i_${id}`].contentGroups[srb].items.push(item)
      }
    }

    // * 特殊
    else if (item.isFurnishing) {
      const id = 1
      group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.furnishing'), contentGroups: {} }
      group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
    } else if (item.collectable) {
      const id = 2
      group.menus.special[`i_${id}`] ??= { id, name: t('recipe.notebookgroup.collectable'), contentGroups: {} }
      group.menus.special[`i_${id}`].contentGroups[0] ??= { id: 0, items: [] }
      group.menus.special[`i_${id}`].contentGroups[0].items.push(item)
    } else if (
      item.uiTypeId === /*染剂*/55
    ) {
      const id = 99
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
    Object.values(group.menus.common).forEach(menu => {
      Object.values(menu.contentGroups).forEach(contentGroup => {
        sortItems(contentGroup.items, 'recipeOrder')
      })
    })
    Object.values(group.menus.special).forEach(menu => {
      Object.values(menu.contentGroups).forEach(contentGroup => {
        sortItems(contentGroup.items, 'recipeOrder')
      })
    })
    Object.values(group.menus.master).forEach(menu => {
      Object.values(menu.contentGroups).forEach(contentGroup => {
        sortItems(contentGroup.items, 'recipeOrder')
      })
    })
  })
  return groups
})

const currGroup = computed(() => notebookGroups.value[props.selectedJob])
const currMenus = computed(() => currGroup.value?.menus?.[props.selectedMenu] ?? {})
const currContentGroups = computed(() => currMenus.value?.[props.selectedContentGroup]?.contentGroups ?? {})
const currSelectedItem = computed(() => {
  const itemId = props.selectedItem
  if (!itemId) return null
  return getItemInfo(itemId)
})

const onNotebookMenuSwitched = () => {
  const keys = Object.keys(currMenus.value) as `i_${number}`[]
  if (!keys.length) return
  const firstKey = keys[0]
  emit('update:selectedContentGroup', firstKey)
}
watch(() => props.selectedMenu, onNotebookMenuSwitched)

const simulateCraftCurrSelectedItem = () => {
  if (!currSelectedItem.value?.craftInfo?.recipeId) return
  window.open(`https://tnze.yyyy.games/#/recipe?recipeId=${currSelectedItem.value.craftInfo.recipeId}`)
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

const handleSearch = (keyword?: string) => {
  const targetKeyword = typeof keyword === 'string' ? keyword : searchKeyword.value
  searchKeyword.value = targetKeyword
  if (!targetKeyword || !targetKeyword.trim()) {
    NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_empty'))
    return
  }
  const trimmed = targetKeyword.trim()
  if (trimmed.length > 50) {
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
          const matched = cg.items.filter(item => matchItem(item, trimmed))
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

  if (results.length === 0) {
    NAIVE_UI_MESSAGE.error(t('workflow.notebook_search.error_no_result'))
    return
  }

  searchResults.value = results
  isSearchMode.value = true
  isCustomListMode.value = false

  // 记录搜索历史 (最多10条，去重且最新排在最前)
  const currentHistory = props.notebookSearchHistory ?? []
  const newHistory = [trimmed, ...currentHistory.filter(h => h !== trimmed)].slice(0, 10)
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

// #region custom lists
const { joinItemsToWorkflow } = useAppModals()
const isCustomListMode = ref(false)
const selectedCustomListIndex = ref(0)

interface CustomListItem {
  item: ItemInfo
  amount: number
}
interface CustomListEntry {
  index: number
  name: string
  code: string
  items: CustomListItem[]
  itemsMap: Record<number, number>
}

const customLists = computed<CustomListEntry[]>(() => {
  return XivRecipeCustomLists.map((customList, index) => {
    const name = customList[`name_${itemLanguage.value}`] || customList.name_zh || ''
    const itemsMap = decodeShareCode(customList.code) || {}
    const items: CustomListItem[] = []
    for (const [idStr, amount] of Object.entries(itemsMap)) {
      const itemInfo = getItemInfo(Number(idStr))
      if (itemInfo && itemInfo.id) {
        items.push({ item: itemInfo, amount })
      }
    }
    items.sort((a, b) => {
      const aCraft = a.item.craftInfo
      const bCraft = b.item.craftInfo
      if (aCraft && bCraft) {
        return (aCraft.craftLevel - bCraft.craftLevel) ||
          (aCraft.starCount - bCraft.starCount) ||
          (aCraft.rLv - bCraft.rLv) ||
          (a.item.uiTypeOrder - b.item.uiTypeOrder) ||
          (a.item.sortOrder - b.item.sortOrder) ||
          (a.item.id - b.item.id)
      }
      return (a.item.sortOrder - b.item.sortOrder) || (a.item.id - b.item.id)
    })
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
  isCustomListMode.value = true
  if (currCustomList.value?.items?.length) {
    emit('update:selectedItem', currCustomList.value.items[0].item.id)
  }
}

const handleCustomListSelect = (index: number) => {
  selectedCustomListIndex.value = index
  const cl = customLists.value[index]
  if (cl?.items?.length) {
    emit('update:selectedItem', cl.items[0].item.id)
  }
}

const handleJoinCustomList = (entry: CustomListEntry) => {
  if (Object.keys(entry.itemsMap).length > 0) {
    joinItemsToWorkflow(entry.itemsMap)
  }
}
// #endregion

const handleJobSelect = (job: number) => {
  isSearchMode.value = false
  isCustomListMode.value = false
  emit('update:selectedJob', job)
}

const handleMenuTabUpdate = (val: 'common' | 'special' | 'master') => {
  if (isCustomListMode.value) return
  isSearchMode.value = false
  emit('update:selectedMenu', val)
}

const handleContentGroupSelect = (menuId: `i_${number}`) => {
  isSearchMode.value = false
  isCustomListMode.value = false
  emit('update:selectedContentGroup', menuId)
}
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
} = useItemContextMenu(
  () => activeContextItem.value ?? ({} as ItemInfo),
)
const handleNotebookItemContextMenu = (e: MouseEvent, item: ItemInfo) => {
  activeContextItem.value = item
  _notebookHandleContextMenu(e)
}
// #endregion
</script>

<template>
  <FoldableCard
    card-key="workflow-content-notebooks"
    class="block-a"
    :unfoldable="!isMobile"
  >
    <template #header>
      <i class="xiv square-0"></i>
      <span class="app-card-title__text">{{ t('recipe.notebook') }}</span>
    </template>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <n-button
          v-for="job in Object.keys(notebookGroups)"
          :key="job"
          class="p-px w-9! h-9!"
          :type="!isSearchMode && !isCustomListMode && selectedJob === Number(job) ? 'primary' : 'default'"
          @click="handleJobSelect(Number(job))"
        >
          <XivFARImage
            :src="XivJobs[Number(job)].job_icon_url"
            :size="32"
          />
        </n-button>
        <n-tooltip placement="top">
          <template #trigger>
            <n-button
              class="p-px w-9! h-9!"
              :type="!isSearchMode && isCustomListMode ? 'primary' : 'default'"
              @click="handleEnterCustomListMode"
            >
              <n-icon :size="22">
                <BookmarkOutlined />
              </n-icon>
            </n-button>
          </template>
          {{ t('recipe.notebookgroup.custom_lists') }}
        </n-tooltip>
      </div>
      <n-input-group class="search-input-group">
        <n-input-group-label>
          <div class="px-1 flex items-center gap-1">
            <div>{{ t('common.search') }}</div>
          </div>
        </n-input-group-label>
        <n-tooltip :trigger="isMobile ? 'manual' : 'hover'" placement="bottom">
          <template #trigger>
            <n-input
              v-model:value="searchKeyword"
              :placeholder="t('workflow.notebook_search.placeholder')"
              :maxlength="50"
              clearable
              @keydown.enter="handleSearch()"
            />
          </template>
          {{ t('common.item_search_input_placeholder') }}
        </n-tooltip>
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
            <div class="text-xs font-bold mb-1.5 px-1 select-none text-sub">
              {{ t('workflow.notebook_search.history') }}
            </div>
            <n-divider class="my-1!" />
            <template v-if="notebookSearchHistory?.length">
              <div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto pr-0.5">
                <div
                  v-for="(item, idx) in notebookSearchHistory"
                  :key="idx"
                  class="flex items-center justify-between gap-1 rounded hover:bg-bg-hover px-1 group transition-colors"
                >
                  <span
                    class="flex-1 text-xs py-1 truncate cursor-pointer select-none text-text hover:text-primary transition-colors"
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
      <div class="w-48 flex flex-col pr-2" :style="{ height: menuHeight, borderRight: '1px solid var(--color-border)' }">
        <n-tabs
          :value="selectedMenu"
          :disabled="isCustomListMode"
          type="segment" animated
          class="mb-2 transition-opacity"
          :class="isCustomListMode ? 'opacity-40' : ''"
          @update:value="handleMenuTabUpdate"
        >
          <n-tab name="common">
            <n-tooltip placement="top">
              <template #trigger>
                <n-icon
                  :size="18"
                  :color="isCustomListMode ? 'var(--app-color-text-sub)' : (!isSearchMode && selectedMenu === 'common' ? 'var(--color-primary)' : undefined)"
                >
                  <component :is="CommonGroupIcon" />
                </n-icon>
              </template>
              {{ t('recipe.notebookgroup.common') }}
            </n-tooltip>
          </n-tab>
          <n-tab name="special">
            <n-tooltip placement="top">
              <template #trigger>
                <n-icon
                  :size="18"
                  :color="isCustomListMode ? 'var(--app-color-text-sub)' : (!isSearchMode && selectedMenu === 'special' ? 'var(--color-primary)' : undefined)"
                >
                  <component :is="SpecialGroupIcon" />
                </n-icon>
              </template>
              {{ t('recipe.notebookgroup.special') }}
            </n-tooltip>
          </n-tab>
          <n-tab name="master">
            <n-tooltip placement="top">
              <template #trigger>
                <n-icon
                  :size="18"
                  :color="isCustomListMode ? 'var(--app-color-text-sub)' : (!isSearchMode && selectedMenu === 'master' ? 'var(--color-primary)' : undefined)"
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
            <template v-if="isCustomListMode">
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
                  type="info"
                  :tertiary="selectedCustomListIndex === cl.index"
                  :quaternary="selectedCustomListIndex !== cl.index"
                  class="shrink-0 n-square-button"
                  :title="t('workflow.custom_list.join_list')"
                  @click.stop="handleJoinCustomList(cl)"
                >
                  <template #icon>
                    <n-icon :size="16"><PlaylistAddOutlined /></n-icon>
                  </template>
                </n-button>
              </div>
            </template>
            <template v-else>
              <n-button
                v-for="menu in Object.values(currMenus)"
                :key="menu.id + menu.name"
                size="small"
                :tertiary="!isSearchMode && selectedContentGroup === `i_${menu.id}`"
                :quaternary="isSearchMode || selectedContentGroup !== `i_${menu.id}`"
                class="justify-start"
                @click="handleContentGroupSelect(`i_${menu.id}`)"
              >
                {{ menu.name }}
              </n-button>
            </template>
          </div>
        </n-scrollbar>
      </div>
      <div class="flex-1 pl-2 flex" :style="{ height: menuHeight }">
        <n-scrollbar trigger="none" class="flex-1">
          <template v-if="isSearchMode">
            <div v-for="group in searchResults" :key="group.groupKey" class="flex flex-col gap-1 pr-3 mb-2">
              <div class="sticky top-0 z-10 w-full rounded px-1" style="background-color: var(--color-border);">
                <i class="xiv e032"></i>
                {{ group.groupLabel }}
              </div>
              <div
                v-for="item in group.items"
                :key="item.id"
                class="flex gap-1"
              >
                <n-button
                  :type="selectedItem === item.id ? 'primary' : 'default'"
                  class="flex-1 justify-start px-2! py-1! h-auto!"
                  @click="emit('update:selectedItem', item.id)"
                  @contextmenu="handleNotebookItemContextMenu($event, item)"
                >
                  <ItemCell
                    :item-info="item"
                    :amount="0"
                    show-item-details
                  />
                </n-button>
                <n-button
                  type="info"
                  :ghost="selectedItem !== item.id"
                  class="h-auto!"
                  :title="t('workflow.text.add_item_to_curr_workflow.tip_1') + '\r\n' + t('workflow.text.add_item_to_curr_workflow.tip_2')"
                  @click="emit('add-item', item.id)"
                >
                  <n-icon :size="18"><PlaylistAddOutlined /></n-icon>
                </n-button>
              </div>
            </div>
          </template>
          <template v-else-if="isCustomListMode">
            <div v-if="currCustomList" class="flex flex-col gap-1 pr-3">
              <div class="sticky top-0 z-10 w-full rounded px-1 bg-border">
                <i class="xiv e032"></i>
                {{ currCustomList.name }}
              </div>
              <div
                v-for="itemEntry in currCustomList.items"
                :key="itemEntry.item.id"
                class="flex gap-1"
              >
                <n-button
                  :type="selectedItem === itemEntry.item.id ? 'primary' : 'default'"
                  class="flex-1 justify-start px-2! py-1! h-auto!"
                  @click="emit('update:selectedItem', itemEntry.item.id)"
                  @contextmenu="handleNotebookItemContextMenu($event, itemEntry.item)"
                >
                  <ItemCell
                    :item-info="itemEntry.item"
                    :amount="itemEntry.amount"
                    show-item-details
                  />
                </n-button>
                <n-button
                  type="info"
                  :ghost="selectedItem !== itemEntry.item.id"
                  class="h-auto!"
                  :title="t('workflow.text.add_item_to_curr_workflow.tip_1') + '\r\n' + t('workflow.text.add_item_to_curr_workflow.tip_2')"
                  @click="emit('add-item', itemEntry.item.id)"
                >
                  <n-icon :size="18"><PlaylistAddOutlined /></n-icon>
                </n-button>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="cg in currContentGroups" :key="cg.id" class="flex flex-col gap-1 pr-3">
              <div v-if="cg.name" class="sticky top-0 z-10 w-full rounded px-1 bg-border">
                <i class="xiv e032"></i>
                {{ cg.name }}
              </div>
              <div
                v-for="item in cg.items"
                :key="item.id"
                class="flex gap-1"
              >
                <n-button
                  :type="selectedItem === item.id ? 'primary' : 'default'"
                  class="flex-1 justify-start px-2! py-1! h-auto!"
                  @click="emit('update:selectedItem', item.id)"
                  @contextmenu="handleNotebookItemContextMenu($event, item)"
                >
                  <ItemCell
                    :item-info="item"
                    :amount="0"
                    show-item-details
                  />
                </n-button>
                <n-button
                  type="info"
                  :ghost="selectedItem !== item.id"
                  class="h-auto!"
                  :title="t('workflow.text.add_item_to_curr_workflow.tip_1') + '\r\n' + t('workflow.text.add_item_to_curr_workflow.tip_2')"
                  @click="emit('add-item', item.id)"
                >
                  <n-icon :size="18"><PlaylistAddOutlined /></n-icon>
                </n-button>
              </div>
            </div>
          </template>
        </n-scrollbar>
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
          <n-card
            v-if="currSelectedItem"
            size="small"
            :bordered="false"
            class="h-full"
            content-class="h-full flex flex-col"
          >
            <div class="flex items-baseline">
              <ItemInfoHeader :item-info="currSelectedItem" class="flex-1 mt-0!" />
            </div>
            <div class="h-1" />
            <div class="flex flex-wrap items-center gap-x-2 text-xs">
              <div class="flex-1">
                {{ t('item.text.recipe_detail', {
                  dur: currSelectedItem.craftInfo?.durability,
                  pro: currSelectedItem.craftInfo?.progress,
                  qua: currSelectedItem.craftInfo?.quality
                }) }}
              </div>
              <div v-if="(currSelectedItem.craftInfo?.yields || 1) > 1" class="color-success">
                {{ t('item.text.yields_info', currSelectedItem.craftInfo?.yields) }}
              </div>
              <div v-if="!currSelectedItem.craftInfo?.qsable" class="color-error">{{ t('item.text.cannot_quick_synthesis') }}</div>
              <div v-if="!currSelectedItem.craftInfo?.hqable" class="color-error">{{ t('item.text.cannot_hq') }}</div>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 text-xs">
              <div v-if="currSelectedItem.craftInfo?.thresholds?.craftsmanship">
                {{ t('recipe.text.craftsmanship_needs', [currSelectedItem.craftInfo?.thresholds?.craftsmanship]) }}
              </div>
              <div v-if="currSelectedItem.craftInfo?.thresholds?.control">
                {{ t('recipe.text.control_needs', [currSelectedItem.craftInfo?.thresholds?.control]) }}
              </div>
            </div>
            <div v-if="currSelectedItem.craftInfo?.masterRecipeId" class="flex items-center justify-end gap-0.5 text-xs">
              {{ t('item.text.need_learn') }}
              <ItemSpan span-max-width="180px" :img-size="12" :item-info="getItemInfo(currSelectedItem.craftInfo.masterRecipeId)" class="gap-0.5!" />
            </div>
            <n-divider class="my-1!" />
            <div class="font-bold">配方需求</div>
            <n-scrollbar class="ml-1 flex-1">
              <ItemRecipeTree :level="0" :item="currSelectedItem" :amount="1" />
            </n-scrollbar>
            <n-divider class="my-1!" />
            <div class="flex justify-end gap-2">
              <n-button @click="simulateCraftCurrSelectedItem">
                <template #icon>
                  <n-icon :size="18"><OpenInNewFilled /></n-icon>
                </template>
                {{ t('common.simulate_craft') }}
              </n-button>
              <TooltipButton
                type="info"
                :ghost="selectedItem !== currSelectedItem.id"
                :tip="[t('workflow.text.add_item_to_curr_workflow.tip_1'), t('workflow.text.add_item_to_curr_workflow.tip_2')]"
                @click="emit('add-item', currSelectedItem.id)"
              >
                <template #icon>
                  <n-icon :size="18"><PlaylistAddOutlined /></n-icon>
                </template>
                {{ t('workflow.text.join_in_workflow') }}
              </TooltipButton>
            </div>
          </n-card>
          <div v-else class="h-full flex items-center justify-center">
            <n-empty>
              {{ t('workflow.text.notebook_item_not_selected') }}
            </n-empty>
          </div>
        </div>
      </div>
    </div>

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
                class="flex-1 text-sm truncate cursor-pointer select-none"
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
.search-input-group {
  max-width: 458px;
}
@media screen and (max-width: 767px) {
  .search-input-group {
    width: 100%;
    max-width: 100%;
  }
}
</style>
