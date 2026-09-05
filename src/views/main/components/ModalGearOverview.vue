<script setup lang="ts">
import {
  ContentPasteSearchOutlined,
  DoneOutlined,
} from '@vicons/material'
import ItemSpan from '@/components/item/ItemSpan.vue'
import ItemRecipeTree from '@/components/item/ItemRecipeTree.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { useResponsive } from '@/composables/useResponsive'
import { XivGearAffixes, XivJobs, type HqDataVer } from '@/assets/data'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import { getGearIcon } from '@/tools/game/gear'
import type { AttireAffix, AccessoryAffix, GearSlot } from '@/types/game/gear'

const { t } = useLocale()
const { uiLanguage } = useConfig()
const { isMobile } = useResponsive()

export interface ModalGearOverviewProps {
  patchData?: HqDataVer
  jobId?: number
  attireAffix?: AttireAffix | ''
  accessoryAffix?: AccessoryAffix | ''
}

const props = defineProps<ModalGearOverviewProps>()
const showModal = defineModel<boolean>('show', { required: true })

const modalId = 'modal-gear-overview'

const pageHeight = ref(window.innerHeight)

const onLoad = () => {
  pageHeight.value = window.innerHeight
}

const currentJob = computed(() => {
  return props.jobId ? XivJobs?.[props.jobId] : undefined
})

const getAffixesName = () => {
  const names = {
    jobName: t('main.select_gear.desc.un_selected'),
    attireName: t('main.select_gear.desc.un_selected'),
    accessoryName: t('main.select_gear.desc.un_selected')
  }
  if (props.jobId) names.jobName = XivJobs?.[props.jobId]?.[`job_name_${uiLanguage.value}`]
  if (props.attireAffix) names.attireName = XivGearAffixes?.[props.attireAffix]?.[`name_${uiLanguage.value}`]
  if (props.accessoryAffix) names.accessoryName = XivGearAffixes?.[props.accessoryAffix]?.[`name_${uiLanguage.value}`]
  return names
}

const currAffixes = computed(() => {
  return getAffixesName()
})

const affixesTips = computed(() => {
  const { jobName, attireName, accessoryName } = getAffixesName()
  return [
    t('main.select_gear.info.info_2', jobName),
    t('main.select_gear.info.info_3', attireName),
    t('main.select_gear.info.info_4', accessoryName)
  ]
})

interface SlotItem {
  slot: GearSlot
  name: string
  icon: any
  itemInfo?: ItemInfo
}

interface SlotGroup {
  title: string
  slots: SlotItem[]
}

const weaponSlots = computed<SlotItem[]>(() => [
  {
    slot: 'mainHand',
    name: t('game.gear.tool.mainhand.title'),
    icon: getGearIcon('mainHand'),
    itemInfo: (props.jobId && props.patchData?.mainHand?.[props.jobId])
      ? getItemInfo(props.patchData.mainHand[props.jobId])
      : undefined
  },
  {
    slot: 'offHand',
    name: t('game.gear.tool.offhand.title'),
    icon: getGearIcon('offHand'),
    itemInfo: (props.jobId && props.patchData?.offHand?.[props.jobId])
      ? getItemInfo(props.patchData.offHand[props.jobId])
      : undefined
  }
])

const attireSlots = computed<SlotItem[]>(() => [
  {
    slot: 'headAttire',
    name: t('game.gear.attire.head.title'),
    icon: getGearIcon('headAttire'),
    itemInfo: (props.attireAffix && props.patchData?.headAttire?.[props.attireAffix])
      ? getItemInfo(props.patchData.headAttire[props.attireAffix])
      : undefined
  },
  {
    slot: 'bodyAttire',
    name: t('game.gear.attire.body.title'),
    icon: getGearIcon('bodyAttire'),
    itemInfo: (props.attireAffix && props.patchData?.bodyAttire?.[props.attireAffix])
      ? getItemInfo(props.patchData.bodyAttire[props.attireAffix])
      : undefined
  },
  {
    slot: 'handsAttire',
    name: t('game.gear.attire.hands.title'),
    icon: getGearIcon('handsAttire'),
    itemInfo: (props.attireAffix && props.patchData?.handsAttire?.[props.attireAffix])
      ? getItemInfo(props.patchData.handsAttire[props.attireAffix])
      : undefined
  },
  {
    slot: 'legsAttire',
    name: t('game.gear.attire.legs.title'),
    icon: getGearIcon('legsAttire'),
    itemInfo: (props.attireAffix && props.patchData?.legsAttire?.[props.attireAffix])
      ? getItemInfo(props.patchData.legsAttire[props.attireAffix])
      : undefined
  },
  {
    slot: 'feetAttire',
    name: t('game.gear.attire.feet.title'),
    icon: getGearIcon('feetAttire'),
    itemInfo: (props.attireAffix && props.patchData?.feetAttire?.[props.attireAffix])
      ? getItemInfo(props.patchData.feetAttire[props.attireAffix])
      : undefined
  }
])

