import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

export type AppMode = "overlay" | "" | undefined

const appMode = ref<AppMode>('')

export function useAppMode() {
  const route = useRoute()

  watch(
    () => route?.query?.mode,
    (newMode) => {
      appMode.value = newMode as AppMode
    },
    { immediate: true }
  )

  const isOverlay = computed(() => appMode.value === 'overlay')

  return {
    appMode,
    isOverlay,
  }
}

export default useAppMode
