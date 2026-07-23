<script setup lang="ts">
import { 
  UnarchiveOutlined,
  DoneOutlined
} from '@vicons/material'
import { XivGearAffixes, XivJobs, XivPatches, type XivPatchVer } from '@/assets/data'
import UseConfig from '@/composables/useConfig'
import { accessoryAffixes, attireAffixes, fixGearSelections, type AccessoryAffix, type AttireAffix, type GearSelections } from '@/types/game/gear'
import { getGearIcon } from '@/tools/game/gear'
import { useStore } from '@/store'

import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'

const { t } = useLocale()
const { isMobile } = useResponsive()
const handleImportState = inject<(patch: string, gearSelections?: GearSelections) => void>('handleImportState')!

const store = useStore()
const {
  uiLanguage,
} = UseConfig()

const modalMaxWidth = computed(() => {
  switch (store.userConfig.language_ui) {
    case 'en': return '1300px'
    case 'ja': return '1500px'
    default: return '900px'
  }
})

const showModal = defineModel<boolean>('show', { required: true })
const onLoad = () => {
  patchSelected.value = props.defaultPatch
}

interface ModalConfirmImportMainProps {
  gearSelections: GearSelections | undefined
  defaultPatch: XivPatchVer
}
const props = defineProps<ModalConfirmImportMainProps>()
const emit = defineEmits(['onImportConfirmed'])

const patchSelected = ref(props.defaultPatch)

const slots = [
  { key: 'mainHand', text: t('game.gear.tool.mainhand.title'), icon: getGearIcon('mainHand') },
  { key: 'offHand', text: t('game.gear.tool.offhand.title'), icon: getGearIcon('offHand') },
  { key: 'headAttire', text: t('game.gear.attire.head.title'), icon: getGearIcon('headAttire') },
  { key: 'bodyAttire', text: t('game.gear.attire.body.title'), icon: getGearIcon('bodyAttire') },
  { key: 'handsAttire', text: t('game.gear.attire.hands.title'), icon: getGearIcon('handsAttire') },
  { key: 'legsAttire', text: t('game.gear.attire.legs.title'), icon: getGearIcon('legsAttire') },
  { key: 'feetAttire', text: t('game.gear.attire.feet.title'), icon: getGearIcon('feetAttire') },
  { key: 'earrings', text: t('game.gear.accessory.earring.title'), icon: getGearIcon('earrings') },
  { key: 'necklace', text: t('game.gear.accessory.necklace.title'), icon: getGearIcon('necklace') },
  { key: 'wrist', text: t('game.gear.accessory.wrist.title'), icon: getGearIcon('wrist') },
  { key: 'rings', text: t('game.gear.accessory.rings.title'), icon: getGearIcon('rings') },
]
const gearRows = computed(() => {
  const rows : string[][] = []

  const gearSelections = fixGearSelections(props.gearSelections)
  // 处理各职业主副手
  Object.keys(XivJobs).forEach(_jobid => {
    const jobId = Number(_jobid)
    const job = XivJobs[jobId]
    const name = job[`job_name_${uiLanguage.value}`] || '???'
    const mainCount = gearSelections.mainHand[jobId]
    const offCount = gearSelections.offHand[jobId]
    if (mainCount || offCount) {
      const rowData : string[] = [
        name,
        mainCount.toString(),
        offCount.toString(),
        '', '', '', '', '',
        '', '', '', ''
      ]
      rows.push(rowData)
    }
  })
  // 处理防具/首饰词缀
  const affixes : (AttireAffix | AccessoryAffix)[] = [
    ...new Set([
      ...attireAffixes,
      ...accessoryAffixes
    ])
  ]
  affixes.forEach(affix => {
    const affixData = XivGearAffixes[affix]
    const name = affixData[`name_${uiLanguage.value}`] || '???'
    const attireValid = attireAffixes.includes(affix as AttireAffix)
    const accessoryValid = accessoryAffixes.includes(affix as AccessoryAffix)
    const rowCounts : (string | number)[] = []

    if (attireValid) {
      const attireAffix = affix as AttireAffix
      rowCounts.push(
        gearSelections.headAttire[attireAffix] || 0,
        gearSelections.bodyAttire[attireAffix] || 0,
        gearSelections.handsAttire[attireAffix] || 0,
        gearSelections.legsAttire[attireAffix] || 0,
        gearSelections.feetAttire[attireAffix] || 0
      )
    } else {
      rowCounts.push(
        '', '', '', '', ''
      )
    }
    if (accessoryValid) {
      const accessoryAffix = affix as AccessoryAffix
      rowCounts.push(
        gearSelections.earrings[accessoryAffix] || 0,
        gearSelections.necklace[accessoryAffix] || 0,
        gearSelections.wrist[accessoryAffix] || 0,
        gearSelections.rings[accessoryAffix] || 0
      )
    } else {
      rowCounts.push(
        '', '', '', ''
      )
    }
    
    let rowTotal = 0
    rowCounts.forEach(count => {
      rowTotal += Number(count)
    })

    if (rowTotal > 0) {
      rows.push([
        name,
        '', '',
        ...rowCounts.map(item => String(item))
      ])
    }
  })

  return rows
})
const patchOptions = computed(() => {
  const opt = XivPatches.map(patch => {
    return {
      label: t('main.select_patch.patch_button.text', { v: patch.v, name: patch[`name_${uiLanguage.value}`] }),
      value: patch.v,
      disabled: !patch.updated
    }
  })
  return opt
})

