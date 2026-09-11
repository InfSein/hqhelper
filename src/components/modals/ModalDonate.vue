<script setup lang="ts">
import {
  ChecklistRtlSharp,
  DoneOutlined,
  HandshakeOutlined,
  SettingsBackupRestoreSharp,
} from '@vicons/material'
import ModalSponsorsList from './ModalSponsorsList.vue'
import HelpButton from '@/components/ui/HelpButton.vue'
import StaffGroup from '@/components/app/StaffGroup.vue'
import useStaff from "@/composables/useStaff"
import { useLocale } from '@/composables/useLocale'
import { qGroupInfo } from '@/constants'

const { t } = useLocale()
const { staffMembers } = useStaff()

const showModal = defineModel<boolean>('show', { required: true })

const cautionsConfirmed = ref(false)
const selectedStaff = ref(0)
const selectedDonateWay = ref(0)
const showSponsorsList = ref(false)

const onLoad = () => {
  cautionsConfirmed.value = false
}

const donatableStaffs = computed(() => {
  return Object.values(staffMembers.value).filter((member) => {
    return member.donate_info?.donate_ways?.length
  }).map((data, index) => {
    return {
      label: data.name,
      value: index,
      data: data,
    }
  })
})
const availableDonateWays = computed(() => {
  return currentDonateStaff.value.donate_info!.donate_ways!.map((data, index) => {
    let donateWayLabel = ''
    switch (data.type) {
      case 'afd':
        donateWayLabel = t('donate_us.way.aifadian')
        break
      case 'qq':
        donateWayLabel = 'QQ'
        break
      case 'alipay':
        donateWayLabel = t('donate_us.way.alipay')
        break
      case 'wechat_admire':
        donateWayLabel = t('donate_us.way.wechat_admire')
        break
      default:
        donateWayLabel = data.type
    }
    return {
      label: donateWayLabel,
      value: index,
      data: data,
    }
  })
})
const currentDonateStaff = computed(() => {
  return donatableStaffs.value[selectedStaff.value].data
})
const currentDonateWay = computed(() => {
  return availableDonateWays.value[selectedDonateWay.value].data
})

const extraHeaderButtons = computed(() => {
  return [
    {
      icon: ChecklistRtlSharp,
      text: t('common.appfunc.thank_list'),
      onClick: () => {
        showSponsorsList.value = true
      }
    },
  ]
})

