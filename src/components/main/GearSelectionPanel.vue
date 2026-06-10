<script setup lang="ts">
import { 
  JoinLeftOutlined,
  KeyboardArrowDownRound
} from '@vicons/material'
import Stepper from '../custom/general/Stepper.vue'
import GearSlot from '../custom/gear/GearSlot.vue'
import TooltipButton from '../custom/general/TooltipButton.vue'
import ModalSelectedGears from '../modals/ModalSelectedGears.vue'
import {
  XivGearAffixes,
  XivJobs,
  XivRoles,
  type HqDataVer
} from '@/assets/data'
import type { AttireAffix, AccessoryAffix, GearSelections } from '@/models/gears'
import { getDefaultGearSelections } from '@/models/gears'
import { useGearAdder } from '@/tools/gears'
import { useStore } from '@/store'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()

const gearSelections = defineModel<GearSelections>('gearSelections', { required: true })
export interface GearSelectionPanelProps {
  patchSelected: string
  jobId: number
  patchData?: HqDataVer
  attireAffix: AttireAffix
  accessoryAffix: AccessoryAffix
}
const props = defineProps<GearSelectionPanelProps>()
const emits = defineEmits(['joinWorkflow'])

const showSelectedGears = ref(false)

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
const getAffixesName = () => {
  const uiLanguage = store.userConfig?.language_ui ?? 'zh'
  const jobName = XivJobs?.[props.jobId]?.[`job_name_${uiLanguage}`] || t('main.select_gear.desc.un_selected')
  const attireName = XivGearAffixes?.[props.attireAffix]?.[`name_${uiLanguage}`] || t('main.select_gear.desc.un_selected')
  const accessoryName = XivGearAffixes?.[props.accessoryAffix]?.[`name_${uiLanguage}`] || t('main.select_gear.desc.un_selected')
  return { jobName, attireName, accessoryName }
}

const jobNotSelected = computed(() => {
  return !XivJobs?.[props.jobId]
})
const disableMainhand = computed(() => {
  return jobNotSelected.value || !props.patchData?.mainHand?.[props.jobId]
})
const disableOffhand = computed(() => {
  return jobNotSelected.value || !props.patchData?.offHand?.[props.jobId]
})
const disableAttire = computed(() => {
  return !XivGearAffixes?.[props.attireAffix]
})
const disableAccessory = computed(() => {
  return !XivGearAffixes?.[props.accessoryAffix]
})
const disableAllAttires = computed(() => {
  return disableAttire.value || (
    !props.patchData?.headAttire?.[props.attireAffix]
    && !props.patchData?.bodyAttire?.[props.attireAffix]
    && !props.patchData?.handsAttire?.[props.attireAffix]
    && !props.patchData?.legsAttire?.[props.attireAffix]
    && !props.patchData?.feetAttire?.[props.attireAffix]
  )
})
const disableAllAccessories = computed(() => {
  return disableAccessory.value || (
    !props.patchData?.earrings?.[props.accessoryAffix]
    && !props.patchData?.necklace?.[props.accessoryAffix]
    && !props.patchData?.wrist?.[props.accessoryAffix]
    && !props.patchData?.rings?.[props.accessoryAffix]
  )
})

