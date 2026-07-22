<script setup lang="ts">
import { 
  AllInclusiveSharp, CopyAllOutlined
} from '@vicons/material'
import CraftRecommProcess from '@/components/craft/CraftRecommProcess.vue'
import ModalPreferences from './ModalPreferences.vue'
import { type ItemInfo } from '@/tools/item'
import { CopyToClipboard } from '@/tools'
import { useFufuCal } from '@/tools/use-fufu-cal'
import UseConfig from '@/composables/useConfig.ts'
import { useStore } from '@/store'

const t = inject<(message: string, args?: any) => string>('t')!
// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
// const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()
const { calRecommProcessGroups } = useFufuCal()
const {
  itemLanguage,
} = UseConfig()
  
const showModal = defineModel<boolean>('show', { required: true })
const expandedBlocks = ref<Record<number, string[]>>({})
/** (groupId, (itemId, checked)) */
const completedItems = ref<Record<number, Record<number, boolean>>>({})

watch(showModal, async(newVal, oldVal) => {
  if (newVal && !oldVal) {
    expandedBlocks.value = {}; completedItems.value = {}
    for (let i = 0; i < itemGroups.value.length; i++) {
      expandedBlocks.value[i] = ['1']
      completedItems.value[i] = {}
      itemGroups.value[i].items.forEach(item => {
        completedItems.value[i][item.id] = false
      })
    }
  }
})

interface RecommendedProcessesProps {
  craftTargets: ItemInfo[],
  lv1Items: ItemInfo[],
  lv2Items: ItemInfo[],
  lv3Items: ItemInfo[],
  lvBaseItems: ItemInfo[]
}
const props = defineProps<RecommendedProcessesProps>()

const modalId = 'modal-recomm-process'

const itemGroups = computed(() => {
  return calRecommProcessGroups(
    props.craftTargets,
    props.lv1Items,
    props.lv2Items,
    props.lv3Items,
    props.lvBaseItems,
    store.funcConfig.processes_craftable_item_sortby,
    store.funcConfig.processes_merge_gatherings,
    store.userConfig.language_ui,
    t
  )
})

const getItemName = (itemInfo: ItemInfo) => {
  switch (itemLanguage.value) {
    case 'zh':
      return itemInfo.name_zh || '未翻译的物品'
    default:
      return itemInfo[`name_${itemLanguage.value}`]
  }
}

const handleCopy = async (content: string, successMessage?: string) => {
  const container = document.getElementById('modal-recomm-process')
  const response = await CopyToClipboard(content, container)
  if (response) {
    NAIVE_UI_MESSAGE.error(t('common.message.copy_failed_unexpected_error'))
  } else {
    NAIVE_UI_MESSAGE.success(successMessage ?? t('common.message.copy_succeed'))
  }
}

const isBlocksAllCollapsed = () => {
  let allCollapsed = true
  for (let i = 0; i < itemGroups.value.length; i++) {
    if (expandedBlocks.value[i] && expandedBlocks.value[i].length > 0) {
      allCollapsed = false
    }
  }
  return allCollapsed
}
const handleCollapseOrUncollapseAllBlocks = () => {
  const allCollapsed = isBlocksAllCollapsed()
  for (let i = 0; i < itemGroups.value.length; i++) {
    expandedBlocks.value[i] = allCollapsed ? ['1'] : []
  }
}
const handleCopyProcesses = () => {
  const text = itemGroups.value.map((group, index) => {
    return (index+1) + '. ' + group.title + ':\n' + group.items.map(item => {
      return '  ' + getItemName(item) + ' x' + item.amount
    }).join('\n')
  }).join('\n\n')
  handleCopy(text)
}

const showPreferencesModal = ref(false)
const handleSettingButtonClick = () => {
  showPreferencesModal.value = true
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :id="modalId"
    max-width="350px"
    extra-style="--n-padding-bottom: 10px;"
    show-setting
    @on-setting-button-clicked="handleSettingButtonClick"
  >
    <template #header>
      <div class="card-title select-none">
        <n-icon><AllInclusiveSharp /></n-icon>
        <span class="title">{{ t('common.appfunc.recomm_process') }}</span>
        <div class="card-title-actions">
          <a href="javascript:void(0);" @click="handleCollapseOrUncollapseAllBlocks">[{{ isBlocksAllCollapsed() ? t('common.expand_all') : t('common.fold_all') }}]</a>
        </div>
      </div>
    </template>

    <CraftRecommProcess
      v-model:expanded-blocks="expandedBlocks"
      v-model:completed-items="completedItems"
      :item-groups="itemGroups"
      item-span-max-width="250px"
      :container-id="modalId"
    />

    <template #action>
      <div class="modal-submit-container">
        <n-button type="info" size="large" @click="handleCopyProcesses">
          <template #icon>
            <n-icon><CopyAllOutlined /></n-icon>
          </template>
          {{ t('common.copy') }}
        </n-button>
      </div>
    </template>
    
    <ModalPreferences
      v-model:show="showPreferencesModal"
      setting-group="recomm_process"
      app-show-fp
    />
  </MyModal>
</template>

<style scoped>
:deep(.n-card__action) {
  padding-top: 15px;
  padding-bottom: 15px;
}
:deep(.n-collapse-item__content-inner) {
  padding-top: 0 !important;
}

/* All */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 5px;
  user-select: text;
  max-height: 375px;
  overflow-y: auto;

  .block {
    line-height: 1.2;

    .title {
      display: flex;
      align-items: center;
      span {
        font-weight: bold;
      }
      span.icon {
        display: flex;
        margin-right: 3px;
      }
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin: 3px 0 0 1em;

      .item-container {
        display: flex;
        align-items: center;
        gap: 3px;
      }
      .gather-detail-time,
      .gather-detail-recomm,
      .gather-detail-position {
        display: flex;
        flex-wrap: wrap;
        margin-left: 1em;
        font-size: calc(var(--n-font-size) - 2px);
      }
    }
  }
}

/* Mobile only */
/* @media (max-width: 768px)*/
</style>