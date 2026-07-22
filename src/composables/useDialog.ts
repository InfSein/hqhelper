import type { VNodeChild } from "vue"
import type DialogComponent from "@/components/app/Dialog.vue"
import type { InternalDialogOptions } from "@/components/app/Dialog.vue"
type DialogProvider = InstanceType<typeof DialogComponent>

type DialogType = "error" | "success" | "warning" | "info"
export interface DialogOptions {
  title?: string | (() => VNodeChild)
  content?: string | (() => VNodeChild)
  type?: DialogType
  closable?: boolean
}

let dialogProvider : DialogProvider | null = null
export function registerDialogProvider(instance: DialogProvider) {
  dialogProvider = instance
}

export const useDialog = (_t?: (message: string, args?: any) => string) => {
  const t = _t || inject<(message: string, args?: any) => string>('t')!

  const buildDialogOptions = (
    input: string | DialogOptions,
    defaultTitle: string,
    defaultType: DialogType,
  ): Omit<InternalDialogOptions, "id"> => {
    if (typeof input === "string") {
      return {
        title: defaultTitle,
        content: input,
        type: defaultType,
        closable: false,
      }
    } else {
      return {
        title: input.title || defaultTitle,
        content: input.content || '',
        type: input.type || defaultType,
        closable: input.closable ?? false,
      }
    }
  }

  const alert = (input: string | DialogOptions) : Promise<void> => {
    const options = buildDialogOptions(input, t('common.warn'), 'warning')
    return new Promise((resolve, reject) => {
      if (!dialogProvider) {
        reject(new Error("Dialog provider is not registered"))
        return
      }
      dialogProvider.openDialog({
        ...options,
        positiveText: t('common.confirm'),
        onPositiveClick: () => resolve(),
      })
    })
  }
  const alertInfo = (input: string | DialogOptions) : Promise<void> => {
    const options = buildDialogOptions(input, t('common.tip'), 'info')
    return new Promise((resolve, reject) => {
      if (!dialogProvider) {
        reject(new Error("Dialog provider is not registered"))
        return
      }
      dialogProvider.openDialog({
        ...options,
        positiveText: t('common.confirm'),
        onPositiveClick: () => resolve(),
      })
    })
  }
  const alertError = (input: string | DialogOptions) : Promise<void> => {
    const options = buildDialogOptions(input, t('common.error'), 'error')
    return new Promise((resolve, reject) => {
      if (!dialogProvider) {
        reject(new Error("Dialog provider is not registered"))
        return
      }
      dialogProvider.openDialog({
        ...options,
        positiveText: t('common.confirm'),
        onPositiveClick: () => resolve(),
      })
    })
  }

  const confirm = (input: string | DialogOptions): Promise<boolean> => {
    const options = buildDialogOptions(input, t('common.tip'), 'info')
    return new Promise((resolve, reject) => {
      if (!dialogProvider) {
        reject(new Error("Dialog provider is not registered"))
        return
      }
      dialogProvider.openDialog({
        ...options,
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
      })
    })
  }
  const confirmWarning = (input: string | DialogOptions): Promise<boolean> => {
    const options = buildDialogOptions(input, t('common.warn'), 'warning')
    return new Promise((resolve, reject) => {
      if (!dialogProvider) {
        reject(new Error("Dialog provider is not registered"))
        return
      }
      dialogProvider.openDialog({
        ...options,
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
      })
    })
  }

  return {
    alert,
    alertInfo,
    alertError,
    confirm,
    confirmWarning,
  }
}
