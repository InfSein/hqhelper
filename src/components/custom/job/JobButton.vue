<script lang="ts" setup>
import {
  FileDownloadDoneOutlined,
  AccessibilityNewOutlined,
  AddCircleOutlineOutlined, AddCircleOutlined, ClearAllOutlined
} from '@vicons/material'
import XivFARImage from '../general/XivFARImage.vue'
import { XivJobs, XivRoles, type XivRole, type HqDataVer, type XivPatchVer } from '@/assets/data'
import type { GearSelections } from '@/models/gears'
import { getGearIcon, getGearRecomm, useGearAdder } from '@/tools/gears'
import useUiTools from '@/tools/ui'
import { visitUrl } from '@/tools'
import UseConfig from '@/composables/useConfig.ts'
import { NIcon } from 'naive-ui'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const {
  addMainOffHand,
  addAttire,
  addAccessory
} = useGearAdder()
const { renderIcon, optionsRenderer } = useUiTools(isMobile)
const {
  uiLanguage,
} = UseConfig()

const gearsSelected = defineModel<GearSelections>('gearsSelected', { required: true })
interface JobButtonProps {
  /** 被选中 */
  selected: boolean;
  /** 职能 */
  role: string;
  /** 职能名称 */
  roleName: string;
  /** 职业id */
  jobId: number;
  /** 职业 */
  jobName: string;
  /** 职业图标 */
  jobIcon: string;
  /** UI尺寸预设 */
  imgSize: number;
  /** 按钮颜色 */
  btnColor: string;
  /** 徽标计数 */
  count: number;
  /** 按钮是否禁用(可选,默认false) */
  disabled?: boolean;
  patchSelected: XivPatchVer | undefined;
  patchData?: HqDataVer
}
const props = defineProps<JobButtonProps>()
const emit = defineEmits(['on-btn-clicked'])

const btnSize = props.imgSize + 5
const roleInfo = computed(() => {
  let result : XivRole | undefined
  Object.values(XivRoles).forEach(role => {
    if (role.jobs.includes(props.jobId)) {
      result = role
    }
  })
  return result
})
const jobInfo = computed(() => {
  return XivJobs[props.jobId]
})
const jobSubName = computed(() => {
  switch (uiLanguage.value) {
    case 'ja':
      return jobInfo.value.job_name_en
    case 'en':
      return jobInfo.value.job_name_ja
    case 'zh':
    default:
      return jobInfo.value.job_name_ja + ' / ' + jobInfo.value.job_name_en
  }
})

const onBtnClicked = () => {
  emit('on-btn-clicked')
}

// #region 右键菜单相关

interface GearInfo {
  key: keyof GearSelections,
  amount: number,
  icon: string
}
const currJobGears = computed(() => {
  const weapons : GearInfo[] = []
  const attires : GearInfo[] = []
  const accessories : GearInfo[] = [];

  // 主副手
  (['mainHand', 'offHand']).forEach(_key => {
    const key = _key as 'mainHand' | 'offHand'
    if (gearsSelected.value?.[key]?.[props.jobId]) {
      weapons.push({
        key: key,
        amount: gearsSelected.value[key][props.jobId],
        icon: getGearIcon(key)
      })
    }
  });

  // 防具
  (['headAttire', 'bodyAttire', 'handsAttire', 'legsAttire', 'feetAttire']).forEach(_key => {
    const key = _key as 'headAttire' | 'bodyAttire' | 'handsAttire' | 'legsAttire' | 'feetAttire'
    if (roleInfo.value?.attire && gearsSelected.value?.[key]?.[roleInfo.value.attire]) {
      attires.push({
        key: key,
        amount: gearsSelected.value[key][roleInfo.value.attire],
        icon: getGearIcon(key)
      })
    }
  });

  // 首饰
  (['earrings', 'necklace', 'wrist', 'rings']).forEach(_key => {
    const key = _key as 'earrings' | 'necklace' | 'wrist' | 'rings'
    if (roleInfo.value?.accessory && gearsSelected.value?.[key]?.[roleInfo.value.accessory]) {
      accessories.push({
        key: key,
        amount: gearsSelected.value[key][roleInfo.value.accessory],
        icon: getGearIcon(key)
      })
    }
  });

  return {
    weapons: weapons,
    attires: attires,
    accessories: accessories,
    count: weapons.length + attires.length + accessories.length
  }
})

const showDropdownRef = ref(false)
const xRef = ref(0)
const yRef = ref(0)

