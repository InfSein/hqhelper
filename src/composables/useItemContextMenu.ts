import { ref, computed, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import {
  FileCopyOutlined,
  LanguageOutlined,
  OpenInNewFilled,
  JoinLeftOutlined,
} from '@vicons/material'
import { CopyToClipboard } from '@/tools'
import { type ItemInfo } from '@/tools/item'
import useConfig from '@/composables/useConfig.ts'
import useUiTools from './useUiTools'
import { useLocale } from './useLocale'
import { useAppModals } from './useAppModals'

export function useItemContextMenu(
  getItemInfo: () => ItemInfo,
  containerId?: string | (() => string | undefined)
) {
  const { t } = useLocale()
  const { joinItemsToWorkflow } = useAppModals()

  const NAIVE_UI_MESSAGE = useMessage()
  const { itemLanguage } = useConfig()
  const { renderIcon } = useUiTools()

  const showDropdown = ref(false)
  const dropdownX = ref(0)
  const dropdownY = ref(0)

  const dropdownOptions = computed(() => {
    const itemInfo = getItemInfo()
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
        label: t('item.text.copy_other_names'),
        key: 'copy-other-names',
        icon: renderIcon(FileCopyOutlined),
        children: [
          {
            label: t('common.name_zh'),
            key: 'copy-zh',
            show: itemLanguage.value !== 'zh',
            icon: renderIcon(LanguageOutlined),
            click: () => handleCopy(itemInfo.name_zh)
          },
          {
            label: t('common.name_ja'),
            key: 'copy-ja',
            show: itemLanguage.value !== 'ja',
            icon: renderIcon(LanguageOutlined),
            click: () => handleCopy(itemInfo.name_ja)
          },
          {
            label: t('common.name_en'),
            key: 'copy-en',
            show: itemLanguage.value !== 'en',
            icon: renderIcon(LanguageOutlined),
            click: () => handleCopy(itemInfo.name_en)
          }
        ]
      },
      {
        label: t('preference.shared.option.copy_isearch_macro'),
        key: 'copy-isearch-macro',
        icon: renderIcon(FileCopyOutlined),
        click: () => {
          const name = itemInfo[`name_${itemLanguage.value}`]
          const copyContent = `/isearch "${name}"`
          handleCopy(copyContent, t('common.message.copied_with_content', copyContent))
        }
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
        type: 'divider',
        key: 'd2'
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
        label: t('common.open_in.garland2'),
        key: 'open-in-garland',
        icon: renderIcon(OpenInNewFilled),
        click: () => {
          const domain = itemLanguage.value === 'zh' ? 'garlandtools.cn' : 'www.garlandtools.org'
          window.open(`https://${domain}/db/#item/${itemInfo.id}`)
        }
      },
      {
        label: t('common.open_in.gamer_escape'),
        key: 'open-in-gamerescape',
        icon: renderIcon(OpenInNewFilled),
        click: () => {
          window.open(`https://ffxiv.gamerescape.com/wiki/${itemInfo.name_en.replace(' ', '_')}`)
        }
      },
      {
        label: t('common.open_in.universalis'),
        key: 'open-in-universalis',
        icon: renderIcon(OpenInNewFilled),
        click: () => {
          window.open(`https://universalis.app/market/${itemInfo.id}`)
        }
      },
      {
        type: 'divider',
        key: 'd3',
        show: !!itemInfo?.craftInfo?.recipeId
      },
      {
        label: t('item.text.simulate_craft_bestcraft'),
        key: 'open-in-bestcraft',
        show: !!itemInfo?.craftInfo?.recipeId,
        icon: renderIcon(OpenInNewFilled),
        click: () => {
          window.open(`https://tnze.yyyy.games/#/recipe?recipeId=${itemInfo?.craftInfo?.recipeId}`)
        }
      },
      {
        label: t('item.text.simulate_craft_teamcraft'),
        key: 'open-in-teamcraft',
        show: !!itemInfo?.craftInfo?.recipeId,
        icon: renderIcon(OpenInNewFilled),
        click: () => {
          window.open(`https://ffxivteamcraft.com/simulator/${itemInfo.id}/${itemInfo?.craftInfo?.recipeId}`)
        }
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