const handleSubmit = () => {
  handleImportState(patchSelected.value, props.gearSelections)
  emit('onImportConfirmed')
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="UnarchiveOutlined"
    :title="t('main.imexport.confirm_import_content')"
    :max-width="modalMaxWidth"
    @on-load="onLoad"
  >
    <div class="wrapper">
      <GroupBox v-if="isMobile" :title="t('main.imexport.import_parts')">
        <n-scrollbar trigger="none" x-scrollable :style="{ width: '100%', height: '300px', 'margin-top': '-2px' }">
          <n-table class="table" size="small" :single-line="false">
            <thead>
              <tr>
                <th>{{ t('common.job_or_affix') }}</th>
                <th>{{ t('game.gear.tool.mainhand.title') }}</th>
                <th>{{ t('game.gear.tool.offhand.title') }}</th>
                <th>{{ t('game.gear.attire.head.title') }}</th>
                <th>{{ t('game.gear.attire.body.title') }}</th>
                <th>{{ t('game.gear.attire.hands.title') }}</th>
                <th>{{ t('game.gear.attire.legs.title') }}</th>
                <th>{{ t('game.gear.attire.feet.title') }}</th>
                <th>{{ t('game.gear.accessory.earring.title') }}</th>
                <th>{{ t('game.gear.accessory.necklace.title') }}</th>
                <th>{{ t('game.gear.accessory.wrist.title') }}</th>
                <th>{{ t('game.gear.accessory.rings.title') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in gearRows" :key="index">
                <td>{{ row[0] }}</td>
                <td>{{ row[1] }}</td>
                <td>{{ row[2] }}</td>
                <td>{{ row[3] }}</td>
                <td>{{ row[4] }}</td>
                <td>{{ row[5] }}</td>
                <td>{{ row[6] }}</td>
                <td>{{ row[7] }}</td>
                <td>{{ row[8] }}</td>
                <td>{{ row[9] }}</td>
                <td>{{ row[10] }}</td>
                <td>{{ row[11] }}</td>
              </tr>
            </tbody>
          </n-table>
        </n-scrollbar>
      </GroupBox>
      <GroupBox v-else :title="t('main.imexport.import_parts')">
        <n-table class="table" size="small" :single-line="false">
          <thead>
            <tr>
              <th>{{ t('common.job_or_affix') }}</th>
              <th
                v-for="slot in slots"
                :key="slot.key"
              >
                <div class="th-inner">
                  <n-icon size="15" color="var(--color-text)">
                    <component :is="slot.icon" />
                  </n-icon>
                  <span>{{ slot.text }}</span>
                </div>
              </th>
            </tr>
          </thead>
        </n-table>
        <n-scrollbar trigger="none" :style="{ maxHeight: '350px', 'margin-top': '-2px' }">
          <n-table class="table" size="small" :single-line="false">
            <tbody>
              <tr v-for="(row, index) in gearRows" :key="index">
                <td>{{ row[0] }}</td>
                <td>{{ row[1] }}</td>
                <td>{{ row[2] }}</td>
                <td>{{ row[3] }}</td>
                <td>{{ row[4] }}</td>
                <td>{{ row[5] }}</td>
                <td>{{ row[6] }}</td>
                <td>{{ row[7] }}</td>
                <td>{{ row[8] }}</td>
                <td>{{ row[9] }}</td>
                <td>{{ row[10] }}</td>
                <td>{{ row[11] }}</td>
              </tr>
            </tbody>
          </n-table>
        </n-scrollbar>
      </GroupBox>
      <GroupBox :title="t('main.select_patch.title')">
        <n-select v-model:value="patchSelected" :placeholder="t('main.imexport.confirm_import_patch')" :options="patchOptions" />
      </GroupBox>
    </div>

    <template #action>
      <div class="modal-submit-container">
        <n-button type="primary" @click="handleSubmit">
          <template #icon>
            <n-icon><DoneOutlined /></n-icon>
          </template>
          {{ t('common.confirm') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
  user-select: text;

  .table {
    width: 100%;

    th {
      font-weight: bold;
      .th-inner {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;

        span {
          font-weight: bold;
        }
      }
    }
    th:first-child, td:first-child {
      width: 12%;
    }
    th:nth-child(2), td:nth-child(2),
    th:nth-child(3), td:nth-child(3),
    th:nth-child(4), td:nth-child(4),
    th:nth-child(5), td:nth-child(5),
    th:nth-child(6), td:nth-child(6),
    th:nth-child(7), td:nth-child(7),
    th:nth-child(8), td:nth-child(8),
    th:nth-child(9), td:nth-child(9),
    th:nth-child(10), td:nth-child(10),
    th:nth-child(11), td:nth-child(11),
    th:nth-child(12), td:nth-child(12) {
      width: 8%;
      text-align: center;
    }
  }
}
</style>