import { ref, computed, watch } from 'vue'
import { useStore } from '@/store'
import { useElectronSync } from '@/composables/electron-sync'
import { fixWorkState, type WorkState } from '@/types/workstate/workflow'
import { deepCopy } from '@/tools'
import type { UserConfigModel } from '@/types/config/user'

export function useWorkflowState() {
  const store = useStore()
  const { emitSync, onSync } = useElectronSync()

  const workState = ref<WorkState>(fixWorkState())

  const currentWorkflow = computed(() => {
    return workState.value.workflows[workState.value.currentWorkflow]
  })

  const ignoreNextUpdate = ref(false)
  const disable_workstate_cache = store.userConfig.disable_workstate_cache ?? false

  if (!disable_workstate_cache) {
    const cachedWorkState = store.userConfig.workflow_cache_work_state
    if (cachedWorkState && JSON.stringify(cachedWorkState).length > 2) {
      workState.value = fixWorkState(cachedWorkState)
    }

    watch(
      workState,
      async () => {
        if (workState.value) {
          try {
            await Promise.resolve()
            if (ignoreNextUpdate.value) {
              ignoreNextUpdate.value = false
              return
            }
            store.userConfig.workflow_cache_work_state = workState.value
            store.setUserConfig(store.userConfig)
            emitSync('workflowStateChanged', deepCopy(store.userConfig))
          } catch (error) {
            console.error('Error handling workState change:', error)
          }
        } else {
          console.warn('workState or userConfig is not defined')
        }
      },
      { deep: true }
    )
  }

  onSync('workflowStateChanged', (userConfig: UserConfigModel) => {
    ignoreNextUpdate.value = true
    workState.value = userConfig.workflow_cache_work_state
  })

  return {
    workState,
    currentWorkflow
  }
}
