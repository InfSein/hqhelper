<script setup lang="ts">
import { 
  CheckroomSharp, SaveOutlined
} from '@vicons/material'
import XivFARImage from '../custom/general/XivFARImage.vue'
import {
  XivGearAffixes,
  XivRoles, type XivRole,
  XivJobs,
  type HqDataVer
} from '@/assets/data'
import type { GearSelections, AttireAffix, AccessoryAffix } from '@/types/game/gear'
import { attireAffixes, accessoryAffixes } from '@/types/game/gear'
import { deepCopy } from '@/tools'
import { getGearIcon } from '@/tools/gears'
import useConfig from '@/composables/useConfig.ts'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const {
  uiLanguage,
} = useConfig()
  
const props = defineProps({
  patchData: {
    type: Object as PropType<HqDataVer | undefined>,
    required: false // prevent vue warn `Expected Object, got Undefined`
  }
})
// const jobIds = Object.keys(XivJobs).map(jobId => parseInt(jobId))
const getAffixName = (affix: AttireAffix | AccessoryAffix) => {
  return XivGearAffixes[affix][`name_${uiLanguage.value}`]
}
const attireGearSlots = computed(() => {
  return [
    { key: 'headAttire', text: t('game.gear.attire.head.title'), icon: getGearIcon('headAttire') },
    { key: 'bodyAttire', text: t('game.gear.attire.body.title'), icon: getGearIcon('bodyAttire') },
    { key: 'handsAttire', text: t('game.gear.attire.hands.title'), icon: getGearIcon('handsAttire') },
    { key: 'legsAttire', text: t('game.gear.attire.legs.title'), icon: getGearIcon('legsAttire') },
    { key: 'feetAttire', text: t('game.gear.attire.feet.title'), icon: getGearIcon('feetAttire') },
  ]
})
const accessoryGearSlots = computed(() => {
  return [
    { key: 'earrings', text: t('game.gear.accessory.earring.title'), icon: getGearIcon('earrings') },
    { key: 'necklace', text: t('game.gear.accessory.necklace.title'), icon: getGearIcon('necklace') },
    { key: 'wrist', text: t('game.gear.accessory.wrist.title'), icon: getGearIcon('wrist') },
    { key: 'rings', text: t('game.gear.accessory.rings.title'), icon: getGearIcon('rings') },
  ]
})

const showModal = defineModel<boolean>('show', { required: true })
const gearSelections = defineModel<GearSelections>('gearSelections', { required: true })

const pageHeight = ref(window.innerHeight)
const localSelections = ref<GearSelections>(gearSelections.value)

const onLoad = () => {
  localSelections.value = deepCopy(gearSelections.value)
  pageHeight.value = window.innerHeight
}

const getRoleName = (role: any) => {
  switch (uiLanguage.value) {
    case 'ja':
      return role.role_name_ja
    case 'en':
      return role.role_name_en
    default:
      return role.role_name_zh
  }
}
const getJobName = (jobId: number) => {
  const _job = XivJobs[jobId]
  switch (uiLanguage.value) {
    case 'ja':
      return _job.job_name_ja
    case 'en':
      return _job.job_name_en
    default:
      return _job.job_name_zh
  }
}

const getVShowOfMainoffHandGroup = (role: XivRole) => {
  return role.jobs.some(jobId => props.patchData?.mainHand?.[jobId] || props.patchData?.offHand?.[jobId])
}
const getVShowOfAttireAffixRow = (attire: AttireAffix) => {
  return props.patchData?.headAttire?.[attire]
    || props.patchData?.bodyAttire?.[attire]
    || props.patchData?.handsAttire?.[attire]
    || props.patchData?.legsAttire?.[attire]
    || props.patchData?.feetAttire?.[attire]
}
const getVShowOfAccessoryAffixRow = (accessory: AccessoryAffix) => {
  return props.patchData?.earrings?.[accessory]
    || props.patchData?.necklace?.[accessory]
    || props.patchData?.wrist?.[accessory]
    || props.patchData?.rings?.[accessory]
}

const handleClose = () => {
  showModal.value = false
}

