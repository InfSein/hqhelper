<script setup lang="ts">
import type { WritableComputedRef } from 'vue'
import {
  JoinLeftOutlined,
} from '@vicons/material'
import GearSlot from '@/components/GearSlot.vue'
import Stepper from '@/components/ui/Stepper.vue'
import TooltipButton from '@/components/ui/TooltipButton.vue'
import DropdownActionMenu from '@/components/ui/DropdownActionMenu.vue'
import ModalSelectedGears from '@/views/main/components/ModalSelectedGears.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { XivGearAffixes, XivJobs, XivRoles, type HqDataVer } from '@/assets/data'
import { useGearAdder } from '@/tools/game/gear'
import { type AttireAffix, type AccessoryAffix, type GearSelections, type GearSlot as GearSlotType, fixGearSelections } from '@/types/game/gear'

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()
const NAIVE_UI_MESSAGE = useMessage()

const gearSelections = defineModel<GearSelections>('gearSelections', { required: true })
export interface GearSelectionPanelProps {
  patchSelected: string | undefined
  jobId: number | undefined
  patchData?: HqDataVer
  attireAffix: AttireAffix | ''
  accessoryAffix: AccessoryAffix | ''
}
const props = defineProps<GearSelectionPanelProps>()
const emits = defineEmits(['joinWorkflow'])

const showSelectedGears = ref(false)

// #region Affixes Information
const getAffixesName = () => {
  const uiLanguage = store.userConfig?.language_ui ?? 'zh'
  const names = {
    jobName: t('main.select_gear.desc.un_selected'),
    attireName: t('main.select_gear.desc.un_selected'),
    accessoryName: t('main.select_gear.desc.un_selected')
  }
  if (props.jobId) names.jobName = XivJobs?.[props.jobId]?.[`job_name_${uiLanguage}`]
  if (props.attireAffix) names.attireName = XivGearAffixes?.[props.attireAffix]?.[`name_${uiLanguage}`]
  if (props.accessoryAffix) names.accessoryName = XivGearAffixes?.[props.accessoryAffix]?.[`name_${uiLanguage}`]
  return names
}

const selectedAffixes = computed(() => {
  const { jobName, attireName, accessoryName } = getAffixesName()
  return `[${jobName}/${attireName}/${accessoryName}]`
})

const affixesTips = computed(() => {
  const { jobName, attireName, accessoryName } = getAffixesName()
  return [
    t('main.select_gear.info.info_1'),
    t('main.select_gear.info.info_2', jobName),
    t('main.select_gear.info.info_3', attireName),
    t('main.select_gear.info.info_4', accessoryName)
  ]
})
// #endregion

// #region Disabled State Computeds
const jobNotSelected = computed(() => !props.jobId || !XivJobs?.[props.jobId])
const disableMainhand = computed(() => !props.jobId || jobNotSelected.value || !props.patchData?.mainHand?.[props.jobId])
const disableOffhand = computed(() => !props.jobId || jobNotSelected.value || !props.patchData?.offHand?.[props.jobId])
const disableAttire = computed(() => !props.attireAffix || !XivGearAffixes?.[props.attireAffix])
const disableAccessory = computed(() => !props.accessoryAffix || !XivGearAffixes?.[props.accessoryAffix])

const disableAllAttires = computed(() => {
  return !props.attireAffix || disableAttire.value || (
    !props.patchData?.headAttire?.[props.attireAffix]
    && !props.patchData?.bodyAttire?.[props.attireAffix]
    && !props.patchData?.handsAttire?.[props.attireAffix]
    && !props.patchData?.legsAttire?.[props.attireAffix]
    && !props.patchData?.feetAttire?.[props.attireAffix]
  )
})
const disableAllAccessories = computed(() => {
  return !props.accessoryAffix || disableAccessory.value || (
    !props.patchData?.earrings?.[props.accessoryAffix]
    && !props.patchData?.necklace?.[props.accessoryAffix]
    && !props.patchData?.wrist?.[props.accessoryAffix]
    && !props.patchData?.rings?.[props.accessoryAffix]
  )
})
// #endregion

// #region Slot Computeds Factory
const createWeaponComputed = (key: 'mainHand' | 'offHand') => {
  return computed({
    get: () => {
      return gearSelections.value?.[key]?.[props.jobId ?? 0] || 0
    },
    set: (value: number) => {
      if (!gearSelections.value) gearSelections.value = fixGearSelections()
      if (!gearSelections.value[key]) gearSelections.value[key] = {}
      gearSelections.value[key][props.jobId ?? 0] = value
    }
  })
}