const handleStaffSelectionUpdate = () => {
  selectedDonateWay.value = 0
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="HandshakeOutlined"
    :title="t('common.appfunc.donate_us')"
    max-width="500px"
    :extra-header-buttons="extraHeaderButtons"
    @on-load="onLoad"
  >
    <div class="wrapper">
      <div v-if="cautionsConfirmed" class="donate-container">
        <GroupBox :title="t('common.options')">
          <CompactForm size="small">
            <CompactFormItem :label="t('donate_us.target.title')">
              <n-select
                v-model:value="selectedStaff"
                :options="donatableStaffs"
                :placeholder="t('donate_us.target.placeholder')"
                @update:value="handleStaffSelectionUpdate"
              />
            </CompactFormItem>
            <CompactFormItem :label="t('donate_us.way.title')">
              <n-select
                v-model:value="selectedDonateWay"
                :options="availableDonateWays"
                :placeholder="t('donate_us.way.placeholder')"
              />
            </CompactFormItem>
          </CompactForm>
        </GroupBox>
        <GroupBox :title="t('donate_us.final_confirm.title')">
          <div>
            <div style="float: left;">{{ t('donate_us.final_confirm.desc.desc_1') }}</div>
            <StaffGroup :group-members="[currentDonateStaff]" style="float: left;" />
            <span>{{ t('donate_us.final_confirm.desc.desc_2', currentDonateStaff.donate_info!.donate_desc) }}</span>
          </div>
          <div v-if="!currentDonateStaff.donate_info!.self" class="donate-warn-container">
            <span>{{ t('donate_us.final_confirm.desc.desc_5') }}</span>
            <HelpButton
              icon="question"
              placement="bottom"
              :size="16"
              :descriptions="[
                t('donate_us.final_confirm.desc.desc_6'),
                t('donate_us.final_confirm.desc.desc_7')
              ]"
            />
          </div>
        </GroupBox>
        <GroupBox :title="t('donate_us.start_donate.title')">
          <div v-if="currentDonateWay.data_type === 'url'">
            <p>{{ t('donate_us.start_donate.desc.desc_1') }}</p>
            <a :href="currentDonateWay.data" target="_blank">{{ currentDonateWay.data }}</a>
          </div>
          <div v-else-if="currentDonateWay.data_type === 'qrcode'">
            <p v-if="currentDonateWay.type === 'qq'">{{ t('donate_us.start_donate.desc.desc_2') }}</p>
            <p v-else-if="currentDonateWay.type === 'alipay'">{{ t('donate_us.start_donate.desc.desc_3') }}</p>
            <n-qr-code class="staff-qrcode" :value="currentDonateWay.data" :size="88" :padding="4" />
          </div>
          <div v-else-if="currentDonateWay.data_type === 'img'">
            <p v-if="currentDonateWay.type === 'wechat_admire'">{{ t('donate_us.start_donate.desc.desc_4') }}</p>
            <img :src="currentDonateWay.data" alt="donate-qrcode" style="width: 88px; height: 88px;" />
          </div>
        </GroupBox>
      </div>
      <div v-else class="cautions-container">
        <p class="font-bold">{{ t('donate_us.desc.desc_1') }}</p>
        <p class="font-bold">{{ t('donate_us.desc.desc_2') }}</p>
        <n-divider style="margin: 1px 5px 3px" />
        <ul>
          <li>{{ t('donate_us.desc.desc_3') }}</li>
          <li>{{ t('donate_us.desc.desc_4') }}</li>
          <li class="text-[orangered]">{{ t('donate_us.desc.desc_5') }}</li>
        </ul>
        <n-alert :title="t('donate_us.desc.desc_7')" type="info" style="margin-top: auto; line-height: 1.2;">
          <p>
            <span>{{ t('contact_us.feedback.desc.desc_3') }}</span>
            <a :href="qGroupInfo.groupUrl" target="_blank">{{ t('common.click_here') }}</a>
            <span>{{ t('contact_us.feedback.desc.desc_4') }}</span>
          </p>
          <p>
            <span>{{ t('contact_us.feedback.desc.desc_5') }}</span>
            <n-gradient-text type="info" style="padding: 0 5px;">{{ qGroupInfo.groupNumber }}</n-gradient-text>
            <span>{{ t('contact_us.feedback.desc.desc_6') }}</span>
          </p>
        </n-alert>
      </div>
    </div>
    
    <template #action>
      <div class="app-modal-footer">
        <n-button
          :type="cautionsConfirmed ? 'default' : 'primary'"
          @click="cautionsConfirmed = !cautionsConfirmed"
        >
          <template #icon>
            <n-icon v-if="cautionsConfirmed"><SettingsBackupRestoreSharp /></n-icon>
            <n-icon v-else><DoneOutlined /></n-icon>
          </template>
          {{ cautionsConfirmed ? t('common.go_back') : t('common.confirm') }}
        </n-button>
      </div>
    </template>

    <ModalSponsorsList
      v-model:show="showSponsorsList"
    />
  </MyModal>
</template>

<style scoped>
:deep(.group-box-content) {
  padding: 0 4px;
}
:deep(.staff-qrcode canvas) {
  /* The size of canvas in `n-qr-code` is wrong. So it is nececssary to override it. */
  width: 80px !important;
  height: 80px !important;
}

.donate-warn-container :deep(.n-icon) {
  display: inline-block !important;
  vertical-align: text-top;
}
.wrapper {
  height: 260px;
  display: flex;
  flex-direction: column;

  p, li {
    line-height: 1.2;
  }

  .donate-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;

    .donate-warn-container {
      color: orangered;
    }
  }
  .cautions-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  ul {
    padding-left: 1.5em;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .wrapper {
    height: 300px;
  }
}
</style>