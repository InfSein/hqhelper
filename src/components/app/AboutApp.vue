<script setup lang="ts">
import StaffGroup from './StaffGroup.vue'
import ModalSponsorsList from '@/components/modals/ModalSponsorsList.vue'
import useStaff from "@/composables/useStaff"
import { useLocale } from '@/composables/useLocale'
import AppStatus from '@/constants/app.ts'

// import {
//   RefreshOutlined
// } from '@vicons/material'

const { t } = useLocale()
const { staffMembers } = useStaff()

const currentElectronVersion = ref('')

onMounted(async () => {
  if (window.electronAPI?.clientVersion) {
    currentElectronVersion.value = await window.electronAPI?.clientVersion
  }
})

const appVersions = computed(() => {
  return {
    webVersion: t('about_app.version.web', AppStatus.Version),
    clientVersion: (currentElectronVersion.value ? t('about_app.version.client', currentElectronVersion.value) : ''),
    dataVersionChs: t('common.chs_data_version', AppStatus.SupportedGameVersion.CN),
    dataVersionGlobal: t('common.global_data_version', AppStatus.SupportedGameVersion.GLOBAL)
  }
})

const showSponsors = ref(false)
const viewSponsors = () => {
  showSponsors.value = true
}
</script>

<template>
  <div class="wrapper">
    <div class="logo">
      <div class="logo-content">
        <i class="xiv hq logo-about"></i>
        HqHelper
      </div>
      <div class="patch-text">- EVERCOLD -</div>
    </div>
    <n-divider />
    <div class="version-info">
      <div>{{ appVersions.webVersion }}</div>
      <div>{{ appVersions.clientVersion }}</div>
      <div v-if="appVersions.dataVersionChs">{{ appVersions.dataVersionChs }}</div>
      <div>{{ appVersions.dataVersionGlobal }}</div>
    </div>
    <n-divider />
    <div id="staffs">
      <div class="title">{{ t('about_app.staff.title') }}</div>
      <div class="content">
        <n-table class="staff-table" :single-line="false" size="small">
          <tbody>
            <tr>
              <td>{{ t('about_app.staff.producer') }}</td>
              <td>
                <StaffGroup :group-members="[staffMembers.infsein, staffMembers.nbb, staffMembers.yakita]" />
              </td>
            </tr>
            <tr>
              <td>{{ t('about_app.staff.contributor') }}</td>
              <td>
                <StaffGroup :group-members="[staffMembers.wcy, staffMembers.kimuchi, staffMembers.etnatker]" />
              </td>
            </tr>
          </tbody>
        </n-table>
      </div>
    </div>
    <n-divider />
    <div id="thanks-donate">
      <div class="title">{{ t('about_app.thank_donate.title') }}</div>
      <div class="content">
        <p>{{ t('about_app.thank_donate.desc.desc_1') }}</p>
        <p>
          <span>{{ t('common.click') }}</span>
          <a href="javascript:void(0);" @click="viewSponsors">{{ t('common.here') }}</a>
          <span>{{ t('about_app.thank_donate.desc.desc_2') }}</span>
        </p>
      </div>
    </div>
    <n-divider />
    <div id="copyright">
      <div class="content">
        <div class="extra font-small">
          FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd. <br>
          Copyrighted Materials are extracted from FINAL FANTASY XIV © 2010 - 2019 SQUARE ENIX CO., LTD. All Rights Reserved.
        </div>
      </div>
    </div>

    <ModalSponsorsList
      v-model:show="showSponsors"
    />
  </div>
</template>

<style scoped>
.n-divider {
  margin: 10px 0;
}
:deep(.n-spin) {
  --n-size: 14px !important;
}

.wrapper {
  display: flex;
  flex-direction: column;
  user-select: text;
  overflow-y: auto;
  padding-right: 5px;

  .logo {
    position: relative;
    align-self: center;
    text-align: center;
    user-select: none;
    margin: 0.5em 0;
    padding-bottom: 0.6em;
    border-radius: 6px;
    box-shadow: rgba(6, 24, 44, 0.65) 0px 4px 6px -1px, rgba(255, 255, 255, 0.08) 0px 1px 0px inset;

    /* 文本流光特效 */
    background: linear-gradient(
      to right,
      #2B4458 0%,
      #364F7E 25%,
      #E2E1E1 50%,
      #AB9F8B 75%,
      #2B4458 100%
    );
    background-size: 200% auto;
    animation: text-stream-light 4s linear infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;

    /* 边框流光特效 */
    &::before {
      content: "";
      position: absolute;
      inset: -2px;
      border-radius: 8px;
      padding: 2px;
      background: conic-gradient(
        from var(--border-angle),
        #2B4458 0%,
        #364F7E 25%,
        #E2E1E1 50%,
        #AB9F8B 75%,
        #2B4458 100%
      );
      animation: logo-stream-light 4s linear infinite;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
    
    .logo-content {
      display: flex;
      padding: 0.4em 0.5em 0;
      line-height: 1;
      font-size: 32px;
      font-weight: 900;
    }
    .patch-text {
      line-height: 1.3;
      font-size: 12px;
      font-weight: normal;
      letter-spacing: 1px;
    }
  }
  .title {
    font-weight: bold;
    margin-left: 1.2em;
  }
  .version-info {
    line-height: 1.3;
    margin-left: 1.2em;
    width: fit-content;
  }
  .content {
    display: flex;
    flex-direction: column;
    margin: 0 2.4em;

    .extra {
      line-height: 1.2;
      color: gray;
      text-indent: initial;
      margin-top: 0.5rem;
    }
    .staff-table {
      margin-top: 5px;

      td {
        padding: 3px 6px;
      }
      tr td:first-child {
        font-weight: bold;
        background-color: var(--n-th-color);
        width: fit-content;
        min-width: 60px;
        text-align: center;
      }
    }
  }
}



/* Desktop */
@media screen and (min-width: 768px) {
  .version-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 12px;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .version-info {
    display: flex;
    flex-direction: column;
  }
}

@property --border-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes logo-stream-light {
  0% {
    --border-angle: 0deg;
  }
  100% {
    --border-angle: 360deg;
  }
}

@keyframes text-stream-light {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: -200% center;
  }
}
</style>