// #region Slot Computeds
const createWeaponComputed = (key: "mainHand" | "offHand") => {
  return computed({
    get: () => {
      return gearSelections.value?.[key]?.[props.jobId] || 0
    },
    set: (value : number) => {
      if (!gearSelections.value) gearSelections.value = getDefaultGearSelections()
      if (!gearSelections.value[key]) gearSelections.value[key] = {}
      gearSelections.value[key][props.jobId] = value
    }
  })
}
const createAttireComputed = (key: "headAttire" | "bodyAttire" | "handsAttire" | "legsAttire" | "feetAttire") => {
  return computed({
    get: () => {
      return gearSelections.value?.[key]?.[props.attireAffix] || 0
    },
    set: (value : number) => {
      if (!gearSelections.value) gearSelections.value = getDefaultGearSelections()
      if (!gearSelections.value[key]) gearSelections.value[key] = {} as Record<AttireAffix, number>
      gearSelections.value[key][props.attireAffix] = value
    }
  })
}
const createAccessoryComputed = (key: "earrings" | "necklace" | "wrist" | "rings") => {
  return computed({
    get: () => {
      return gearSelections.value?.[key]?.[props.accessoryAffix] || 0
    },
    set: (value : number) => {
      if (!gearSelections.value) gearSelections.value = getDefaultGearSelections()
      if (!gearSelections.value[key]) gearSelections.value[key] = {} as Record<AccessoryAffix, number>
      gearSelections.value[key][props.accessoryAffix] = value
    }
  })
}
const MainHand = createWeaponComputed('mainHand')
const OffHand = createWeaponComputed('offHand')
const HeadAttire = createAttireComputed('headAttire')
const BodyAttire = createAttireComputed('bodyAttire')
const HandsAttire = createAttireComputed('handsAttire')
const LegsAttire = createAttireComputed('legsAttire')
const FeetAttire = createAttireComputed('feetAttire')
const Earrings = createAccessoryComputed('earrings')
const Necklace = createAccessoryComputed('necklace')
const Wrist = createAccessoryComputed('wrist')
const Rings = createAccessoryComputed('rings')
// #endregion

// #region Button Functions
const clearAll = () => {
  gearSelections.value = getDefaultGearSelections()
}
const clearCurrent = () => {
  if (jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  MainHand.value = 0
  OffHand.value = 0
  HeadAttire.value = 0
  BodyAttire.value = 0
  HandsAttire.value = 0
  LegsAttire.value = 0
  FeetAttire.value = 0
  Earrings.value = 0
  Necklace.value = 0
  Wrist.value = 0
  Rings.value = 0
}
const {
  addMainHand, addOffHand,
  addMainOffHand,
  addAttire,
  addAccessory
} = useGearAdder()
const addCurrMainOffHand = () => {
  if (jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  addMainOffHand(gearSelections, props.patchData, props.jobId)
}
const addCurrAttire = () => {
  if (jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  addAttire(gearSelections, props.patchData, props.attireAffix)
}
const addCurrAccessory = () => {
  if (jobNotSelected.value) {
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

// #region Dropdown Options
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
      description: t('main.select_gear.quick_operate.add_crafter_suit.tooltip.tooltip_1'),
    },
    { 
      key: 'add-gatherer-aaa', 
      label: t('main.select_gear.quick_operate.add_gatherer_suit.title'), 
      description: t('main.select_gear.quick_operate.add_gatherer_suit.tooltip.tooltip_1'),
    },
  ]
})
const handleQuickOperatesSelect = (key: string) => {
  if (jobNotSelected.value) {
    NAIVE_UI_MESSAGE.error(t('main.select_gear.warn.select_job_first')); return
  }
  if (key === 'add-crafter-main') {
    XivRoles.crafter.jobs.forEach(jobId => {
      addMainHand(gearSelections, props.patchData, jobId)
    })
  } else if (key === 'add-crafter-off') {
    XivRoles.crafter.jobs.forEach(jobId => {
      addOffHand(gearSelections, props.patchData, jobId)
    })
  } else if (key === 'add-crafter-mainoff') {
    XivRoles.crafter.jobs.forEach(jobId => {
      addMainOffHand(gearSelections, props.patchData, jobId)
    })
  } else if (key === 'add-gatherer-main') {
    XivRoles.gatherer.jobs.forEach(jobId => {
      addMainHand(gearSelections, props.patchData, jobId)
    })
  } else if (key === 'add-gatherer-off') {
    XivRoles.gatherer.jobs.forEach(jobId => {
      addOffHand(gearSelections, props.patchData, jobId)
    })
  } else if (key === 'add-gatherer-mainoff') {
    XivRoles.gatherer.jobs.forEach(jobId => {
      addMainOffHand(gearSelections, props.patchData, jobId)
    })
  } else if (key === 'add-crafter-aaa') {
    addAttire(gearSelections, props.patchData, XivRoles.crafter.attire as AttireAffix)
    addAccessory(gearSelections, props.patchData, XivRoles.crafter.accessory as AccessoryAffix)
  } else if (key === 'add-gatherer-aaa') {
    addAttire(gearSelections, props.patchData, XivRoles.gatherer.attire as AttireAffix)
    addAccessory(gearSelections, props.patchData, XivRoles.gatherer.accessory as AccessoryAffix)
  }
}

const clearOptions = computed(() => {
  return [
    { key: 'clear-current', label: t('main.select_gear.clear.current.title'), description: t('main.select_gear.clear.current.tooltip.tooltip_1') },
    { key: 'clear-all', label: t('main.select_gear.clear.all.title'), description: t('main.select_gear.clear.all.tooltip.tooltip_1') },
  ]
})
const handleClearSelect = (key: string) => {
  if (key === 'clear-current') {
    clearCurrent()
  } else if (key === 'clear-all') {
    clearAll()
  }
}

const addsuitOptions = computed(() => {
  return [
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
    },
  ]
})
const handleAddsuitSelect = (key: string) => {
  if (key === 'add-weapon') {
    addCurrMainOffHand()
  } else if (key === 'add-attire') {
    addCurrAttire()
  } else if (key === 'add-accessory') {
    addCurrAccessory()
  } else if (key === 'add-attire-and-accessory') {
    addAttireAndAccessory()
  } else if (key === 'add-suit') {
    addAll()
  }
}

