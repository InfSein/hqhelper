import { ref, computed, nextTick, inject } from 'vue'
import { useMessage } from 'naive-ui'
import {
  FileCopyOutlined,
  OpenInNewFilled,
  JoinLeftOutlined,
  PlaylistAddOutlined,
  SearchRound,
  StarRound,
  StarBorderRound,
  AccessAlarmsOutlined,
  NotificationsRound,
  NotificationsNoneRound,
} from '@vicons/material'
import { CopyToClipboard } from '@/tools'
import { getItemInfo } from '@/tools/item'
import type { ItemInfo } from '@/types/item'
import {
  _VAR_GATHERCLOCK_MAX_STARRED,
  _VAR_GATHERCLOCK_MAX_SUBSCRIBED,
  fixWorkState as fixGatherClockWorkState,
} from '@/types/workstate/gatherclock'
import useConfig from '@/composables/useConfig'
import useUiTools from './useUiTools'
import { useLocale } from './useLocale'
import { useAppModals } from './useAppModals'
import { useStore } from '@/store'
import { addToCurrentWorkflowKey, reverseRecipeLookupKey } from '@/constants/vue-injects'

export function useItemContextMenu(
  getItem: () => ItemInfo,
  containerId?: string | (() => string | undefined)
) {
  const { t } = useLocale()
  const { joinItemsToWorkflow } = useAppModals()
  const addToCurrentWorkflow = inject(addToCurrentWorkflowKey, undefined)
  const reverseRecipeLookup = inject(reverseRecipeLookupKey, undefined)

  const NAIVE_UI_MESSAGE = useMessage()
  const { itemLanguage } = useConfig()
  const { renderIcon } = useUiTools()
  const store = useStore()
  const route = useRoute()
  const router = useRouter()

  const showDropdown = ref(false)
  const dropdownX = ref(0)
  const dropdownY = ref(0)

  const isGatherClockItem = computed(() => {
    const itemInfo = getItem()
    if (!itemInfo?.id) return false
    if (itemInfo.gatherInfo?.timeLimitInfo?.length) return true
    const fullItem = getItemInfo(itemInfo.id)
    return !!fullItem?.gatherInfo?.timeLimitInfo?.length
  })

  const getItemDisplayName = (item: ItemInfo) => {
    return item[`name_${itemLanguage.value}`] || item.name_zh || item.name_ja || item.name_en || ''
  }

  const toggleGatherClockStar = (itemId: number) => {
    if (!store.userConfig.gatherclock_cache_work_state) {
      store.userConfig.gatherclock_cache_work_state = fixGatherClockWorkState()
    }
    const gcState = store.userConfig.gatherclock_cache_work_state
    if (!gcState.starItems) gcState.starItems = []
    const idx = gcState.starItems.indexOf(itemId)
    const currentItem = getItem()
    if (idx >= 0) {
      gcState.starItems.splice(idx, 1)
      NAIVE_UI_MESSAGE.success(t('gather_clock.message.unstarred', { name: getItemDisplayName(currentItem) }))
    } else {
      if (gcState.starItems.length >= _VAR_GATHERCLOCK_MAX_STARRED) {
        NAIVE_UI_MESSAGE.warning(t('gather_clock.message.star_limit_reached', { max: _VAR_GATHERCLOCK_MAX_STARRED }))
        return
      }
      gcState.starItems.push(itemId)
      NAIVE_UI_MESSAGE.success(t('gather_clock.message.starred', { name: getItemDisplayName(currentItem) }))
    }
    store.updateUserConfig()
  }

  const toggleGatherClockSubscribe = (itemId: number) => {
    if (!store.userConfig.gatherclock_cache_work_state) {
      store.userConfig.gatherclock_cache_work_state = fixGatherClockWorkState()
    }
    const gcState = store.userConfig.gatherclock_cache_work_state
    if (!gcState.subscribedItems) gcState.subscribedItems = []
    const idx = gcState.subscribedItems.indexOf(itemId)
    const currentItem = getItem()
    if (idx >= 0) {
      gcState.subscribedItems.splice(idx, 1)
      NAIVE_UI_MESSAGE.success(t('gather_clock.message.unsubscribed', { name: getItemDisplayName(currentItem) }))
    } else {
      if (gcState.subscribedItems.length >= _VAR_GATHERCLOCK_MAX_SUBSCRIBED) {
        NAIVE_UI_MESSAGE.warning(t('gather_clock.message.subscribe_limit_reached', { max: _VAR_GATHERCLOCK_MAX_SUBSCRIBED }))
        return
      }
      gcState.subscribedItems.push(itemId)
      NAIVE_UI_MESSAGE.success(t('gather_clock.message.subscribed', { name: getItemDisplayName(currentItem) }))
    }
    store.updateUserConfig()
  }

  const dropdownOptions = computed(() => {
    const itemInfo = getItem()
    if (!itemInfo.id) return []
    const options = [
      {
        label: t('common.copy_item_name'),
        key: 'copy-item-name',
        icon: renderIcon(FileCopyOutlined),
        click: () => {
          const copyContent = itemInfo[`name_${itemLanguage.value}`]
          handleCopy(copyContent, t('common.message.copied_with_content', copyContent))
        }
      },
      {
        label: t('item.text.context_title.copy'),
        key: 'copy-other-names',
        children: [
          {
            label: t('common.copy_item_zh_name'),
            key: 'copy-zh',
            show: itemLanguage.value !== 'zh',
            click: () => handleCopy(itemInfo.name_zh)
          },
          {
            label: t('common.copy_item_ja_name'),
            key: 'copy-ja',
            show: itemLanguage.value !== 'ja',
            click: () => handleCopy(itemInfo.name_ja)
          },
          {
            label: t('common.copy_item_en_name'),
            key: 'copy-en',
            show: itemLanguage.value !== 'en',
            click: () => handleCopy(itemInfo.name_en)
          },
          {
            label: t('preference.shared.option.copy_isearch_macro'),
            key: 'copy-isearch-macro',
            click: () => {
              const name = itemInfo[`name_${itemLanguage.value}`]
              const copyContent = `/isearch "${name}"`
              handleCopy(copyContent, t('common.message.copied_with_content', copyContent))
            }
          },
        ]
      },
      {
        type: 'divider',
        key: 'd-star',
        show: !!itemInfo?.craftInfo?.recipeId || (!!reverseRecipeLookup && itemInfo.id >= 100),
      },
      {
        label: store.userConfig.notebook_starred_recipes.includes(itemInfo.id)
          ? t('workflow.notebook_starred.unstar_recipe')
          : t('workflow.notebook_starred.star_recipe'),
        key: 'toggle-star-recipe',
        show: !!itemInfo?.craftInfo?.recipeId,
        icon: renderIcon(
          store.userConfig.notebook_starred_recipes.includes(itemInfo.id)
            ? StarRound
            : StarBorderRound
        ),
        click: () => {
          const starredList = store.userConfig.notebook_starred_recipes
          const idx = starredList.indexOf(itemInfo.id)
          if (idx >= 0) {
            starredList.splice(idx, 1)
          } else {
            if (starredList.length >= 100) {
              NAIVE_UI_MESSAGE.warning(t('workflow.notebook_starred.max_reached', { max: 100 }))
              return
            }
            starredList.push(itemInfo.id)
          }
          store.updateUserConfig()
        }
      },
      {
        label: t('item.text.reverse_recipe_lookup'),
        key: 'reverse-recipe-lookup',
        show: !!reverseRecipeLookup && itemInfo.id >= 100,
        icon: renderIcon(SearchRound),
        click: () => {
          reverseRecipeLookup?.(itemInfo)
        }
      },
      {
        type: 'divider',
        key: 'd-gatherclock',
        show: isGatherClockItem.value,
      },
      {
        label: t('common.appfunc.gather_clock'),
        key: 'gather-clock-group',
        show: isGatherClockItem.value,
        icon: renderIcon(AccessAlarmsOutlined),
        children: [
          {
            label: store.userConfig.gatherclock_cache_work_state?.starItems?.includes(itemInfo.id)
              ? t('gather_clock.text.un_star')
              : t('gather_clock.text.star'),
            key: 'toggle-gatherclock-star',
            icon: renderIcon(
              store.userConfig.gatherclock_cache_work_state?.starItems?.includes(itemInfo.id)
                ? StarRound
                : StarBorderRound
            ),
            click: () => toggleGatherClockStar(itemInfo.id),
          },
          {
            label: store.userConfig.gatherclock_cache_work_state?.subscribedItems?.includes(itemInfo.id)
              ? t('gather_clock.text.unsubscribe')
              : t('gather_clock.text.subscribe'),
            key: 'toggle-gatherclock-subscribe',
            icon: renderIcon(
              store.userConfig.gatherclock_cache_work_state?.subscribedItems?.includes(itemInfo.id)
                ? NotificationsRound
                : NotificationsNoneRound
            ),
            click: () => toggleGatherClockSubscribe(itemInfo.id),
          },
          {
            label: t('gather_clock.text.view_in_gather_clock'),
            key: 'view-in-gatherclock',
            show: route?.path !== '/gatherclock',
            icon: renderIcon(OpenInNewFilled),
            click: () => {
              router.push({
                path: '/gatherclock',
                query: { item: String(itemInfo.id) },
              })
            },
          },
        ],
      },
      {
        type: 'divider',
        key: 'd1',
        show: !!itemInfo?.craftInfo?.recipeId
      },
      {
        label: t('workflow.text.join_in_workflow'),
        key: 'join-to-workflow',
        show: !!itemInfo?.craftInfo?.recipeId,
        icon: renderIcon(JoinLeftOutlined),
        click: () => {
          joinItemsToWorkflow({
            [itemInfo.id]: 1,
          })
        }
      },
      {
        label: t('workflow.text.join_in_curr_workflow'),
        key: 'join-to-curr-workflow',
        show: !!addToCurrentWorkflow && !!itemInfo?.craftInfo?.recipeId,
        icon: renderIcon(PlaylistAddOutlined),
        click: () => {
          addToCurrentWorkflow?.(itemInfo.id)
        }
      },
      {
        type: 'divider',
        key: 'd3'
      },
      {
        label: t('common.open_in.huijiwiki2'),
        key: 'open-in-hjwiki',
        icon: renderIcon(OpenInNewFilled),
        click: () => {
          window.open(`https://ff14.huijiwiki.com/wiki/物品:${itemInfo.name_zh}`)
        }
      },
      {
        label: t('item.text.context_title.openin'),
        key: 'openin-group',
        children: [
          {
            label: t('common.open_in.garland2'),
            key: 'open-in-garland',
            click: () => {
              const domain = itemLanguage.value === 'zh' ? 'garlandtools.cn' : 'www.garlandtools.org'
              window.open(`https://${domain}/db/#item/${itemInfo.id}`)
            }
          },
          {
            label: t('common.open_in.gamer_escape'),
            key: 'open-in-gamerescape',
            click: () => {
              window.open(`https://ffxiv.gamerescape.com/wiki/${itemInfo.name_en.replace(' ', '_')}`)
            }
          },
          {
            label: t('common.open_in.universalis'),
            key: 'open-in-universalis',
            click: () => {
              window.open(`https://universalis.app/market/${itemInfo.id}`)
            }
          },
          {
            type: 'divider',
            key: 'openin-group__d1',
            show: !!itemInfo?.craftInfo?.recipeId
          },
          {
            label: t('item.text.simulate_craft_bestcraft'),
            key: 'open-in-bestcraft',
            show: !!itemInfo?.craftInfo?.recipeId,
            click: () => {
              window.open(`https://tnze.yyyy.games/#/recipe?recipeId=${itemInfo?.craftInfo?.recipeId}`)
            }
          },
          {
            label: t('item.text.simulate_craft_teamcraft'),
            key: 'open-in-teamcraft',
            show: !!itemInfo?.craftInfo?.recipeId,
            click: () => {
              window.open(`https://ffxivteamcraft.com/simulator/${itemInfo.id}/${itemInfo?.craftInfo?.recipeId}`)
            }
          },
        ]
      },
    ]
    return options
  })

  const handleCopy = async (content: string, successMessage?: string) => {
    const id = typeof containerId === 'function' ? containerId() : containerId
    const container = id ? document.getElementById(id) : undefined
    const error = await CopyToClipboard(content, container)
    if (error) {
      NAIVE_UI_MESSAGE.error(t('common.message.copy_failed_unexpected_error'))
    } else {
      NAIVE_UI_MESSAGE.success(successMessage ?? t('common.message.copy_succeed'))
    }
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    showDropdown.value = false
    nextTick(() => {
      showDropdown.value = true
      dropdownX.value = e.clientX
      dropdownY.value = e.clientY
    })
  }
  const handleSelect = (_key: string | number, option: any) => {
    showDropdown.value = false
    option?.click?.()
  }
  const onClickOutside = () => {
    showDropdown.value = false
  }

  // #region 移动端长按
  let touchTimer: ReturnType<typeof setTimeout> | undefined
  const handleTouchStart = (e: TouchEvent) => {
    touchTimer = setTimeout(() => {
      const touch = e.touches?.[0]
      if (touch) {
        dropdownX.value = touch.clientX
        dropdownY.value = touch.clientY
        showDropdown.value = true
      } else {
        console.error('[useItemContextMenu] No touches found in touchstart event:', e)
      }
    }, 500)
  }
  const handleTouchMove = () => {
    clearTimeout(touchTimer)
    touchTimer = undefined
  }
  const handleTouchEnd = () => {
    clearTimeout(touchTimer)
    touchTimer = undefined
  }
  // #endregion

  return {
    showDropdown,
    dropdownX,
    dropdownY,
    dropdownOptions,
    handleCopy,
    handleContextMenu,
    handleSelect,
    onClickOutside,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