const handleSave = () => {
  for (const _id in localSelections.value.mainHand) {
    const id = Number(_id)
    if (props.patchData?.offHand?.[id]) {
      localSelections.value.offHand[id] = localSelections.value.mainHand[id]
    }
  }
  gearSelections.value = deepCopy(localSelections.value)
  handleClose()
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="CheckroomSharp"
    :title="t('main.select_gear.view_selected')"
    max-width="1500px"
    :height="(pageHeight - (isMobile ? 165 : 80)) + 'px'"
    content-extra-style="overflow-y: auto;"
    @on-load="onLoad"
  >
    <div class="wrapper" v-if="!isMobile">
      <div class="weapons">
        <n-card size="small" :title="t('game.gear.tool.mainoff_hand')">
          <div class="weapons-container">
            <GroupBox
              class="weapon-group"
              v-for="(role, roleIndex) in XivRoles"
              :key="roleIndex"
              v-show="getVShowOfMainoffHandGroup(role)"
              :border-color="role.role_color"
            >
              <template #title>
                <XivFARImage
                  :src="role.role_icon_url"
                  :size="14"
                />
                <span>
                  {{ getRoleName(role) }}
                </span>
              </template>

              <div class="input-container">
                <p v-for="job in role.jobs" :key="'weapon-mainhand-' + job">
                  <n-input-number
                    v-model:value="localSelections.mainHand[job]"
                    :input-props="{ type: 'number' }"
                    :min="0"
                    :max="99999"
                    :precision="0"
                    :title="getJobName(job)"
                    :show-button="!isMobile"
                    :disabled="!patchData?.mainHand?.[job] && !patchData?.offHand?.[job]"
                  >
                    <template #prefix>
                      <XivFARImage 
                        :src="XivJobs[job].job_icon_url"
                        :size="15"
                      />
                    </template>
                  </n-input-number>
                </p>
              </div>
            </GroupBox>
          </div>
        </n-card>
      </div>
      <div class="attires">
        <n-card size="small" :title="t('game.gear.attire.title')">
          <n-table class="attires-table" size="small" :single-line="false">
            <thead>
              <tr>
                <th>{{ t('game.gear.affix') }}</th>
                <th
                  v-for="attire in attireGearSlots"
                  :key="'th-attire-' + attire.key"
                >
                  <div class="th-inner">
                    <n-icon size="15" color="var(--color-text)">
                      <component :is="attire.icon" />
                    </n-icon>
                    <span>{{ attire.text }}</span>
                  </div>
                </th>
              </tr>
            </thead>
          </n-table>
          <n-scrollbar trigger="none" :style="{ height: isMobile ? '90px' : '240px', 'margin-top': '-2px' }">
            <n-table class="attires-table" size="small" :single-line="false">
              <tbody>
                <tr
                  v-for="attire in attireAffixes"
                  :key="'row-attire-' + attire"
                  v-show="getVShowOfAttireAffixRow(attire)"
                >
                  <td>{{ getAffixName(attire) }}</td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.headAttire[attire]"
                      :disabled="!patchData?.headAttire?.[attire]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.bodyAttire[attire]"
                      :disabled="!patchData?.bodyAttire?.[attire]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.handsAttire[attire]"
                      :disabled="!patchData?.handsAttire?.[attire]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.legsAttire[attire]"
                      :disabled="!patchData?.legsAttire?.[attire]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.feetAttire[attire]"
                      :disabled="!patchData?.feetAttire?.[attire]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                </tr>
              </tbody>
            </n-table>
          </n-scrollbar>
        </n-card>
      </div>
      <div class="accessories">
        <n-card size="small" :title="t('game.gear.accessory.title')">
          <n-table class="accessories-table" size="small" :single-line="false">
            <thead>
              <tr>
                <th>{{ t('game.gear.affix') }}</th>
                <th
                  v-for="accessory in accessoryGearSlots"
                  :key="'th-accessory-' + accessory.key"
                >
                  <div class="th-inner">
                    <n-icon size="15" color="var(--color-text)">
                      <component :is="accessory.icon" />
                    </n-icon>
                    <span>{{ accessory.text }}</span>
                  </div>
                </th>
                <th v-if="!isMobile"></th>
              </tr>
            </thead>
          </n-table>
          <n-scrollbar trigger="none" :style="{ height: isMobile ? '90px' : '200px', 'margin-top': '-2px' }">
            <n-table class="accessories-table" size="small" :single-line="false">
              <tbody>
                <tr
                  v-for="accessory in accessoryAffixes"
                  :key="'row-accessory-' + accessory"
                  v-show="getVShowOfAccessoryAffixRow(accessory)"
                >
                  <td>{{ getAffixName(accessory) }}</td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.earrings[accessory]"
                      :disabled="!patchData?.earrings?.[accessory]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.necklace[accessory]"
                      :disabled="!patchData?.necklace?.[accessory]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.wrist[accessory]"
                      :disabled="!patchData?.wrist?.[accessory]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                  <td>
                    <n-input-number
                      v-model:value="localSelections.rings[accessory]"
                      :disabled="!patchData?.rings?.[accessory]"
                      :input-props="{ type: 'number' }"
                      :min="0"
                      :max="99999"
                      :precision="0"
                      button-placement="both"
                      :show-button="!isMobile"
                    />
                  </td>
                  <td v-if="!isMobile"></td>
                </tr>
              </tbody>
            </n-table>
          </n-scrollbar>
        </n-card>
      </div>
    </div>
    <div class="wrapper" v-else>
      <n-tabs v-if="isMobile" type="segment" animated>
        <n-tab-pane name="weapon" :tab="t('game.gear.tool.mainoff_hand')">
          <div class="weapons-container">
            <GroupBox
              class="weapon-group"
              v-for="(role, roleIndex) in XivRoles"
              :key="'m-'+roleIndex"
              v-show="getVShowOfMainoffHandGroup(role)"
              :border-color="role.role_color"
              container-extra-style="padding: 8px;"
            >
              <template #title>
                <XivFARImage
                  :src="role.role_icon_url"
                  :size="14"
                />
                <span>
                  {{ getRoleName(role) }}
                </span>
              </template>

              <div class="input-container">
                <p v-for="job in role.jobs" :key="'m-weapon-mainhand-' + job">
                  <n-input-number
                    v-model:value="localSelections.mainHand[job]"
                    :input-props="{ type: 'number' }"
                    :min="0"
                    :max="99999"
                    :precision="0"
                    :title="getJobName(job)"
                    :disabled="!patchData?.mainHand?.[job] && !patchData?.offHand?.[job]"
                  >
                    <template #prefix>
                      <XivFARImage 
                        :src="XivJobs[job].job_icon_url"
                        :size="15"
                      />
                    </template>
                  </n-input-number>
                </p>
              </div>
            </GroupBox>
          </div>
        </n-tab-pane>
        <n-tab-pane name="attire" :tab="t('game.gear.attire.title')">
          <div class="weapons-container">
            <GroupBox
              class="weapon-group"
              v-for="(attire, attireIndex) in attireAffixes"
              :key="'m-at'+attireIndex"
              v-show="getVShowOfAttireAffixRow(attire)"
              container-extra-style="padding: 8px;"
            >
              <template #title>
                <span>
                  {{ getAffixName(attire) }}
                </span>
              </template>

              <div class="input-container">
                <p v-for="gear in attireGearSlots" :key="'m-attire' + attireIndex + '-' + gear.key">
                  <n-input-number
                    v-model:value="(localSelections as any)[gear.key][attire]"
                    :input-props="{ type: 'number' }"
                    :min="0"
                    :max="99999"
                    :precision="0"
                    :title="gear.text"
                  >
                    <template #prefix>
                      <n-icon size="15" color="var(--color-text-sub)">
                        <component :is="gear.icon" />
                      </n-icon>
                    </template>
                  </n-input-number>
                </p>
              </div>
            </GroupBox>
          </div>
        </n-tab-pane>
        <n-tab-pane name="accessory" :tab="t('game.gear.accessory.title')">
          <div class="weapons-container">
            <GroupBox
              class="weapon-group"
              v-for="(accessory, accessoryIndex) in accessoryAffixes"
              :key="'m-ac'+accessoryIndex"
              v-show="getVShowOfAccessoryAffixRow(accessory)"
              container-extra-style="padding: 8px;"
            >
              <template #title>
                <span>
                  {{ getAffixName(accessory) }}
                </span>
              </template>

              <div class="input-container">
                <p v-for="gear in accessoryGearSlots" :key="'m-accessory' + accessoryIndex + '-' + gear.key">
                  <n-input-number
                    v-model:value="(localSelections as any)[gear.key][accessory]"
                    :input-props="{ type: 'number' }"
                    :min="0"
                    :max="99999"
                    :precision="0"
                    :title="gear.text"
                  >
                    <template #prefix>
                      <n-icon size="15" color="var(--color-text-sub)">
                        <component :is="gear.icon" />
                      </n-icon>
                    </template>
                  </n-input-number>
                </p>
              </div>
            </GroupBox>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
    
    <template #action>
      <div class="modal-submit-container">
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
/* All */
:deep(.n-input) {
  --n-height: 30px !important;
}
.wrapper {
  display: grid;
  grid-template-columns: 2fr 3fr;
  grid-gap: 10px;

  .weapons-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .input-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-gap: 5px;
  }
  .accessories {
    margin-top: 3px;
  }
  th {
    text-align: center;
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
  td {
    text-align: center;
  }
}
.attires-table, .accessories-table {
  th:first-child, td:first-child {
    width: 15%;
  }
  th:nth-child(2), td:nth-child(2),
  th:nth-child(3), td:nth-child(3),
  th:nth-child(4), td:nth-child(4),
  th:nth-child(5), td:nth-child(5),
  th:nth-child(6), td:nth-child(6) {
    width: 17%;
    padding: 3px 10px;
  }
}

/* Desktop */
@media (min-width: 769px) {
  .weapons {
    grid-row: 1 / 3;
    height: 100%;

    .n-card {
      height: 100%;
    }
  }
}

/* Mobile */
@media (max-width: 768px) {
  .wrapper {
    display: flex;
    flex-direction: column;

    .weapons-container {
      max-height: 450px;
      padding-top: 10px;
      overflow-y: auto;
    }

    .input-container {
      grid-template-columns: 1fr 1fr;
    }

    .accessories-table {
      th:first-child, td:first-child {
        width: 15%;
      }
      th:nth-child(2), td:nth-child(2),
      th:nth-child(3), td:nth-child(3),
      th:nth-child(4), td:nth-child(4),
      th:nth-child(5), td:nth-child(5) {
        width: 21.25%;
        padding: 3px 6px;
      }
    }
  }
}
</style>