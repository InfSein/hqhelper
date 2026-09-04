<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import {
  AccessAlarmsOutlined,
  CurrencyExchangeOutlined,
  MenuBookOutlined,
  ShieldOutlined,
  FastfoodOutlined,
  ScienceOutlined,
  ArrowBackOutlined,
} from '@vicons/material'
// import RouterCard from '@/components/ui/RouterCard.vue'
import LegendaryGatheringSection from './components/LegendaryGatheringSection.vue'
import TradeItemsSection from './components/TradeItemsSection.vue'
import MasterRecipeSection from './components/MasterRecipeSection.vue'
import NewGearsSection from './components/NewGearsSection.vue'
import NewFoodSection from './components/NewFoodSection.vue'
import NewMedicineSection from './components/NewMedicineSection.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { XivPatches } from '@/assets/data'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { t } = useLocale()

const patchVer = computed(() => {
  const ver = route.params.ver
  return Array.isArray(ver) ? ver[0] : (ver || '')
})

// 检查传入的版本是否合法有效
const currentPatch = computed(() => {
  return XivPatches.find(p => p.v === patchVer.value && p.updated)
})

const pageTitle = computed(() => {
  return t('patch_guide.page_title', { val: patchVer.value })
})

// 导航栏滚动状态：初始展开，滚动后收起
const isNavCompact = ref(false)

let scrollTarget: HTMLElement | Window | null = null
let ticking = false

const getScrollTop = () => {
  if (scrollTarget && scrollTarget instanceof HTMLElement) {
    return scrollTarget.scrollTop
  }
  return window.scrollY || document.documentElement.scrollTop
}

const handleScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const top = getScrollTop()
      // 迟滞区间：向下滚动超过 80px 变简洁，向上滚动回退到 <= 10px 恢复展开，杜绝抖动
      if (!isNavCompact.value && top > 80) {
        isNavCompact.value = true
      } else if (isNavCompact.value && top <= 10) {
        isNavCompact.value = false
      }
      ticking = false
    })
    ticking = true
  }
}

onMounted(() => {
  // 查找 Naive UI 的滚动容器或降级为 window
  const container = document.querySelector('#main-content .n-scrollbar-container') as HTMLElement
    || document.querySelector('#main-content .n-layout-scroll-container') as HTMLElement
  if (container) {
    scrollTarget = container
    container.addEventListener('scroll', handleScroll, { passive: true })
  } else {
    scrollTarget = window
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  if (scrollTarget && scrollTarget !== window) {
    scrollTarget.removeEventListener('scroll', handleScroll as EventListener)
  }
  window.removeEventListener('scroll', handleScroll as EventListener)
})

const scrollToSection = (sectionId: string) => {
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const navItems = computed(() => [
  { id: 'section-gathering', icon: AccessAlarmsOutlined, label: t('patch_guide.section.legendary_gathering') },
  { id: 'section-trade', icon: CurrencyExchangeOutlined, label: t('patch_guide.section.trade_items') },
  { id: 'section-master', icon: MenuBookOutlined, label: t('patch_guide.section.master_recipe') },
  { id: 'section-gears', icon: ShieldOutlined, label: t('patch_guide.section.new_gears') },
  { id: 'section-food', icon: FastfoodOutlined, label: t('patch_guide.section.new_food') },
  { id: 'section-medicine', icon: ScienceOutlined, label: t('patch_guide.section.new_medicine') },
])
</script>

<template>
  <div id="main-container" class="flex flex-col gap-3">
    <!-- 版本无效提示 -->
    <n-card
      v-if="!currentPatch"
      embedded
      :bordered="false"
      :class="store.userConfig.custom_background ? 'glasscard' : ''"
      class="my-8 min-h-[80vh]"
      content-class="flex items-center justify-center"
    >
      <n-result
        status="error"
        :title="t('patch_guide.invalid_patch')"
        :description="patchVer ? `Patch ${patchVer}` : ''"
      >
        <template #footer>
          <n-button type="primary" @click="router.push('/hqwb')">
            <template #icon>
              <n-icon :component="ArrowBackOutlined" />
            </template>
            {{ t('common.back_to_index') }}
          </n-button>
        </template>
      </n-result>
    </n-card>

    <template v-else>
      <!-- 置顶导航栏 -->
      <n-card
        size="small"
        embedded
        :bordered="false"
        :class="store.userConfig.custom_background ? 'glasscard' : ''"
        class="border border-border sticky top-0 z-20 shadow-xs backdrop-blur-md"
      >
        <!-- 展开模式下的大标题区：使用 grid-template-rows 丝滑折叠，无 max-height 空走卡顿 -->
        <div
          class="title-row"
          :class="{ 'title-row--collapsed': isNavCompact }"
        >
          <div class="overflow-hidden">
            <div class="flex items-center gap-2 pt-0.5 pb-1.5">
              <i class="xiv ilv text-app-xl" />
              <span class="text-app-lg font-bold">{{ pageTitle }}</span>
            </div>
          </div>
        </div>

        <!-- 导航主体：小标题与按钮组（单一按钮列表，切换无闪烁卡顿） -->
        <div class="flex items-center gap-2 overflow-x-auto py-0.5">
          <!-- 紧凑模式下平滑浮现的小标题 -->
          <div
            class="compact-title flex items-center shrink-0 overflow-hidden"
            :class="{ 'compact-title--visible': isNavCompact }"
          >
            <span class="text-app-base font-bold whitespace-nowrap">{{ pageTitle }}</span>
            <n-divider vertical class="mx-1.5 shrink-0" />
          </div>

          <!-- 锚点按钮 -->
          <n-button
            v-for="nav in navItems"
            :key="nav.id"
            size="tiny"
            quaternary
            class="shrink-0"
            @click="scrollToSection(nav.id)"
          >
            <template #icon>
              <n-icon :component="nav.icon" />
            </template>
            {{ nav.label }}
          </n-button>
        </div>
      </n-card>

      <!-- 板块 1: 新增传说采集点 -->
      <div id="section-gathering" class="scroll-mt-16">
        <LegendaryGatheringSection :patch-ver="patchVer" />
      </div>

      <!-- 板块 2: 新增兑换物 -->
      <div id="section-trade" class="scroll-mt-16">
        <TradeItemsSection :patch-ver="patchVer" />
      </div>

      <!-- 板块 3: 新增秘籍半成品 -->
      <div id="section-master" class="scroll-mt-16">
        <MasterRecipeSection :patch-ver="patchVer" />
      </div>

      <!-- 板块 4: 新增装备 -->
      <div id="section-gears" class="scroll-mt-16">
        <NewGearsSection :patch-ver="patchVer" />
      </div>

      <!-- 板块 5: 新增食物 -->
      <div id="section-food" class="scroll-mt-16">
        <NewFoodSection :patch-ver="patchVer" />
      </div>

      <!-- 板块 6: 新增药品 -->
      <div id="section-medicine" class="scroll-mt-16">
        <NewMedicineSection :patch-ver="patchVer" />
      </div>
    </template>

    <n-back-top />
  </div>
</template>

<style scoped>
#main-container {
  max-width: 100%;
}

/* 展开大标题平滑高度折叠 */
.title-row {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows 0.22s ease-out, opacity 0.18s ease-out;
}
.title-row--collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
}

/* 紧凑小标题平滑展开 */
.compact-title {
  max-width: 0;
  opacity: 0;
  transition: max-width 0.22s ease-out, opacity 0.18s ease-out;
}
.compact-title--visible {
  max-width: 260px;
  opacity: 1;
}
</style>
