import { ref } from 'vue'
import type { ItemInfo } from '@/tools/item'
import type { MacroGenerateMode } from '@/types/config/func'
import { useStore } from '@/store'
import { CopyToClipboard } from '@/tools'
import { useLocale } from './useLocale'
import { useDialog } from './useDialog'

const showCopyMacroModal = ref(false)
const macroMapValue = ref<Record<MacroGenerateMode, string>>({
  singleLine: '', multiLine: ''
})

const showModalJoinInWorkflow = ref(false)
const itemsToJoinInWorkflow = ref<Record<number, number>>({})

const showCheckUpdatesModal = ref(false)

const loginAction = ref<"login" | "register" | "edituser">('login')
const showModalLogin = ref(false)

const showModalCloudSync = ref(false)

const showModalItemPriceDetail = ref(false)
const modalItemPriceDetailItems = ref<ItemInfo[]>([])

export function useAppModals() {
  const store = useStore()
  const { t } = useLocale()
  const { alertError } = useDialog()

  const copyAsMacro = async (
    macroMap: Record<MacroGenerateMode, string>,
    container?: HTMLElement | undefined
  ): Promise<{ result: "success" | "info" | "error"; msg: string } | undefined> => {
    const funcConfig = store.funcConfig
    let macroContent = macroMap[funcConfig.macro_generate_mode]
    if (!macroContent) {
      return { result: 'info', msg: t('common.message.nothing_to_copy') }
    }
    macroContent = macroContent.split('\r\n').map(line => `${funcConfig.macro_copy_prefix}${line}`).join('\r\n')
    if (funcConfig.macro_direct_copy) {
      const errored = await CopyToClipboard(macroContent, container)
      if (errored) {
        return { result: 'error', msg: t('common.message.copy_failed') }
      }
      return { result: 'success', msg: t('common.message.copy_succeed') }
    } else {
      macroMapValue.value = macroMap
      showCopyMacroModal.value = true
    }
  }

  const joinItemsToWorkflow = (items: Record<number, number>) => {
    itemsToJoinInWorkflow.value = items
    showModalJoinInWorkflow.value = true
  }

  const displayCheckUpdatesModal = () => {
    showCheckUpdatesModal.value = true
  }

  const displayLoginModal = (action: "login" | "register" | "edituser" = 'login') => {
    loginAction.value = action
    showModalLogin.value = true
  }

  const displayCloudSyncModal = () => {
    showModalCloudSync.value = true
  }

  const showItemPriceDetail = (items: ItemInfo[]) => {
    if (showModalItemPriceDetail.value) {
      alertError(t('common.message.cannot_open_same_modal'))
      return
    }
    modalItemPriceDetailItems.value = items
    showModalItemPriceDetail.value = true
  }

  return {
    showCopyMacroModal,
    macroMapValue,
    copyAsMacro,

    showModalJoinInWorkflow,
    itemsToJoinInWorkflow,
    joinItemsToWorkflow,

    showCheckUpdatesModal,
    displayCheckUpdatesModal,

    loginAction,
    showModalLogin,
    displayLoginModal,

    showModalCloudSync,
    displayCloudSyncModal,

    showModalItemPriceDetail,
    modalItemPriceDetailItems,
    showItemPriceDetail,
  }
}

export default useAppModals
