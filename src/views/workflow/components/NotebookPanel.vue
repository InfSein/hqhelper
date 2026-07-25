<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  OpenInNewFilled,
  PlaylistAddOutlined,
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
import { useItemContextMenu } from '@/composables/useItemContextMenu'
import CommonGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-common.svg'
import MasterGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-master.svg'
import SpecialGroupIcon from '@/assets/icons/game-ui/recipe-notebook/group-special.svg'
import { XivJobs, XivSrbMap, XivUnpackedRecipes } from '@/assets/data'
import { sortRecord } from '@/tools'
import { getItemInfo, sortItems, type ItemInfo } from '@/tools/item'

const { t } = useLocale()
const { isMobile } = useResponsive()
const { itemLanguage } = useConfig()

const props = defineProps<{
  selectedJob: number
  selectedMenu: 'common' | 'special' | 'master'
  selectedContentGroup: `i_${number}`
  selectedItem: number
  menuHeight: string
}>()

const emit = defineEmits<{
  'update:selectedJob': [value: number]
  'update:selectedMenu': [value: 'common' | 'special' | 'master']
  'update:selectedContentGroup': [value: `i_${number}`]
  'update:selectedItem': [value: number]
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
      <span class="card-title-text">{{ t('recipe.notebook') }}</span>
    </template>
    <div class="flex flex-wrap items-center gap-1.5">
      <n-button
        v-for="job in Object.keys(notebookGroups)"
        :key="job"
        class="p-px w-9! h-9!"
        :type="selectedJob === Number(job) ? 'primary' : 'default'"
        @click="emit('update:selectedJob', Number(job))"
      >
        <XivFARImage
          :src="XivJobs[Number(job)].job_icon_url"
          :size="32"
        />
      </n-button>
    </div>
    <n-divider class="my-2!" />
    <div class="w-full flex">
      <div class="w-48 flex flex-col pr-2" :style="{ height: menuHeight, borderRight: '1px solid var(--color-border)' }">
        <n-tabs
          :value="selectedMenu"
          type="segment" animated
          class="mb-2"
          @update:value="(val) => emit('update:selectedMenu', val)"
        >
          <n-tab name="common">
            <n-tooltip placement="top">
              <template #trigger>
                <n-icon
                  :size="18"
                  :color="selectedMenu === 'common' ? 'var(--color-primary)' : undefined"
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
                  :color="selectedMenu === 'special' ? 'var(--color-primary)' : undefined"
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
                  :color="selectedMenu === 'master' ? 'var(--color-primary)' : undefined"
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
            <n-button
              v-for="menu in Object.values(currMenus)"
              :key="menu.id + menu.name"
              size="small"
              :tertiary="selectedContentGroup === `i_${menu.id}`"
              :quaternary="selectedContentGroup !== `i_${menu.id}`"
              class="justify-start"
              @click="emit('update:selectedContentGroup', `i_${menu.id}`)"
            >
              {{ menu.name }}
            </n-button>
          </div>
        </n-scrollbar>
      </div>
      <div class="flex-1 pl-2 flex" :style="{ height: menuHeight }">
        <n-scrollbar trigger="none" class="flex-1">
          <div v-for="cg in currContentGroups" :key="cg.id" class="flex flex-col gap-1 pr-3">
            <div v-if="cg.name" class="sticky top-0 z-10 w-full rounded px-1" style="background-color: var(--color-border);">
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
  </FoldableCard>
</template>
