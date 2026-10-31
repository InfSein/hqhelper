import { ref, readonly } from 'vue'
import EorzeaTime from '@/utils/game.et'

const currentET = ref<EorzeaTime>(new EorzeaTime())
let timerStarted = false

export function useEorzeaTime() {
  if (!timerStarted) {
    let lastTimeStamp = currentET.value.timeStamp
    setInterval(() => {
      const newET = new EorzeaTime()
      if (newET.timeStamp !== lastTimeStamp) {
        lastTimeStamp = newET.timeStamp
        currentET.value = newET
      }
    }, 200)
    timerStarted = true
  }

  return {
    currentET: readonly(currentET),
  }
}

export default useEorzeaTime
