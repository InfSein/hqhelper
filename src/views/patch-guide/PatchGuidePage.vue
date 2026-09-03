<script setup lang="ts">
import { computed } from 'vue'
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
      class="my-8"
    >
      <n-result
        status="warning"
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
        <div class="flex items-center gap-2 overflow-x-auto py-0.5">
          <span class="text-app-base font-bold shrink-0">{{ pageTitle }}</span>
          <n-divider vertical class="mx-1" />
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

      <!-- 板块 6: 新增爆发药 -->
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
</style>
