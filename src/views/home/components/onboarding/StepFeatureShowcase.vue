<script setup lang="ts">
import ItemButton from '@/components/item/ItemButton.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import ItemCell from '@/components/item/ItemCell.vue'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { getItemInfo } from '@/tools/item'

const { t } = useLocale()
const { isMobile } = useResponsive()

// 示例物品数据
const demoItem1 = computed(() => getItemInfo(44162))
const demoItem2 = computed(() => getItemInfo(44163))
const demoItem3 = computed(() => getItemInfo(44164))
</script>

<template>
  <div class="w-full py-1 md:py-2 px-1 md:px-4">
    <div class="step-header mb-3 md:mb-5">
      <h2 class="text-app-xl font-bold text-text mb-1">{{ t('onboarding.step_3.title') }}</h2>
      <p class="text-app-xs text-sub">{{ t('onboarding.step_3.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-5">
      <n-alert type="info" :title="t('onboarding.step_3.feature_hover_title')">
        {{ t('onboarding.step_3.feature_hover_desc') }}
      </n-alert>
      <n-alert type="warning" :title="t('onboarding.step_3.feature_menu_title')">
        {{ t('onboarding.step_3.feature_menu_desc') }}
      </n-alert>
    </div>

    <!-- Interactive Playground -->
    <n-alert type="success" :title="t('onboarding.step_3.playground_tip')">
      <n-table v-if="isMobile" :single-line="false" size="small">
        <tbody>
          <tr>
            <th class="font-bold! w-16 text-center whitespace-nowrap">{{ t('onboarding.step_3.button') }}</th>
            <td>
              <ItemButton :item-info="demoItem1" show-icon show-name btn-extra-style="max-width: 190px;" />
            </td>
          </tr>
          <tr>
            <th class="font-bold! w-16 text-center whitespace-nowrap">{{ t('onboarding.step_3.label') }}</th>
            <td>
              <ItemSpan :item-info="demoItem2" :img-size="14" span-max-width="180px" />
            </td>
          </tr>
          <tr>
            <th class="font-bold! w-16 text-center whitespace-nowrap">{{ t('onboarding.step_3.cell') }}</th>
            <td>
              <ItemCell :item-info="demoItem3" :amount="0" show-item-details item-span-max-width="160px" />
            </td>
          </tr>
        </tbody>
      </n-table>
      <n-table v-else :single-line="false" class="text-center">
        <thead>
          <tr>
            <th class="font-bold!">{{ t('onboarding.step_3.button') }}</th>
            <th class="font-bold!">{{ t('onboarding.step_3.label') }}</th>
            <th class="font-bold!">{{ t('onboarding.step_3.cell') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <ItemButton :item-info="demoItem1" show-icon show-name />
            </td>
            <td>
              <div class="flex items-center justify-center">
                <ItemSpan :item-info="demoItem2" :img-size="14" />
              </div>
            </td>
            <td>
              <div class="flex items-center justify-center">
                <ItemCell :item-info="demoItem3" :amount="0" show-item-details />
              </div>
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-alert>
  </div>
</template>
