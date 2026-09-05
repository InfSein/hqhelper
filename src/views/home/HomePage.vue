<script setup lang="ts">
import OnboardingWizard from './components/OnboardingWizard.vue'
import MainPage from '@/views/main/HqWorkbenchPage.vue'
import WorkflowPage from '@/views/workflow/WorkflowPage.vue'
import { useStore } from '@/store'
import { useResponsive } from '@/composables/useResponsive'
import { useLocale } from '@/composables/useLocale'
import { useAppModals } from '@/composables/useAppModals'
import { decodeShareCode } from '@/tools/shareCode'
import { getItemInfo } from '@/tools/item'

const store = useStore()
const { isMobile } = useResponsive()
const { t } = useLocale()
const route = useRoute()
const router = useRouter()
const NAIVE_UI_MESSAGE = useMessage()
const { joinItemsToWorkflow } = useAppModals()

const isOnboardingCompleted = computed(() => {
  return !!store.userConfig.onboarding_completed
})

const activeComponent = computed(() => {
  if (isMobile.value) {
    // 移动端固定前往 HQ工作台
    return MainPage
  }
  if (store.userConfig.default_homepage === 'workflow') {
    return WorkflowPage
  }
  return MainPage
})

const checkRouteShareCode = () => {
  const code = route.query.code as string | undefined
  if (code) {
    const decoded = decodeShareCode(code)
    if (decoded && Object.keys(decoded).length > 0) {
      const validItems: Record<number, number> = {}
      for (const [idStr, amount] of Object.entries(decoded)) {
        const itemId = Number(idStr)
        const itemInfo = getItemInfo(itemId)
        if (itemInfo.craftInfo?.recipeId) {
          validItems[itemId] = amount
        }
      }
      if (Object.keys(validItems).length > 0) {
        joinItemsToWorkflow(validItems)
      } else {
        NAIVE_UI_MESSAGE.error(t('workflow.share.import_by_code_failed'))
      }
    } else {
      NAIVE_UI_MESSAGE.error(t('workflow.share.import_by_code_failed'))
    }
    router.replace({ path: '/' })
  } else if (route.path === '/share') {
    router.replace({ path: '/' })
  }
}

onMounted(() => {
  checkRouteShareCode()
})
watch(() => route.query.code, () => {
  checkRouteShareCode()
})
</script>

<template>
  <div v-if="!isOnboardingCompleted" id="main-container">
    <OnboardingWizard />
  </div>
  <component v-else :is="activeComponent" />
</template>

<style scoped>
</style>
