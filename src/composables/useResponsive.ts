import { ref, readonly } from 'vue'

const isMobile = ref(false)
let listenerAttached = false

function updateIsMobile() {
  isMobile.value = window.innerWidth < window.innerHeight
}

export function useResponsive() {
  if (typeof window !== 'undefined' && !listenerAttached) {
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    listenerAttached = true
  }

  return {
    isMobile: readonly(isMobile),
  }
}

export default useResponsive
