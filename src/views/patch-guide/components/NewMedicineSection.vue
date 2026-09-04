<script setup lang="ts">
import { computed } from 'vue'
import { ScienceOutlined } from '@vicons/material'
import ItemSpan from '@/components/item/ItemSpan.vue'
import ItemRecipeTree from '@/components/item/ItemRecipeTree.vue'
import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { XivAttributes } from '@/assets/data'
import { type ItemInfo } from '@/tools/item'
import { getPatchMedicines } from '@/tools/game/patch-guide'

interface NewMedicineSectionProps {
  patchVer: string
}
const props = defineProps<NewMedicineSectionProps>()

const { t } = useLocale()
const { uiLanguage } = useConfig()

const medicines = computed(() => {
  return getPatchMedicines(props.patchVer)
})

// 一行最多展示 5 个药品，按 5 个一组切分
const chunkedMedicines = computed(() => {
  const chunks: ItemInfo[][] = []
  for (let i = 0; i < medicines.value.length; i += 5) {
    chunks.push(medicines.value.slice(i, i + 5))
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

/** 获取药品的属性文本列表，按上限降序排序 */
const getAttrDisplays = (item: ItemInfo): AttrDisplay[] => {
  if (!item.tempAttrsProvided?.length) return []
  return item.tempAttrsProvided
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
  <FoldableCard card-key="patch-guide-medicine">
    <template #header>
      <div class="card-title">
        <n-icon :component="ScienceOutlined" />
        <span class="card-title__text">{{ t('patch_guide.section.new_medicine') }}</span>
      </div>
    </template>

    <n-empty v-if="!medicines.length" :description="t('patch_guide.empty')" class="my-4" />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="(chunk, cIdx) in chunkedMedicines"
        :key="cIdx"
        class="overflow-x-auto rounded border border-border"
      >
        <table class="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col v-for="i in 5" :key="i" class="w-1/5" />
          </colgroup>
          <tbody>
            <!-- 第一行：药品 ItemSpan -->
            <tr class="bg-bg-embedded border-b border-border">
              <td
                v-for="item in chunk"
                :key="`span-${item.id}`"
                class="py-2.5 px-3 border-r border-border last:border-r-0 align-middle min-w-44"
              >
                <ItemSpan :item-info="item" :img-size="20" class="font-bold" />
              </td>
              <td
                v-for="i in (5 - chunk.length)"
                :key="`empty-span-${i}`"
                class="py-2.5 px-3 border-r border-border last:border-r-0 min-w-44"
              />
            </tr>

            <!-- 第二行：属性 -->
            <tr class="border-b border-border bg-bg">
              <td
                v-for="item in chunk"
                :key="`attr-${item.id}`"
                class="py-2.5 px-3 border-r border-border last:border-r-0 align-top min-w-44"
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
                v-for="i in (5 - chunk.length)"
                :key="`empty-attr-${i}`"
                class="py-2.5 px-3 border-r border-border last:border-r-0 min-w-44"
              />
            </tr>

            <!-- 第三行：树状配方 -->
            <tr class="bg-bg">
              <td
                v-for="item in chunk"
                :key="`tree-${item.id}`"
                class="py-2.5 px-3 border-r border-border last:border-r-0 align-top min-w-44"
              >
                <div class="overflow-x-auto max-h-96">
                  <ItemRecipeTree :item="item" :amount="item.craftInfo?.yields || 1" :level="0" />
                </div>
              </td>
              <td
                v-for="i in (5 - chunk.length)"
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
