import { useStore } from "@/store"
import { useOsTheme } from "naive-ui"

/** 获取与用户配置相关的计算属性 */
const useConfig = () => {
  const store = useStore()

  // #region Language

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

  // #endregion

  // #region Theme
  const osTheme = useOsTheme()
  
  /** 主题 */
  const theme = computed(() => {
    const _theme = store.userConfig.theme
    if (_theme === 'system') {
      return osTheme.value === 'dark' ? 'dark' : 'light'
    }
    return _theme
  })

  /** 切换主题 */
  const switchTheme = () => {
    store.userConfig.theme = theme.value === 'light' ? 'dark' : 'light'
    store.updateUserConfig()
  }

  // #endregion

  return {
    /** 界面语言 */
    uiLanguage,
    /** 物品语言 */
    itemLanguage,
    /** 主题 */
    theme,
    /** 切换主题 */
    switchTheme,
  }
}

export default useConfig