import { ref, computed, nextTick, inject } from 'vue'
import { useMessage } from 'naive-ui'
import { CopyToClipboard } from '@/tools'
import { getItemContexts, type ItemInfo } from '@/tools/item'
import useConfig from '@/composables/useConfig.ts'

export function useItemContextMenu(
  getItemInfo: () => ItemInfo,
  containerId?: string | (() => string | undefined)
) {
  const {
    itemLanguage,
  } = useConfig()
  const NAIVE_UI_MESSAGE = useMessage()
  const t = inject<(message: string, args?: any) => string>('t')!
  const joinItemsToWorkflow = inject<(items: Record<number, number>) => void>('joinItemsToWorkflow')!

  const showDropdown = ref(false)
  const dropdownX = ref(0)
  const dropdownY = ref(0)

  const dropdownOptions = computed(() =>
    getItemContexts(
      getItemInfo(),
      itemLanguage.value,
      t,
      handleCopy,
      joinItemsToWorkflow
    ).options
  )

  const handleCopy = async (content: string, successMessage?: string) => {
    const id = typeof containerId === 'function' ? containerId() : containerId
    const container = id ? document.getElementById(id) ?? undefined : undefined
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