const createAttireComputed = (key: 'headAttire' | 'bodyAttire' | 'handsAttire' | 'legsAttire' | 'feetAttire') => {
  return computed({
    get: () => {
      if (!props.attireAffix) return 0
      return gearSelections.value?.[key]?.[props.attireAffix] || 0
    },
    set: (value: number) => {
      if (!props.attireAffix) return
      if (!gearSelections.value) gearSelections.value = fixGearSelections()
      if (!gearSelections.value[key]) gearSelections.value[key] = {} as Record<AttireAffix, number>
      gearSelections.value[key][props.attireAffix] = value
    }
  })
}

const createAccessoryComputed = (key: 'earrings' | 'necklace' | 'wrist' | 'rings') => {
  return computed({
    get: () => {
      if (!props.accessoryAffix) return 0
      return gearSelections.value?.[key]?.[props.accessoryAffix] || 0
    },
    set: (value: number) => {
      if (!props.accessoryAffix) return
      if (!gearSelections.value) gearSelections.value = fixGearSelections()
      if (!gearSelections.value[key]) gearSelections.value[key] = {} as Record<AccessoryAffix, number>
      gearSelections.value[key][props.accessoryAffix] = value
    }
  })
}

const slotComputeds: Record<GearSlotType, WritableComputedRef<number>> = {
  mainHand: createWeaponComputed('mainHand'),
  offHand: createWeaponComputed('offHand'),
  headAttire: createAttireComputed('headAttire'),
  bodyAttire: createAttireComputed('bodyAttire'),
  handsAttire: createAttireComputed('handsAttire'),
  legsAttire: createAttireComputed('legsAttire'),
  feetAttire: createAttireComputed('feetAttire'),
  earrings: createAccessoryComputed('earrings'),
  necklace: createAccessoryComputed('necklace'),
  wrist: createAccessoryComputed('wrist'),
  rings: createAccessoryComputed('rings')
}
// #endregion

// #region Slot Grid Configuration
interface SlotConfig {
  gearSlot: GearSlotType
  slotDescription: string
  relatedItem: number
  computedValue: WritableComputedRef<number>
  disabled: boolean
}

interface SlotRowConfig {
  left: SlotConfig
  right?: SlotConfig
}

const getRelatedItem = (gearSlot: GearSlotType): number => {
  if (gearSlot === 'mainHand' || gearSlot === 'offHand') {
    return props.patchData?.[gearSlot]?.[props.jobId ?? 0] ?? 0
  }
  if (['headAttire', 'bodyAttire', 'handsAttire', 'legsAttire', 'feetAttire'].includes(gearSlot)) {
    const key = gearSlot as 'headAttire' | 'bodyAttire' | 'handsAttire' | 'legsAttire' | 'feetAttire'
    return props.attireAffix ? (props.patchData?.[key]?.[props.attireAffix] ?? 0) : 0
  }
  const key = gearSlot as 'earrings' | 'necklace' | 'wrist' | 'rings'
  return props.accessoryAffix ? (props.patchData?.[key]?.[props.accessoryAffix] ?? 0) : 0
}

const getSlotDisabled = (gearSlot: GearSlotType): boolean => {
  if (gearSlot === 'mainHand') return disableMainhand.value
  if (gearSlot === 'offHand') return disableOffhand.value
  if (['headAttire', 'bodyAttire', 'handsAttire', 'legsAttire', 'feetAttire'].includes(gearSlot)) {
    const key = gearSlot as 'headAttire' | 'bodyAttire' | 'handsAttire' | 'legsAttire' | 'feetAttire'
    return !props.attireAffix || disableAttire.value || !props.patchData?.[key]?.[props.attireAffix]
  }
  const key = gearSlot as 'earrings' | 'necklace' | 'wrist' | 'rings'
  return !props.accessoryAffix || disableAccessory.value || !props.patchData?.[key]?.[props.accessoryAffix]
}

const createSlotConfig = (gearSlot: GearSlotType, descKey: string): SlotConfig => ({
  gearSlot,
  slotDescription: t(descKey),
  relatedItem: getRelatedItem(gearSlot),
  computedValue: slotComputeds[gearSlot],
  disabled: getSlotDisabled(gearSlot)
})

const weaponRow = computed<SlotRowConfig>(() => ({
  left: createSlotConfig('mainHand', 'game.gear.tool.mainhand.detailed'),
  right: createSlotConfig('offHand', 'game.gear.tool.offhand.detailed')
}))