const contextOptions = computed(() => {
  // 获取推荐配装
  function dealGearingRecomm() {
    const recommGears = getGearRecomm(props.patchSelected, props.jobId)
    const rgContents : any[] = []
    recommGears.forEach((gear, index) => {
      let title = gear[`title_${uiLanguage.value}`] || gear.title_zh
      if (gear.gcd) {
        title = `${gear.gcd.toFixed(2)}GCD/ ${title}`
      }
      if (gear.author) {
        title += ` by${gear.author}`
      }
      rgContents.push({
        key: `rg-${props.jobId}-${index}`,
        label: title,
        icon: renderIcon(AccessibilityNewOutlined),
        props: {
          class: 'n-option-hideoverflow',
          style: 'max-width: 175px;' + groupOptionStyle
        },
        description: title,
        click: () => {
          visitUrl(`https://asvel.github.io/ffxiv-gearing/?${gear.set_no}`)
          showDropdownRef.value = false
        }
      })
    })
    if (rgContents.length) {
      return rgContents
    } else {
      return [{
        key: 'rg-none',
        label: t('common.nothing'),
        disabled: true
      }]
    }
  }
  return [
    {
      key: 'context-header',
      type: 'render',
      render: renderJobContextHeader
    },
    {
      type: 'divider',
      key: 'd0'
    },
    {
      label: t('common.selected'),
      key: 'selected',
      icon: renderIcon(FileDownloadDoneOutlined),
      children: [
        {
          key: 'selected-header',
          type: 'render',
          render: renderGearsSelectedHeader
        },
        {
          key: 'selected-header-divider',
          type: 'divider'
        },
        {
          key: 'selected-add',
          type: 'render',
          render: renderGroupTitle(t('common.add'))
        },
        {
          key: 'selected-add-weapon',
          label: t('main.select_gear.add.mainoff_hand'),
          icon: renderIcon(AddCircleOutlineOutlined),
          props: { style: groupOptionStyle },
          click: () => {
            addMainOffHand(gearsSelected, props.patchData, props.jobId)
          }
        },
        {
          key: 'selected-add-attire',
          label: t('main.select_gear.add.attire'),
          icon: renderIcon(AddCircleOutlineOutlined),
          props: { style: groupOptionStyle },
          click: () => {
            if (roleInfo.value?.attire) {
              addAttire(gearsSelected, props.patchData, roleInfo.value.attire)
            } else {
              console.error('No attire-affix:', roleInfo.value)
            }
          }
        },
        {
          key: 'selected-add-accessory',
          label: t('main.select_gear.add.accessory'),
          icon: renderIcon(AddCircleOutlineOutlined),
          props: { style: groupOptionStyle },
          click: () => {
            if (roleInfo.value?.accessory) {
              addAccessory(gearsSelected, props.patchData, roleInfo.value.accessory)
            } else {
              console.error('No accessory-affix:', roleInfo.value)
            }
          }
        },
        {
          key: 'selected-add-attire-and-accessory',
          label: t('main.select_gear.add.attire_and_accessory'),
          icon: renderIcon(AddCircleOutlineOutlined),
          props: { style: groupOptionStyle },
          click: () => {
            if (roleInfo.value?.attire) {
              addAttire(gearsSelected, props.patchData, roleInfo.value.attire)
            } else {
              console.error('No attire-affix:', roleInfo.value)
            }
            if (roleInfo.value?.accessory) {
              addAccessory(gearsSelected, props.patchData, roleInfo.value.accessory)
            } else {
              console.error('No accessory-affix:', roleInfo.value)
            }
          }
        },
        {
          key: 'selected-add-suit',
          label: t('main.select_gear.add.whole_suit'),
          icon: renderIcon(AddCircleOutlined),
          props: { style: groupOptionStyle },
          click: () => {
            addMainOffHand(gearsSelected, props.patchData, props.jobId)
            if (roleInfo.value?.attire) {
              addAttire(gearsSelected, props.patchData, roleInfo.value.attire)
            } else {
              console.error('No attire-affix:', roleInfo.value)
            }
            if (roleInfo.value?.accessory) {
              addAccessory(gearsSelected, props.patchData, roleInfo.value.accessory)
            } else {
              console.error('No accessory-affix:', roleInfo.value)
            }
          }
        },
        {
          key: 'selected-manage',
          type: 'render',
          render: renderGroupTitle(t('common.manage'))
        },
        {
          key: 'selected-clear',
          label: t('common.clear_selected'),
          props: {
            style: 'color: var(--color-error);' + groupOptionStyle
          },
          icon: renderIcon(ClearAllOutlined, { color: 'var(--color-error)' }),
          click: () => {
            gearsSelected.value.mainHand[props.jobId] = 0
            gearsSelected.value.offHand[props.jobId] = 0
            if (roleInfo.value?.attire) {
              gearsSelected.value.headAttire[roleInfo.value.attire] = 0
              gearsSelected.value.bodyAttire[roleInfo.value.attire] = 0
              gearsSelected.value.handsAttire[roleInfo.value.attire] = 0
              gearsSelected.value.legsAttire[roleInfo.value.attire] = 0
              gearsSelected.value.feetAttire[roleInfo.value.attire] = 0
            }
            if (roleInfo.value?.accessory) {
              gearsSelected.value.earrings[roleInfo.value.accessory] = 0
              gearsSelected.value.necklace[roleInfo.value.accessory] = 0
              gearsSelected.value.wrist[roleInfo.value.accessory] = 0
              gearsSelected.value.rings[roleInfo.value.accessory] = 0
            }
          }
        },
      ]
    },
    {
      label: t('common.gear_set.title'),
      key: 'gearing',
      icon: renderIcon(AccessibilityNewOutlined),
      children: [
        {
          key: 'gearing-tools',
          type: 'render',
          render: renderGroupTitle(t('common.auxiliary_tools'))
        },
        {
          label: t('common.gear_set.simulate'),
          key: 'gearing-open-simulator',
          icon: renderIcon(AccessibilityNewOutlined),
          props: { style: groupOptionStyle },
          click: () => {
            visitUrl(`https://asvel.github.io/ffxiv-gearing/?${jobInfo.value?.short_name}`)
            showDropdownRef.value = false
          }
        },
        {
          key: 'selected-add',
          type: 'render',
          render: renderGroupTitle(t('common.gear_set.recomm'))
        },
        ...dealGearingRecomm(),
      ]
    }
  ]
})
const renderJobContextHeader = () => {
  return h(
    'div',
    {
      class: 'flex',
      style: 'gap: 5px; padding: 0.2em 0.5em; width: 150px;'
    },
    [
      h(
        'div',
        {
          class: 'h-full flex items-center justify-center'
        },
        [
          h(
            XivFARImage,
            {
              src: props.jobIcon,
              size: 32
            }
          )
        ]
      ),
      h(
        'div',
        {
          style: 'line-height: 1.2;'
        },
        [
          h('p', {class:'font-big'}, props.jobName),
          h('p', {class:'font-small', style: 'color: var(--color-text-sub);'}, jobSubName.value)
        ]
      )
    ]
  )
}
const renderGearsSelectedHeader = () => {
  return h(
    'div',
    {
      class: 'select-none',
      style: 'padding: 0.2em 1em; min-width: 180px;'
    },
    [
      h('p', { class: 'font-bold' }, t('main.select_gear.view_selected')),
      h(
        'div',
        { style: 'margin-left: 0.2em;' },
        dealGearSlots()
      )
    ]
  )

  function dealGearSlots() {
    if (!currJobGears.value?.count) {
      return [
        h(
          'div', {class: 'font-small'}, t('common.nothing')
        )
      ]
    }
    const slotDivs : VNode[] = []
    const containerProps = {
      class: 'flex',
      style: 'gap: 3px;'
    }
    slotDivs.push(
      h(
        'div', containerProps,
        currJobGears.value.weapons.map(gearInfo => {
          return dealGear(gearInfo)
        })
      )
    )
    slotDivs.push(
      h(
        'div', containerProps,
        currJobGears.value.attires.map(gearInfo => {
          return dealGear(gearInfo)
        })
      )
    )
    slotDivs.push(
      h(
        'div', containerProps,
        currJobGears.value.accessories.map(gearInfo => {
          return dealGear(gearInfo)
        })
      )
    )
    return slotDivs

    function dealGear(gearInfo: GearInfo) {
      return h(
        'div',
        {
          class: 'font-small',
          style: 'display: flex; align-items: center; gap: 2px; line-height: 1;'
        },
        [
          h(
            NIcon,
            {
              color: 'var(--color-text-sub)',
              size: 12
            },
            {
              default: () => h(gearInfo.icon)
            }
          ),
          h('p', null, gearInfo.amount)
        ]
      )
    }
  }
}
const renderGroupTitle = (title: string) => {
  return () => h(
    'div',
    {
      class: 'select-none',
      style: 'padding: 0.2em 1em;'
    },
    [
      h('p', { class: 'font-bold' }, title),
    ]
  )
}
const groupOptionStyle = 'margin: 0 1em; user-select: none;'
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  showDropdownRef.value = false
  nextTick().then(() => {
    showDropdownRef.value = true
    xRef.value = e.clientX
    yRef.value = e.clientY
  })
}
const handleSelect = async (key: string | number, option: any) => {
  if (option?.click) {
    option.click()
  } else {
    console.log('[开发提示] 未分配点击事件', key, option)
  }
}
const onClickoutside = () => {
  showDropdownRef.value = false
}

