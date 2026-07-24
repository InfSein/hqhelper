<script setup lang="ts">
// import { 
//   TableViewOutlined
// } from '@vicons/material'
import ItemList from '@/components/item/ItemList.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import type { ItemInfo } from '@/tools/item'

const { t } = useLocale()
const { isMobile } = useResponsive()

const store = useStore()

interface CraftStatementsProps {
  craftTargets: ItemInfo[],
  materialsLv1: ItemInfo[],
  materialsLv2: ItemInfo[],
  materialsLv3: ItemInfo[],
  materialsLv4: ItemInfo[],
  materialsLv5: ItemInfo[],
  materialsLvBase: ItemInfo[],
  /** 是否处于模态框内。此参数会影响一些UI效果。 */
  insideModal?: boolean,
  containerId?: string,
}
const props = defineProps<CraftStatementsProps>()

const statementBlocks = computed(() => {
  return [
    {
      id: 'craft-target',
      name: t('statement.list.targets'),
      items: props.craftTargets
    },
    {
      id: 'material-lv1',
      name: t('statement.list.material.lv1'),
      items: props.materialsLv1
    },
    {
      id: 'material-lv2',
      name: t('statement.list.material.lv2'),
      items: props.materialsLv2
    },
    {
      id: 'material-lv3',
      name: t('statement.list.material.lv3'),
      items: props.materialsLv3
    },
    {
      id: 'material-lvBase',
      name: t('statement.list.material.lvbase'),
      items: props.materialsLvBase
    },
  ]
})
</script>

<template>
  <n-tabs v-if="isMobile" type="line" animated>
    <n-tab-pane
      v-for="block in statementBlocks"
      :key="block.id"
      :name="block.id"
      :tab="block.name"
    >
      <div class="container">
        <ItemList
          :items="block.items"
          :list-height="480"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
          :container-id="containerId"
        />
      </div>
    </n-tab-pane>
  </n-tabs>
  <div v-else class="wrapper desktop">
    <GroupBox
      v-for="block in statementBlocks"
      :key="block.id"
      :id="block.id"
      class="group"
    >
      <template #title>{{ block.name }}</template>
      <div class="container">
        <ItemList
          :items="block.items"
          :list-height="480"
          btn-pop-max-width="300px"
          :show-collector-icon="!store.userConfig.hide_collector_icons"
          :container-id="containerId"
        />
      </div>
    </GroupBox>
  </div>
</template>

<style scoped>
/* All */
.wrapper {
  user-select: text;
}
.wrapper.desktop {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.group .container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
  user-select: text;
}
</style>