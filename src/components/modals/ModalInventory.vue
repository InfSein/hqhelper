<script setup lang="ts">
import { useTemplateRef } from 'vue'
import {
  BackpackFilled,
  DeleteSweepRound,
  SaveOutlined,
} from '@vicons/material'
import SettingItem from '@/components/ui/SettingItem.vue'
import TooltipButton from '@/components/ui/TooltipButton.vue'
import ItemSelector from '@/components/item/ItemSelector.vue'
import ItemSelectTable from '@/components/item/ItemSelectTable.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { deepCopy } from '@/tools'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import { type PreferenceItem as Setting } from '@/types'
import { fixFuncConfig, type FuncConfigModel } from '@/types/config/func'

const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})

const store = useStore()
const { t } = useLocale()
const NAIVE_UI_MESSAGE = useMessage()

const showModal = defineModel<boolean>('show', { required: true })

const formFuncConfigData = ref<FuncConfigModel>(deepCopy(fixFuncConfig(store.funcConfig)))
const formInventoryItems = ref<ItemInfo[]>([])

const modalId = 'modal-inventory'

const onLoad = () => {
  formFuncConfigData.value = deepCopy(fixFuncConfig(store.funcConfig))
  formInventoryItems.value = Object.keys(formFuncConfigData.value.inventory_data).map(_id => {
    const id = Number(_id)
    const item = getItemInfo(id)
    item.amount = formFuncConfigData.value.inventory_data[id]
    return item
  })
  itemTableFilter.value = ''
}

const inventorySettingItems = computed(() : Setting[] => {
  return [
    {
      key: 'inventory_statement_enable_sync',
      label: t('ingame_inventory.preference.inventory_statement_enable_sync.title'),
      type: 'switch',
      warnings: [
        t('ingame_inventory.preference.inventory_statement_enable_sync.desc.desc_1'),
      ],
    },
    {
      key: 'inventory_workflow_enable_sync',
      label: t('ingame_inventory.preference.inventory_workflow_enable_sync.title'),
      type: 'switch',
      warnings: [
        t('ingame_inventory.shared.desc.add_button_to_workflow_when_enabled', {
          f1: t('common.statement'), f2: t('workflow.text.sync_from_inventory')
        }),
        t('ingame_inventory.preference.inventory_workflow_enable_sync.desc.desc_1')
      ],
    },
    {
      key: 'inventory_workflow_enable_sync_reverse',
      label: t('ingame_inventory.preference.inventory_workflow_enable_sync_reverse.title'),
      type: 'switch',
      warnings: [
        t('ingame_inventory.shared.desc.add_button_to_workflow_when_enabled', {
          f1: t('common.statement'), f2: t('workflow.text.sync_to_inventory')
        }),
        t('ingame_inventory.preference.inventory_workflow_enable_sync_reverse.desc.desc_1')
      ],
    },
    {
      key: 'inventory_other_items_way',
      label: t('ingame_inventory.preference.inventory_other_items_way.title'),
      type: 'select',
      options: [
        { label: t('common.ignore'), value: 'ignore', description: t('ingame_inventory.preference.inventory_other_items_way.option.ignore.tooltip.tooltip_1') },
        { label: t('common.reset_to_0'), value: 'clear', description: t('ingame_inventory.preference.inventory_other_items_way.option.reset_to_0.tooltip.tooltip_1') },
      ],
      warnings: [
        t('ingame_inventory.preference.inventory_other_items_way.desc.desc_1'),
      ],
    },
    {
      key: 'inventory_sync_reverse_mode',
      label: t('ingame_inventory.preference.inventory_sync_reverse_mode.title'),
      type: 'select',
      options: [
        { label: t('common.loose'), value: 'loose', description: t('ingame_inventory.preference.inventory_sync_reverse_mode.option.loose.tooltip.tooltip_1') },
        { label: t('common.strict'), value: 'strict', description: t('ingame_inventory.preference.inventory_sync_reverse_mode.option.strict.tooltip.tooltip_1') },
        { label: t('common.overwrite'), value: 'overwrite', description: t('ingame_inventory.preference.inventory_sync_reverse_mode.option.overwrite.tooltip.tooltip_1') },
      ],
      warnings: [
        t('ingame_inventory.preference.inventory_sync_reverse_mode.desc.desc_1'),
      ],
    },
  ]
})

const itemTableFilter = ref('')
const itemTableRef = useTemplateRef<InstanceType<typeof ItemSelectTable>>('itemTableRef')

const handleItemInputValueUpdate = (value: number) => {
  if (!value) return
  if (formFuncConfigData.value.inventory_data[value]) {
    NAIVE_UI_MESSAGE.info(t('common.message.item_already_have'))
    itemTableRef.value?.scrollToItem(value)
  } else {
    formFuncConfigData.value.inventory_data[value] = 1
  }
}
const handleClearInventory = () => {
  formFuncConfigData.value.inventory_data = {}
  NAIVE_UI_MESSAGE.success(t('common.cleared'))
}

const handleSave = () => {
  store.setFuncConfig(fixFuncConfig(formFuncConfigData.value))

  // * 结算
  showModal.value = false
  appForceUpdate()
  NAIVE_UI_MESSAGE.success(t('common.save_succeed'))
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :id="modalId"
    :icon="BackpackFilled"
    :title="t('common.appfunc.ingame_inventory')"
    max-width="620px"
    @on-load="onLoad"
  >
    <n-tabs type="segment" animated>
      <n-tab-pane name="options" :tab="t('common.options')">
        <div class="pane-container">
          <SettingItem
            v-for="item in inventorySettingItems"
            :key="item.key"
            v-model:form-data="formFuncConfigData"
            :setting-item="item"
          />
        </div>
      </n-tab-pane>
      <n-tab-pane name="data" :tab="t('common.data')">
        <div class="pane-container">
          <div class="top-actions">
            <CompactForm>
              <CompactFormItem :label="t('common.add_item')">
                <ItemSelector
                  options-preset="materials"
                  :container-id="modalId"
                  @on-item-selected="handleItemInputValueUpdate"
                />
              </CompactFormItem>
              <CompactFormItem :label="t('common.filter_item')">
                <n-input
                  v-model:value="itemTableFilter"
                  clearable
                  :placeholder="t('common.item_filter_input_placeholder')"
                />
              </CompactFormItem>
          </CompactForm>
          </div>
          <div class="content-table">
            <ItemSelectTable
              ref="itemTableRef"
              v-model:items="formFuncConfigData.inventory_data"
              show-item-details
              :filter-str="itemTableFilter"
              item-span-max-width="260px"
              content-height="285px"
              :container-id="modalId"
            />
          </div>
          <div class="bottom-actions">
            <TooltipButton
              :icon="DeleteSweepRound"
              :text="t('common.clear')"
              :tip="t('inventory.clear_inventory')"
              @click="handleClearInventory"
            />
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <template #action>
      <div class="app-modal-footer">
        <n-button type="primary" size="large" @click="handleSave">
          <template #icon>
            <n-icon><SaveOutlined /></n-icon>
          </template>
          {{ t('common.save') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
.pane-container {
  padding: 0 5px;
  height: 440px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;

  .top-actions {
    display: flex;
    align-items: center;
    gap: 5px;

    .label {
      font-size: 16px;
    }
    .n-select {
      flex: 1;
    }
  }
  .content-table {
    flex: 1;
  }
  .bottom-actions {
    display: flex;
    justify-content: end;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .pane-container {
    height: 400px;
  }
}
</style>