const attireAccessoryRows = computed<SlotRowConfig[]>(() => [
  {
    left: createSlotConfig('headAttire', 'game.gear.attire.head.detailed'),
    right: createSlotConfig('earrings', 'game.gear.accessory.earring.detailed')
  },
  {
    left: createSlotConfig('bodyAttire', 'game.gear.attire.body.detailed'),
    right: createSlotConfig('necklace', 'game.gear.accessory.necklace.detailed')
  },
  {
    left: createSlotConfig('handsAttire', 'game.gear.attire.hands.detailed'),
    right: createSlotConfig('wrist', 'game.gear.accessory.wrist.detailed')
  },
  {
    left: createSlotConfig('legsAttire', 'game.gear.attire.legs.detailed'),
    right: createSlotConfig('rings', 'game.gear.accessory.rings.detailed')
  },
  {
    left: createSlotConfig('feetAttire', 'game.gear.attire.feet.detailed')
  }
])
// #endregion

// #region Button Functions & Gear Adder
const clearAll = () => {
  gearSelections.value = fixGearSelections()
}
const clearCurrent = () => {
  if (jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  Object.values(slotComputeds).forEach(comp => { comp.value = 0 })
}

const {
  addMainHand, addOffHand,
  addMainOffHand,
  addAttire,
  addAccessory
} = useGearAdder()

const addCurrMainOffHand = () => {
  if (!props.jobId || jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  addMainOffHand(gearSelections, props.patchData, props.jobId)
}
const addCurrAttire = () => {
  if (!props.attireAffix || jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  addAttire(gearSelections, props.patchData, props.attireAffix)
}
const addCurrAccessory = () => {
  if (!props.accessoryAffix || jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  addAccessory(gearSelections, props.patchData, props.accessoryAffix)
}
const addAttireAndAccessory = () => {
  if (jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  addCurrAttire()
  addCurrAccessory()
}
const addAll = () => {
  if (jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  addCurrMainOffHand()
  addAttireAndAccessory()
}
const handleJoinWorkflow = () => {
  emits('joinWorkflow')
}
// #endregion

// #region Dropdown Options & Actions
const displayQuickOperates = computed(() => {
  // * 简单算法，有刻木主手代表是有生产采集新装的版本
  return !!props.patchData?.mainHand?.[8]
})

const quickOperatesOptions = computed(() => {
  const mainoffOptions = store.userConfig.split_quick_operate_options_main_off
    ? [
      {
        key: 'add-crafter-main',
        label: t('main.select_gear.quick_operate.add_crafter_tool_main.title'),
        description: t('main.select_gear.quick_operate.add_crafter_tool_main.tooltip.tooltip_1')
      },
      {
        key: 'add-crafter-off',
        label: t('main.select_gear.quick_operate.add_crafter_tool_off.title'),
        description: t('main.select_gear.quick_operate.add_crafter_tool_off.tooltip.tooltip_1')
      },
      {
        key: 'add-gatherer-main',
        label: t('main.select_gear.quick_operate.add_gatherer_tool_main.title'),
        description: t('main.select_gear.quick_operate.add_gatherer_tool_main.tooltip.tooltip_1')
      },
      {
        key: 'add-gatherer-off',
        label: t('main.select_gear.quick_operate.add_gatherer_tool_off.title'),
        description: t('main.select_gear.quick_operate.add_gatherer_tool_off.tooltip.tooltip_1')
      },
    ]
    : [
      {
        key: 'add-crafter-mainoff',
        label: t('main.select_gear.quick_operate.add_crafter_tool.title'),
        description: t('main.select_gear.quick_operate.add_crafter_tool.tooltip.tooltip_1')
      },
      {
        key: 'add-gatherer-mainoff',
        label: t('main.select_gear.quick_operate.add_gatherer_tool.title'),
        description: t('main.select_gear.quick_operate.add_gatherer_tool.tooltip.tooltip_1')
      },
    ]
  return [
    ...mainoffOptions,
    {
      key: 'add-crafter-aaa',
      label: t('main.select_gear.quick_operate.add_crafter_suit.title'),
      description: t('main.select_gear.quick_operate.add_crafter_suit.tooltip.tooltip_1')
    },
    {
      key: 'add-gatherer-aaa',
      label: t('main.select_gear.quick_operate.add_gatherer_suit.title'),
      description: t('main.select_gear.quick_operate.add_gatherer_suit.tooltip.tooltip_1')
    },
  ]
})

const quickOperateHandlers: Record<string, () => void> = {
  'add-crafter-main': () => XivRoles.crafter.jobs.forEach(j => addMainHand(gearSelections, props.patchData, j)),
  'add-crafter-off': () => XivRoles.crafter.jobs.forEach(j => addOffHand(gearSelections, props.patchData, j)),
  'add-crafter-mainoff': () => XivRoles.crafter.jobs.forEach(j => addMainOffHand(gearSelections, props.patchData, j)),
  'add-gatherer-main': () => XivRoles.gatherer.jobs.forEach(j => addMainHand(gearSelections, props.patchData, j)),
  'add-gatherer-off': () => XivRoles.gatherer.jobs.forEach(j => addOffHand(gearSelections, props.patchData, j)),
  'add-gatherer-mainoff': () => XivRoles.gatherer.jobs.forEach(j => addMainOffHand(gearSelections, props.patchData, j)),
  'add-crafter-aaa': () => {
    addAttire(gearSelections, props.patchData, XivRoles.crafter.attire as AttireAffix)
    addAccessory(gearSelections, props.patchData, XivRoles.crafter.accessory as AccessoryAffix)
  },
  'add-gatherer-aaa': () => {
    addAttire(gearSelections, props.patchData, XivRoles.gatherer.attire as AttireAffix)
    addAccessory(gearSelections, props.patchData, XivRoles.gatherer.accessory as AccessoryAffix)
  }
}

const handleQuickOperatesSelect = (key: string) => {
  if (jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  quickOperateHandlers[key]?.()
}

const clearOptions = computed(() => [
  { key: 'clear-current', label: t('main.select_gear.clear.current.title'), description: t('main.select_gear.clear.current.tooltip.tooltip_1') },
  { key: 'clear-all', label: t('main.select_gear.clear.all.title'), description: t('main.select_gear.clear.all.tooltip.tooltip_1') }
])

const clearHandlers: Record<string, () => void> = {
  'clear-current': clearCurrent,
  'clear-all': clearAll
}

const handleClearSelect = (key: string) => {
  clearHandlers[key]?.()
}

const addsuitOptions = computed(() => [
  {
    key: 'add-weapon',
    label: t('main.select_gear.add.mainoff_hand'),
    disabled: disableMainhand.value && disableOffhand.value
  },
  {
    key: 'add-attire',
    label: t('main.select_gear.add.attire'),
    disabled: disableAllAttires.value
  },
  {
    key: 'add-accessory',
    label: t('main.select_gear.add.accessory'),
    disabled: disableAllAccessories.value
  },
  {
    key: 'add-attire-and-accessory',
    label: t('main.select_gear.add.attire_and_accessory'),
    disabled: disableAllAttires.value && disableAllAccessories.value
  },
  {
    key: 'add-suit',
    label: t('main.select_gear.add.whole_suit'),
    disabled: disableMainhand.value && disableOffhand.value && disableAllAttires.value && disableAllAccessories.value
  }
])

const addsuitHandlers: Record<string, () => void> = {
  'add-weapon': addCurrMainOffHand,
  'add-attire': addCurrAttire,
  'add-accessory': addCurrAccessory,
  'add-attire-and-accessory': addAttireAndAccessory,
  'add-suit': addAll
}

const handleAddsuitSelect = (key: string) => {
  addsuitHandlers[key]?.()
}

defineExpose({
  addCurrMainOffHand
})
// #endregion
</script>

<template>
  <FoldableCard card-key="game-gear-selection">
    <template #header>
      <i class="xiv square-3"></i>
      <span class="app-card-title__text">{{ t('main.select_gear.title') }}</span>
      <n-popover placement="bottom-start" :trigger="isMobile ? 'click' : 'hover'">
        <template #trigger>
          <span class="ml-2.5 text-[14px]">{{ selectedAffixes }}</span>
        </template>
        <div>
          <p v-for="(tip, index) in affixesTips" :key="'title-tip' + index">
            {{ tip }}
          </p>
        </div>
      </n-popover>
    </template>

    <div class="h-full flex flex-col">
      <n-alert
        v-if="jobNotSelected"
        type="warning"
        class="mb-2.5"
      >
        {{ t('main.select_gear.warn.select_job_first') }}
      </n-alert>

      <table class="w-full [&_td]:text-center [&_td]:min-w-10">
        <tbody>
          <tr>
            <td>
              <GearSlot
                :gear-slot="weaponRow.left.gearSlot"
                :slot-description="weaponRow.left.slotDescription"
                :related-item="weaponRow.left.relatedItem"
              />
            </td>
            <td>
              <Stepper
                :value="weaponRow.left.computedValue.value"
                @update:value="(val) => (weaponRow.left.computedValue.value = val)"
                :disabled="weaponRow.left.disabled"
              />
            </td>
            <td>
              <GearSlot
                :gear-slot="weaponRow.right!.gearSlot"
                :slot-description="weaponRow.right!.slotDescription"
                :related-item="weaponRow.right!.relatedItem"
              />
            </td>
            <td>
              <Stepper
                :value="weaponRow.right!.computedValue.value"
                @update:value="(val) => (weaponRow.right!.computedValue.value = val)"
                :disabled="weaponRow.right!.disabled"
              />
            </td>
          </tr>

          <tr class="divider">
            <td colspan="4"><n-divider dashed class="my-0.75!" /></td>
          </tr>

          <tr v-for="(row, idx) in attireAccessoryRows" :key="idx">
            <td>
              <GearSlot
                :gear-slot="row.left.gearSlot"
                :slot-description="row.left.slotDescription"
                :related-item="row.left.relatedItem"
              />
            </td>
            <td>
              <Stepper
                :value="row.left.computedValue.value"
                @update:value="(val) => (row.left.computedValue.value = val)"
                :disabled="row.left.disabled"
              />
            </td>
            <template v-if="row.right">
              <td>
                <GearSlot
                  :gear-slot="row.right.gearSlot"
                  :slot-description="row.right.slotDescription"
                  :related-item="row.right.relatedItem"
                />
              </td>
              <td>
                <Stepper
                  :value="row.right.computedValue.value"
                  @update:value="(val) => (row.right!.computedValue.value = val)"
                  :disabled="row.right.disabled"
                />
              </td>
            </template>
            <template v-else>
              <td></td>
              <td></td>
            </template>
          </tr>
        </tbody>
      </table>

      <div class="mt-8 mr-0.75 max-md:mt-auto">
        <div class="flex justify-end mb-1.5">
          <n-button-group>
            <n-button
              :disabled="jobNotSelected"
              @click="showSelectedGears = true"
            >
              {{ t('main.select_gear.view_selected') }}
            </n-button>
            <n-popover :trigger="isMobile ? 'manual' : 'hover'" placement="top">
              <template #trigger>
                <n-button
                  class="n-square-button"
                  :disabled="jobNotSelected"
                  @click="handleJoinWorkflow"
                >
                  <n-icon :size="16"><JoinLeftOutlined /></n-icon>
                </n-button>
              </template>
              <div class="descriptions">
                <div>{{ t('workflow.join_in_workflow.entry_btn.tooltip') }}</div>
              </div>
            </n-popover>
          </n-button-group>
        </div>
        <n-divider dashed class="my-0.75!" />
        <div class="flex flex-wrap mt-1.5 justify-end gap-x-3 gap-y-2">
          <DropdownActionMenu
            v-if="displayQuickOperates"
            :label="t('main.select_gear.quick_operate.title')"
            :disabled="jobNotSelected"
          >
            <TooltipButton
              v-for="option in quickOperatesOptions"
              :key="option.key"
              quaternary
              :text="option.label"
              :tip="option.description"
              tip-type="n-tooltip"
              placement="right"
              btn-style="justify-content: start; --n-padding: 8px 16px; --n-height: auto;"
              pop-style="width: max-content;"
              @click="handleQuickOperatesSelect(option.key)"
            />
          </DropdownActionMenu>

          <DropdownActionMenu
            :label="t('common.clear')"
            :disabled="jobNotSelected"
          >
            <TooltipButton
              v-for="option in clearOptions"
              :key="option.key"
              quaternary
              :text="option.label"
              :tip="option.description"
              tip-type="n-tooltip"
              placement="right"
              pop-style="width: max-content;"
              @click="handleClearSelect(option.key)"
            />
          </DropdownActionMenu>

          <DropdownActionMenu
            :label="t('common.add')"
            :disabled="jobNotSelected"
          >
            <n-button
              v-for="option in addsuitOptions"
              :key="option.key"
              quaternary
              :disabled="option.disabled"
              style="justify-content: start;"
              @click="handleAddsuitSelect(option.key)"
            >
              {{ option.label }}
            </n-button>
          </DropdownActionMenu>
        </div>
      </div>
    </div>

    <ModalSelectedGears
      v-model:show="showSelectedGears"
      v-model:gear-selections="gearSelections"
      :patch-data="patchData"
    />
  </FoldableCard>
</template>

<style scoped>
</style>
