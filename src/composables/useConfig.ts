import { useStore } from "@/store"

/** 获取与用户配置相关的计算属性 */
const useConfig = () => {
  const store = useStore()

  /** 界面语言 */
  const uiLanguage = computed(() => {
    return store.userConfig.language_ui
  })
  /** 物品语言 */
  const itemLanguage = computed(() => {
    if (store.userConfig.language_item !== 'auto') {
      return store.userConfig.language_item
    }
    return store.userConfig.language_ui
  })

  return {
    /** 界面语言 */
    uiLanguage,
    /** 物品语言 */
    itemLanguage,
  }
}

export default useConfig