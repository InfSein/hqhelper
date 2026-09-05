<script setup lang="ts">
import { computed } from 'vue'
import { FastfoodOutlined } from '@vicons/material'
import ItemSpan from '@/components/item/ItemSpan.vue'
import ItemRecipeTree from '@/components/item/ItemRecipeTree.vue'
import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { useResponsive } from '@/composables/useResponsive'
import { XivAttributes } from '@/assets/data'
import { type ItemInfo } from '@/tools/item'
import { getPatchFoods } from '@/tools/game/patch-guide'

interface NewFoodSectionProps {
  patchVer: string
}
const props = defineProps<NewFoodSectionProps>()

const { t } = useLocale()
const { uiLanguage } = useConfig()
const { isMobile } = useResponsive()
const chunkSize = computed(() => (isMobile.value ? 1 : 5))

const foods = computed(() => {
  return getPatchFoods(props.patchVer)
})

// 移动端每行 1 个食物，桌面端每行最多 5 个食物
const chunkedFoods = computed(() => {
  const chunks: ItemInfo[][] = []
  const size = chunkSize.value
  for (let i = 0; i < foods.value.length; i += size) {
    chunks.push(foods.value.slice(i, i + size))
  }
  return chunks
})

const getAttrName = (attrId: number) => {
  const attr = XivAttributes[attrId]
  if (!attr) return t('common.unknown')
  switch (uiLanguage.value) {
    case 'ja':
      return attr.name_ja
    case 'en':
      return attr.name_en
    case 'zh':
    default:
      return attr.name_zh
  }
}

interface AttrDisplay {
  name: string
  percent: number
  max: number
}

/** 获取食物/药品的属性文本列表，过滤耐力(ID=3)、按上限降序排序 */
const getAttrDisplays = (item: ItemInfo): AttrDisplay[] => {
  if (!item.tempAttrsProvided?.length) return []
  return item.tempAttrsProvided
    .filter(attr => attr[0] !== 3) // 过滤掉耐力属性
    .map(attr => {
      const attrId = attr[0]
      const hasHq = attr[1]
      const attrPercent = hasHq ? attr[4] : attr[2]
      const attrMax = hasHq ? attr[5] : attr[3]
      return {
        name: getAttrName(attrId),
        percent: attrPercent,
        max: attrMax,
      }
    })
    .sort((a, b) => b.max - a.max) // 按属性上限降序排序
}
</script>

<template>
  <FoldableCard card-key="patch-guide-food">
    <template #header>
      <div class="card-title">
        <n-icon :component="FastfoodOutlined" />
        <span class="card-title__text">{{ t('patch_guide.section.new_food') }}</span>
      </div>
    </template>

    <n-empty v-if="!foods.length" :description="t('common.nothing')" class="my-4" />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="(chunk, cIdx) in chunkedFoods"
        :key="cIdx"
        class="overflow-x-auto rounded border border-border"
      >
        <table class="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col v-for="i in chunkSize" :key="i" :class="isMobile ? 'w-full' : 'w-1/5'" />
          </colgroup>
          <tbody>
            <!-- 第一行：食物 ItemSpan -->
            <tr class="bg-bg-embedded border-b border-border">
              <td
                v-for="item in chunk"
                :key="`span-${item.id}`"
                :class="isMobile ? '' : 'min-w-44'"
                class="py-2.5 px-3 border-r border-border last:border-r-0 align-middle"
              >
                <ItemSpan :item-info="item" :img-size="20" class="font-bold" />
              </td>
              <td
                v-for="i in (chunkSize - chunk.length)"
                :key="`empty-span-${i}`"
                class="py-2.5 px-3 border-r border-border last:border-r-0 min-w-44"
              />
            </tr>

            <!-- 第二行：属性 -->
            <tr class="border-b border-border bg-bg">
              <td
                v-for="item in chunk"
                :key="`attr-${item.id}`"
                :class="isMobile ? '' : 'min-w-44'"
                class="py-2.5 px-3 border-r border-border last:border-r-0 align-top"
              >
                <div class="flex flex-col gap-1 text-app-xs">
                  <div
                    v-for="(attr, aIndex) in getAttrDisplays(item)"
                    :key="aIndex"
                    class="text-sub font-medium leading-none"
                  >
                    {{ attr.name }} +{{ attr.percent }}% {{ t('common.quoted_maximum', { val: attr.max }) }}
                  </div>
                </div>
              </td>
              <td
                v-for="i in (chunkSize - chunk.length)"
                :key="`empty-attr-${i}`"
                class="py-2.5 px-3 border-r border-border last:border-r-0 min-w-44"
              />
            </tr>

            <!-- 第三行：树状配方 -->
            <tr class="bg-bg">
              <td
                v-for="item in chunk"
                :key="`tree-${item.id}`"
                :class="isMobile ? '' : 'min-w-44'"
                class="py-2.5 px-3 border-r border-border last:border-r-0 align-top"
              >
                <div class="overflow-x-auto max-h-96">
                  <ItemRecipeTree :item="item" :amount="item.craftInfo?.yields || 1" :level="0" />
                </div>
              </td>
              <td
                v-for="i in (chunkSize - chunk.length)"
                :key="`empty-tree-${i}`"
                class="py-2.5 px-3 border-r border-border last:border-r-0 min-w-44"
              />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </FoldableCard>
</template>

<style scoped>
</style>
