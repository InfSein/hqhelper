<script setup lang="ts">
import AppLogoPlate from './AppLogoPlate.vue'
import StaffGroup from './StaffGroup.vue'
import ModalSponsorsList from '@/components/modals/ModalSponsorsList.vue'
import useStaff from "@/composables/useStaff"
import { useLocale } from '@/composables/useLocale'
import { githubInfo } from '@/constants'
import AppStatus from '@/constants/app'

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
    <AppLogoPlate />
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
        <p>
          <span>{{ t('about_app.staff.desc.desc_1_1') }}</span>
          <a class="py-0" target="_blank" :href="githubInfo.repoUrl">GitHub</a>
          <span>{{ t('about_app.staff.desc.desc_1_2') }}</span>
        </p>
        <p>{{ t('about_app.staff.desc.desc_2') }}</p>
        <div class="flex items-center justify-center py-1">
          <StaffGroup :group-members="[staffMembers.infsein, staffMembers.nbb, staffMembers.yakita]" />
        </div>
        <p>{{ t('about_app.staff.desc.desc_3') }}</p>
        <p>
          <span>{{ t('common.click') }}</span>
          <a class="py-0" target="_blank" :href="githubInfo.contributorsUrl">{{ t('common.here') }}</a>
          <span>{{ t('about_app.staff.desc.desc_4') }}</span>
        </p>
      </div>
    </div>
    <n-divider />
    <div id="thanks-donate">
      <div class="title">{{ t('about_app.thank_donate.title') }}</div>
      <div class="content">
        <p>{{ t('about_app.thank_donate.desc.desc_1') }}</p>
        <p>
          <span>{{ t('common.click') }}</span>
          <a href="javascript:void(0);" class="py-0" @click="viewSponsors">{{ t('common.here') }}</a>
          <span>{{ t('about_app.thank_donate.desc.desc_2') }}</span>
        </p>
      </div>
    </div>
    <n-divider />
    <div id="copyright">
      <div class="content">
        <div class="extra text-app-xs">
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

.wrapper {
  display: flex;
  flex-direction: column;
  user-select: text;
  overflow-y: auto;
  padding-right: 5px;

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
</style>