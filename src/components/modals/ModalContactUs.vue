<script setup lang="ts">
import {
  ContactlessSharp, CloseSharp
} from '@vicons/material'
import IconQQ from '@/assets/icons/external/IconQQ.vue'
import IconGithub from '@/assets/icons/external/IconGithub.vue'
import IconWeibo from '@/assets/icons/external/IconWeibo.vue'
import IconTwitter from '@/assets/icons/external/IconTwitter.vue'
import {
  qGroupInfo, githubInfo, otherSocialInfo
} from '@/constants'

import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'

const { t } = useLocale()
const { isMobile } = useResponsive()

const showModal = defineModel<boolean>('show', { required: true })

const tabContentStyle = [
  'height: 350px;',
  'padding: 10px;',
  'user-select: text;'
].join(' ')

const handleClose = () => {
  showModal.value = false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="ContactlessSharp"
    :title="t('common.appfunc.contact_us')"
  >
    <n-tabs type="segment" animated>
      <n-tab-pane name="feedback" :tab="t('contact_us.feedback.title')">
        <n-scrollbar trigger="none" :style="tabContentStyle">
          <div id="qq" class="item">
            <div class="title">
              <n-icon><IconQQ /></n-icon>
              <span>{{ t('common.qq') }}</span>
            </div>
            <div class="content">
              <p>
                <span>{{ t('contact_us.feedback.desc.desc_1') }}</span>
                <span>{{ t('contact_us.feedback.desc.desc_2') }}</span>
              </p>
              <p>
                <span>{{ t('contact_us.feedback.desc.desc_3') }}</span>
                <a :href="qGroupInfo.groupUrl" target="_blank">{{ t('common.click_here') }}</a>
                <span>{{ t('contact_us.feedback.desc.desc_4') }}</span>
                <span>{{ t('contact_us.feedback.desc.desc_5') }}</span>
                <n-gradient-text type="info" style="padding: 0 5px;">{{ qGroupInfo.groupNumber }}</n-gradient-text>
                <span>{{ t('contact_us.feedback.desc.desc_6') }}</span>
              </p>
            </div>
            <div class="tail" v-if="!isMobile">
              <n-popover trigger="hover" placement="bottom">
                <template #trigger>
                  <n-button size="small">{{ t('contact_us.feedback.button.qr_code') }}</n-button>
                </template>
                <n-flex justify="center">
                  <n-qr-code class="qgroup-qrcode" :size="110" :value="qGroupInfo.groupUrl" />
                </n-flex>
              </n-popover>
            </div>
          </div>
          <n-divider />
          <div id="github-issue" class="item">
            <div class="title">
              <n-icon><IconGithub /></n-icon>
              <span>{{ t('contact_us.feedback.sub_title.github_issue') }}</span>
            </div>
            <div class="content">
              <p>
                <span>{{ t('contact_us.feedback.desc.desc_7') }}</span>
                <span>{{ t('contact_us.feedback.desc.desc_8') }}</span>
              </p>
              <p>
                <span>{{ t('contact_us.feedback.desc.desc_9') }}</span>
                <a :href="githubInfo.newIssueUrl" target="_blank">{{ t('common.click_here') }}</a>
                <span>{{ t('contact_us.feedback.desc.desc_10') }}</span>
                <span>{{ t('contact_us.feedback.desc.desc_11') }}</span>
              </p>
            </div>
          </div>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="follow" :tab="t('contact_us.follow.title')">
        <n-scrollbar trigger="none" :style="tabContentStyle">
          <div>{{ t('contact_us.follow.desc.desc_1') }}</div>
          <n-divider />
          <div id="weibo" class="item">
            <div class="title">
              <n-icon><IconWeibo /></n-icon>
              <span>{{ t('common.weibo') }}</span>
            </div>
            <div class="content">
              <p>
                <span>{{ t('contact_us.follow.desc.desc_2') }}</span>
                <a :href="otherSocialInfo.weiboUrl" target="_blank">{{ t('common.click_here') }}</a>
                <span>{{ t('contact_us.follow.desc.desc_3') }}</span>
              </p>
            </div>
          </div>
          <n-divider />
          <div id="twitter" class="item">
            <div class="title">
              <n-icon><IconTwitter /></n-icon>
              <span>{{ t('common.twitter_x') }}</span>
            </div>
            <div class="content">
              <p>
                <span>{{ t('contact_us.follow.desc.desc_4') }}</span>
                <a :href="otherSocialInfo.twitterUrl" target="_blank">{{ t('common.click_here') }}</a>
                <span>{{ t('contact_us.follow.desc.desc_3') }}</span>
              </p>
            </div>
          </div>
        </n-scrollbar>
      </n-tab-pane>
    </n-tabs>
    
    <template #action>
      <div class="modal-submit-container">
        <n-button type="error" size="large" @click="handleClose">
          <template #icon>
            <n-icon><CloseSharp /></n-icon>
          </template>
          {{ t('common.close') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
/* All */
:deep(.qgroup-qrcode canvas) {
  /* The size of canvas in `n-qr-code` is wrong. So it is nececssary to override it. */
  width: 86px !important;
  height: 86px !important;
}
:deep(.n-divider:not(.n-divider--vertical)) {
  /* Reduce the margin of `n-divider` (default is 24px) */
  margin-top: 12px;
  margin-bottom: 12px;
}
:deep(.n-gradient-text) {
  /* Set display from `inline-block` to `inline` to prevent `text-indent` lose its effect. */
  display: inline;
}
.item {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .title {
    font-size: 21px;
    display: flex;
    gap: 10px;
    line-height: 29px;
  }
  .content {
    text-indent: 2em;
  }
  /*.tail {
    display: flex;
    flex-direction: row-reverse;
  }*/
}

/* Mobile only */
/* @media (max-width: 768px) {
.wrapper {
    grid-template-columns: 1fr;
  }
} */
</style>