// #endregion

</script>

<template>
  <n-popover
    placement="bottom-start"
    :trigger="isMobile ? 'manual' : 'hover'"
  >
    <template #trigger>
      <n-badge :value="count" :max="99" :color="props.btnColor" @click="onBtnClicked" @contextmenu="handleContextMenu">
        <n-button
          :ghost="!props.selected"
          :disabled="props.disabled"
          class="job-button"
          :color="props.btnColor"
          :style="{ width: `${btnSize}px`, height: `${btnSize}px` }"
        >
          <XivFARImage
            :src="jobIcon"
            :size="imgSize"
          />
          
          <n-dropdown
            size="small"
            placement="bottom-start"
            trigger="manual"
            :x="xRef"
            :y="yRef"
            :options="contextOptions"
            :render-option="optionsRenderer"
            :show="showDropdownRef"
            :on-clickoutside="onClickoutside"
            @select="handleSelect"
          />
        </n-button>
      </n-badge>
    </template>

    <div>{{ jobName }}</div>
  </n-popover>
</template>

<style scoped>
:deep(.n-badge-sup) {
  border-radius: 3px;
  transform: none !important;
  right: 0;
  bottom: 0;
  left: initial;
  cursor: pointer;
  user-select: none;
}
.job-button {
  padding: 1px;
}
</style>