const accessorySlots = computed<SlotItem[]>(() => [
  {
    slot: 'earrings',
    name: t('game.gear.accessory.earring.title'),
    icon: getGearIcon('earrings'),
    itemInfo: (props.accessoryAffix && props.patchData?.earrings?.[props.accessoryAffix])
      ? getItemInfo(props.patchData.earrings[props.accessoryAffix])
      : undefined
  },
  {
    slot: 'necklace',
    name: t('game.gear.accessory.necklace.title'),
    icon: getGearIcon('necklace'),
    itemInfo: (props.accessoryAffix && props.patchData?.necklace?.[props.accessoryAffix])
      ? getItemInfo(props.patchData.necklace[props.accessoryAffix])
      : undefined
  },
  {
    slot: 'wrist',
    name: t('game.gear.accessory.wrist.title'),
    icon: getGearIcon('wrist'),
    itemInfo: (props.accessoryAffix && props.patchData?.wrist?.[props.accessoryAffix])
      ? getItemInfo(props.patchData.wrist[props.accessoryAffix])
      : undefined
  },
  {
    slot: 'rings',
    name: t('game.gear.accessory.rings.title'),
    icon: getGearIcon('rings'),
    itemInfo: (props.accessoryAffix && props.patchData?.rings?.[props.accessoryAffix])
      ? getItemInfo(props.patchData.rings[props.accessoryAffix])
      : undefined
  }
])

const gearGroups = computed<SlotGroup[]>(() => [
  {
    title: t('game.gear.tool.mainoff_hand'),
    slots: weaponSlots.value
  },
  {
    title: t('game.gear.attire.title'),
    slots: attireSlots.value
  },
  {
    title: t('game.gear.accessory.title'),
    slots: accessorySlots.value
  }
])
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="ContentPasteSearchOutlined"
    :title="t('main.select_gear.gear_overview')"
    max-width="1500px"
    :height="(pageHeight - (isMobile ? 120 : 80)) + 'px'"
    content-extra-style="overflow-y: auto;"
    @on-load="onLoad"
  >
    <div :id="modalId" class="flex flex-col gap-3" ref="wrapper">
      <!-- 职业与词缀标头 -->
      <div v-if="currentJob" class="flex items-center gap-2 px-1">
        <XivFARImage
          :src="currentJob.job_icon_url"
          :size="24"
        />
        <n-popover placement="bottom-start" :trigger="isMobile ? 'click' : 'hover'">
          <template #trigger>
            <div class="cursor-help">
              <span class="text-app-xl">{{ currAffixes.jobName }}</span>
              <span class="text-app-xs ml-2">{{ currAffixes.attireName }}</span>
              <span class="text-app-xs"> / </span>
              <span class="text-app-xs">{{ currAffixes.accessoryName }}</span>
            </div>
          </template>
          <div>
            <p v-for="(tip, index) in affixesTips" :key="'title-tip' + index">
              {{ tip }}
            </p>
          </div>
        </n-popover>
      </div>

      <!-- 部件分组展示 -->
      <div
        v-for="(group, groupIndex) in gearGroups"
        :key="groupIndex"
        class="flex flex-col gap-2"
      >
        <div class="font-bold text-app-sm text-sub flex items-center gap-1">
          <span>{{ group.title }}</span>
          <n-divider class="my-0! flex-1" />
        </div>

        <n-grid cols="1 500:2 750:3 1050:4 1350:5" :x-gap="8" :y-gap="8" item-responsive>
          <n-grid-item
            v-for="slotItem in group.slots"
            :key="slotItem.slot"
            span="1"
          >
            <div class="bg-bg rounded border border-border p-2 h-full flex flex-col justify-start">
              <!-- 槽位标题 -->
              <div class="flex items-center gap-1.5 font-bold mb-1.5 text-app-sm text-sub select-none">
                <n-icon :size="16">
                  <component :is="slotItem.icon" />
                </n-icon>
                <span>{{ slotItem.name }}</span>
              </div>

              <!-- 装备与配方内容 (靠顶排列) -->
              <div v-if="slotItem.itemInfo && slotItem.itemInfo.valid" class="flex flex-col">
                <ItemSpan
                  :item-info="slotItem.itemInfo"
                  :amount="1"
                  span-max-width="100%"
                  :container-id="modalId"
                />
                <n-divider class="my-1!" />
                <div v-if="slotItem.itemInfo.craftRequires?.length">
                  <ItemRecipeTree
                    :item="slotItem.itemInfo"
                    :amount="1"
                    :level="0"
                    :container-id="modalId"
                  />
                </div>
              </div>

              <!-- 无装备占位提示 (靠顶排列) -->
              <div
                v-else
                class="text-sub"
              >
                {{ t('main.select_gear.gear_overview_no_gear') }}
              </div>
            </div>
          </n-grid-item>
        </n-grid>
      </div>
    </div>

    <template #action>
      <div class="app-modal-footer">
        <n-button type="primary" @click="showModal = false">
          <template #icon>
            <n-icon><DoneOutlined /></n-icon>
          </template>
          {{ t('common.close') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
</style>