defineExpose({
  addCurrMainOffHand
})
</script>

<template>
  <FoldableCard card-key="game-gear-selection">
    <template #header>
      <i class="xiv square-3"></i>
      <span class="card-title-text">{{ t('main.select_gear.title') }}</span>
      <n-popover placement="bottom-start" :trigger="isMobile ? 'click' : 'hover'">
        <template #trigger>
          <span class="card-title-desc">{{ selectedAffixes }}</span>
        </template>
        <div>
          <p v-for="(tip, index) in affixesTips" :key="'title-tip' + index">
            {{ tip }}
          </p>
        </div>
      </n-popover>
    </template>
    
    <div class="gear-selection-containter">
      <n-alert
        v-if="jobNotSelected"
        type="warning"
        style="margin-bottom: 10px;"
      >
        {{ t('main.select_gear.warn.select_job_first') }}
      </n-alert>

      <table>
        <tbody>
          <tr>
            <td>
              <GearSlot
                gear-slot="mainHand"
                :slot-description="t('game.gear.tool.mainhand.detailed')"
                :related-item="patchData?.mainHand?.[jobId] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="MainHand" :disabled="disableMainhand" /></td>
            <td>
              <GearSlot
                gear-slot="offHand"
                :slot-description="t('game.gear.tool.offhand.detailed')"
                :related-item="patchData?.offHand?.[jobId] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="OffHand" :disabled="disableOffhand" /></td>
          </tr>

          <tr class="divider">
            <td colspan="4"><n-divider dashed /></td>
          </tr>

          <tr>
            <td style="min-width: 40px;">
              <GearSlot
                gear-slot="headAttire"
                :slot-description="t('game.gear.attire.head.detailed')"
                :related-item="patchData?.headAttire?.[attireAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="HeadAttire" :disabled="disableAttire || !patchData?.headAttire?.[attireAffix]" /></td>
            <td style="min-width: 40px;">
              <GearSlot
                gear-slot="earrings"
                :slot-description="t('game.gear.accessory.earring.detailed')"
                :related-item="patchData?.earrings?.[accessoryAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="Earrings" :disabled="disableAccessory || !patchData?.earrings?.[accessoryAffix]" /></td>
          </tr>

          <tr>
            <td>
              <GearSlot
                gear-slot="bodyAttire"
                :slot-description="t('game.gear.attire.body.detailed')"
                :related-item="patchData?.bodyAttire?.[attireAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="BodyAttire" :disabled="disableAttire || !patchData?.bodyAttire?.[attireAffix]" /></td>
            <td>
              <GearSlot
                gear-slot="necklace"
                :slot-description="t('game.gear.accessory.necklace.detailed')"
                :related-item="patchData?.necklace?.[accessoryAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="Necklace" :disabled="disableAccessory || !patchData?.necklace?.[accessoryAffix]" /></td>
          </tr>

          <tr>
            <td>
              <GearSlot
                gear-slot="handsAttire"
                :slot-description="t('game.gear.attire.hands.detailed')"
                :related-item="patchData?.handsAttire?.[attireAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="HandsAttire" :disabled="disableAttire || !patchData?.handsAttire?.[attireAffix]" /></td>
            <td>
              <GearSlot
                gear-slot="wrist"
                :slot-description="t('game.gear.accessory.wrist.detailed')"
                :related-item="patchData?.wrist?.[accessoryAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="Wrist" :disabled="disableAccessory || !patchData?.wrist?.[accessoryAffix]" /></td>
          </tr>

          <tr>
            <td>
              <GearSlot
                gear-slot="legsAttire"
                :slot-description="t('game.gear.attire.legs.detailed')"
                :related-item="patchData?.legsAttire?.[attireAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="LegsAttire" :disabled="disableAttire || !patchData?.legsAttire?.[attireAffix]" /></td>
            <td>
              <GearSlot
                gear-slot="rings"
                :slot-description="t('game.gear.accessory.rings.detailed')"
                :related-item="patchData?.rings?.[accessoryAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="Rings" :disabled="disableAccessory || !patchData?.rings?.[accessoryAffix]" /></td>
          </tr>

          <tr>
            <td>
              <GearSlot
                gear-slot="feetAttire"
                :slot-description="t('game.gear.attire.feet.detailed')"
                :related-item="patchData?.feetAttire?.[attireAffix] ?? 0"
              />
            </td>
            <td><Stepper v-model:value="FeetAttire" :disabled="disableAttire || !patchData?.feetAttire?.[attireAffix]" /></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="bottom-buttons">
        <div class="content">
          <n-button-group class="end">
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
        <n-divider dashed />
        <n-flex class="foot" justify="end">
          <n-popover
            v-if="displayQuickOperates"
            placement="bottom"
            :trigger="isMobile ? 'click' : 'hover'"
            :show-arrow="false"
            class="select-none"
            style="--n-padding: 4px;"
          >
            <template #trigger>
              <n-button
                icon-placement="right"
                :disabled="jobNotSelected"
              >
                <template #icon>
                  <n-icon><KeyboardArrowDownRound /></n-icon>
                </template>
                {{ t('main.select_gear.quick_operate.title') }}
              </n-button>
            </template>
            <div class="flex flex-col gap-0.5">
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
            </div>
          </n-popover>
          <n-popover
            placement="bottom"
            :trigger="isMobile ? 'click' : 'hover'"
            :show-arrow="false"
            class="select-none"
            style="--n-padding: 4px;"
          >
            <template #trigger>
              <n-button
                icon-placement="right"
                :disabled="jobNotSelected"
              >
                <template #icon>
                  <n-icon><KeyboardArrowDownRound /></n-icon>
                </template>
                {{ t('common.clear') }}
              </n-button>
            </template>
            <div class="flex flex-col gap-0.5">
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
            </div>
          </n-popover>
          <n-popover
            placement="bottom"
            :trigger="isMobile ? 'click' : 'hover'"
            :show-arrow="false"
            class="select-none"
            style="--n-padding: 4px;"
          >
            <template #trigger>
              <n-button
                icon-placement="right"
                :disabled="jobNotSelected"
              >
                <template #icon>
                  <n-icon><KeyboardArrowDownRound /></n-icon>
                </template>
                {{ t('common.add') }}
              </n-button>
            </template>
            <div class="flex flex-col gap-0.5">
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
            </div>
          </n-popover>
        </n-flex>
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
.gear-selection-containter {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.card-title-desc {
  margin-left: 10px;
  font-size: 14px;
}
table {
  width: 100%;

  td {
    text-align: center;
  }
}
.n-divider {
  margin: 3px 0;
}
.bottom-buttons {
  margin-top: 1em;
  margin-right: 3px;
  
  .content {
    display: flex;
    justify-content: end;
    margin-bottom: 6px;
  }
  .foot {
    margin-top: 6px;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .bottom-buttons {
    margin-top: auto;
  }
}
</style>
