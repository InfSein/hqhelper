<script setup lang="ts">
import { computed } from 'vue'
import { MenuBookOutlined } from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import ItemRecipeTree from '@/components/item/ItemRecipeTree.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { XivJobs } from '@/assets/data'
import { getPatchMasterRecipeItems } from '@/tools/game/patch-guide'

interface MasterRecipeSectionProps {
  patchVer: string
}
const props = defineProps<MasterRecipeSectionProps>()

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()

const masterItems = computed(() => {
  return getPatchMasterRecipeItems(props.patchVer)
})
</script>

<template>
  <FoldableCard card-key="patch-guide-master-recipe">
    <template #header>
      <div class="card-title">
        <n-icon :component="MenuBookOutlined" />
        <span class="card-title__text">{{ t('patch_guide.section.master_recipe') }}</span>
      </div>
    </template>

    <n-empty v-if="!masterItems.length" :description="t('patch_guide.empty')" class="my-4" />

    <div
      v-else
      class="grid gap-2"
      :class="isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'"
    >
      <n-card
        v-for="item in masterItems"
        :key="item.id"
        size="small"
        embedded
        :bordered="false"
        :class="store.userConfig.custom_background ? 'glasscard' : ''"
        class="border border-border"
      >
        <div class="flex flex-col gap-2">
          <!-- 物品信息头部 -->
          <div class="flex items-center justify-between border-b border-border pb-1.5">
            <ItemSpan :item-info="item" :img-size="20" class="font-bold" />
            <div v-if="item.craftInfo" class="flex items-center gap-1 text-app-xs text-sub">
              <XivFARImage
                v-if="XivJobs[item.craftInfo.jobId]"
                :size="14"
                :src="XivJobs[item.craftInfo.jobId].job_icon_url"
              />
              <span v-if="item.craftInfo.starCount" class="text-warning">
                {{ '★'.repeat(item.craftInfo.starCount) }}
              </span>
            </div>
          </div>

          <!-- 树状配方 -->
          <div class="overflow-x-auto py-1">
            <ItemRecipeTree :item="item" :amount="1" :level="0" />
          </div>
        </div>
      </n-card>
    </div>
  </FoldableCard>
</template>

<style scoped>
</style>
