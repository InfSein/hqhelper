import { ref, computed, nextTick, inject } from 'vue'
import { useMessage } from 'naive-ui'
import { CopyToClipboard } from '@/tools'
import { getItemContexts, type ItemInfo } from '@/tools/item'

/**
 * 封装道具右键菜单的通用逻辑。
 *
 * @param getItemInfo       获取当前 ItemInfo 的 getter（响应式追踪）
 * @param getItemLanguage   获取当前物品语言的 getter
 * @param t                 i18n 翻译函数
 * @param containerId       复制时用到的容器 ID（可选，字符串或 getter）
 */
export function useItemContextMenu(
  getItemInfo: () => ItemInfo,
  getItemLanguage: () => string,
  t: (message: string, args?: any) => string,
  containerId?: string | (() => string | undefined)
) {
  const NAIVE_UI_MESSAGE = useMessage()
  const joinItemsToWorkflow = inject<(items: Record<number, number>) => void>('joinItemsToWorkflow')!

  // ------------------------------------------------------------------ //
  //  Dropdown 状态
  // ------------------------------------------------------------------ //

  const showDropdown = ref(false)
  const dropdownX = ref(0)
  const dropdownY = ref(0)

  // ------------------------------------------------------------------ //
  //  复制
  // ------------------------------------------------------------------ //

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

  // ------------------------------------------------------------------ //
  //  菜单选项（computed 保证随 itemInfo / itemLanguage 变化而更新）
  // ------------------------------------------------------------------ //

  const dropdownOptions = computed(() =>
    getItemContexts(
      getItemInfo(),
      getItemLanguage() as 'zh' | 'en' | 'ja',
      t,
      handleCopy,
      joinItemsToWorkflow
    ).options
  )

  // ------------------------------------------------------------------ //
  //  事件处理器
  // ------------------------------------------------------------------ //

  /** 鼠标右键 */
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    showDropdown.value = false
    nextTick(() => {
      showDropdown.value = true
      dropdownX.value = e.clientX
      dropdownY.value = e.clientY
    })
  }

  /** 菜单项选中 — 所有选项均通过 option.click() 执行 */
  const handleSelect = (_key: string | number, option: any) => {
    showDropdown.value = false
    option?.click?.()
  }

  /** 点击菜单外部时关闭 */
  const onClickOutside = () => {
    showDropdown.value = false
  }

  // ------------------------------------------------------------------ //
  //  移动端长按（仅在移动端触发，无需担心桌面端兼容性）
  // ------------------------------------------------------------------ //

  let touchTimer: ReturnType<typeof setTimeout> | undefined

  /** 长按 500ms 后弹出菜单 */
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

  /** 触摸移动时取消长按计时 */
  const handleTouchMove = () => {
    clearTimeout(touchTimer)
    touchTimer = undefined
  }

  /** 触摸结束时取消长按计时 */
  const handleTouchEnd = () => {
    clearTimeout(touchTimer)
    touchTimer = undefined
  }

  // ------------------------------------------------------------------ //
  //  对外暴露
  // ------------------------------------------------------------------ //

  return {
    // 状态（供 <n-dropdown> 绑定）
    showDropdown,
    dropdownX,
    dropdownY,
    dropdownOptions,
    // 复制（可供组件自身的点击事件复用）
    handleCopy,
    // 事件处理器
    handleContextMenu,
    handleSelect,
    onClickOutside,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
