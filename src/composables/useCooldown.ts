/**
 * 倒计时冷却控制组合式函数
 */
export const useCooldown = () => {
  const cooldownSeconds = ref(0)
  let cooldownTimer: ReturnType<typeof setInterval> | null = null

  const stopCooldown = () => {
    cooldownSeconds.value = 0
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }

  const startCooldown = (seconds: number) => {
    if (seconds <= 0) return
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
    }
    cooldownSeconds.value = Math.ceil(seconds)
    cooldownTimer = setInterval(() => {
      cooldownSeconds.value--
      if (cooldownSeconds.value <= 0) {
        stopCooldown()
      }
    }, 1000)
  }

  onUnmounted(() => {
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  })

  return {
    cooldownSeconds,
    startCooldown,
    stopCooldown,
  }
}

export default useCooldown
