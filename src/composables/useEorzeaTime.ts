import { ref, readonly } from 'vue'
import EorzeaTime from '@/utils/game.et'

const currentET = ref<EorzeaTime>(new EorzeaTime())
let timerStarted = false

export function useEorzeaTime() {
  if (!timerStarted) {
    setInterval(() => {
      currentET.value = new EorzeaTime()
    }, 200)
    timerStarted = true
  }

  return {
    currentET: readonly(currentET),
  }
}

export default useEorzeaTime
