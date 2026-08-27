<script setup lang="ts">
import {
  ArrowBackOutlined,
  ArrowForwardOutlined,
  CheckCircleFilled,
  CheckCircleOutlineRound,
  ColorLensRound,
  DarkModeTwotone,
  DashboardOutlined,
  DoneOutlined,
  InfoOutlined,
  LanguageOutlined,
  LightModeTwotone,
  SettingsBrightnessOutlined,
  TouchAppOutlined,
  TranslateOutlined,
  WavesOutlined,
} from '@vicons/material'
import HqLogo from '@/components/app/HqLogo.vue'
import ItemButton from '@/components/item/ItemButton.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { getItemInfo } from '@/tools/item'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const store = useStore()
const { t, setLocale } = useLocale()

const currentStep = ref(1)
const totalSteps = 4

// 选中的默认首页
const selectedHomepage = ref<'hqwb' | 'workflow'>(store.userConfig.default_homepage || 'hqwb')

// 示例物品数据 (7.05 代表性制作药水与装备)
const demoItem1 = computed(() => getItemInfo(44162)) // 2级刚力之宝药
const demoItem2 = computed(() => getItemInfo(44163)) // 2级巧力之宝药

// 界面语言改变
const handleUiLanguageChange = (val: 'zh' | 'en' | 'ja') => {
  store.userConfig.language_ui = val
  setLocale(val)
  store.updateUserConfig()
}

// 物品语言改变
const handleItemLanguageChange = (val: 'auto' | 'zh' | 'en' | 'ja') => {
  store.userConfig.language_item = val
  store.updateUserConfig()
}

// 主题改变
const handleThemeChange = (val: 'light' | 'dark' | 'system') => {
  store.userConfig.theme = val
  store.updateUserConfig()
}

const handlePrev = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleNext = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const handleFinish = () => {
  store.userConfig.default_homepage = selectedHomepage.value
  store.userConfig.onboarding_completed = true
  store.updateUserConfig()
  emit('complete')
}
</script>

<template>
  <div class="onboarding-container flex justify-center items-center py-6 px-3 min-h-[75vh]">
    <n-card
      class="onboarding-card max-w-[720px] w-full"
      :class="store.userConfig.custom_background ? 'glasscard' : ''"
      embedded
      :bordered="false"
    >
      <!-- Stepper Header (Steps 2..4) -->
      <div v-if="currentStep > 1" class="mb-6 px-2">
        <n-steps :current="currentStep - 1" :status="'process'" size="small">
          <n-step :title="t('onboarding.step_2.name')" />
          <n-step :title="t('onboarding.step_3.name')" />
          <n-step :title="t('onboarding.step_4.name')" />
        </n-steps>
      </div>

      <!-- Step 1: Welcome -->
      <div v-if="currentStep === 1" class="welcome-step text-center py-4 flex flex-col items-center">
        <div class="logo-wrapper mb-4">
          <HqLogo :size="48" />
        </div>
        <h1 class="text-2xl font-bold text-text mb-2">{{ t('onboarding.welcome.title') }}</h1>
        <p class="text-app-base text-primary font-medium mb-4">{{ t('onboarding.welcome.subtitle') }}</p>
        <p class="text-app-sm text-sub max-w-[500px] mb-2 leading-relaxed">
          {{ t('onboarding.welcome.desc_1') }}
        </p>
        <p class="text-app-sm text-sub max-w-[500px] mb-8 leading-relaxed">
          {{ t('onboarding.welcome.desc_2') }}
        </p>

        <n-button type="primary" size="large" class="px-8 font-bold" @click="handleNext">
          <template #icon>
            <n-icon><ArrowForwardOutlined /></n-icon>
          </template>
          {{ t('onboarding.welcome.start_btn') }}
        </n-button>
      </div>

      <!-- Step 2: Basic Settings -->
      <div v-else-if="currentStep === 2" class="settings-step py-2">
        <div class="step-header mb-5">
          <h2 class="text-xl font-bold text-text mb-1">{{ t('onboarding.step_2.title') }}</h2>
          <p class="text-app-xs text-sub">{{ t('onboarding.step_2.desc') }}</p>
        </div>

        <div class="settings-list flex flex-col gap-5">
          <!-- UI Language -->
          <div class="setting-block p-3.5 rounded-lg border border-border bg-bg">
            <div class="flex items-center gap-2 mb-2.5 font-bold text-text text-app-sm">
              <n-icon :component="LanguageOutlined" class="text-primary" />
              <span>{{ t('onboarding.step_2.ui_lang') }}</span>
            </div>
            <n-radio-group
              :value="store.userConfig.language_ui"
              name="ui-lang"
              @update:value="handleUiLanguageChange"
            >
              <n-space>
                <n-radio-button value="zh">简体中文</n-radio-button>
                <n-radio-button value="en">English</n-radio-button>
                <n-radio-button value="ja">日本語</n-radio-button>
              </n-space>
            </n-radio-group>
          </div>

          <!-- Item Language -->
          <div class="setting-block p-3.5 rounded-lg border border-border bg-bg">
            <div class="flex items-center gap-2 mb-2.5 font-bold text-text text-app-sm">
              <n-icon :component="TranslateOutlined" class="text-primary" />
              <span>{{ t('onboarding.step_2.item_lang') }}</span>
            </div>
            <n-radio-group
              :value="store.userConfig.language_item"
              name="item-lang"
              @update:value="handleItemLanguageChange"
            >
              <n-space>
                <n-radio-button value="auto">{{ t('common.auto') }}</n-radio-button>
                <n-radio-button value="zh">简体中文</n-radio-button>
                <n-radio-button value="en">English</n-radio-button>
                <n-radio-button value="ja">日本語</n-radio-button>
              </n-space>
            </n-radio-group>
          </div>

          <!-- Theme -->
          <div class="setting-block p-3.5 rounded-lg border border-border bg-bg">
            <div class="flex items-center gap-2 mb-2.5 font-bold text-text text-app-sm">
              <n-icon :component="ColorLensRound" class="text-primary" />
              <span>{{ t('onboarding.step_2.theme') }}</span>
            </div>
            <n-radio-group
              :value="store.userConfig.theme"
              name="theme"
              @update:value="handleThemeChange"
            >
              <n-space>
                <n-radio-button value="light">
                  <div class="flex items-center gap-1">
                    <n-icon :component="LightModeTwotone" />
                    <span>{{ t('preference.theme.option.light') }}</span>
                  </div>
                </n-radio-button>
                <n-radio-button value="dark">
                  <div class="flex items-center gap-1">
                    <n-icon :component="DarkModeTwotone" />
                    <span>{{ t('preference.theme.option.dark') }}</span>
                  </div>
                </n-radio-button>
                <n-radio-button value="system">
                  <div class="flex items-center gap-1">
                    <n-icon :component="SettingsBrightnessOutlined" />
                    <span>{{ t('preference.theme.option.follow_system') }}</span>
                  </div>
                </n-radio-button>
              </n-space>
            </n-radio-group>
          </div>
        </div>
      </div>

      <!-- Step 3: Interactive Features Showcase -->
      <div v-else-if="currentStep === 3" class="features-step py-2">
        <div class="step-header mb-4">
          <h2 class="text-xl font-bold text-text mb-1">{{ t('onboarding.step_3.title') }}</h2>
          <p class="text-app-xs text-sub">{{ t('onboarding.step_3.desc') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <!-- Feature 1: Hover -->
          <div class="feature-card p-3.5 rounded-lg border border-border bg-bg flex flex-col gap-1.5">
            <div class="flex items-center gap-2 text-primary font-bold text-app-sm">
              <n-icon :component="InfoOutlined" size="18" />
              <span>{{ t('onboarding.step_3.feature_hover_title') }}</span>
            </div>
            <p class="text-app-xs text-sub leading-relaxed">
              {{ t('onboarding.step_3.feature_hover_desc') }}
            </p>
          </div>

          <!-- Feature 2: Right Click -->
          <div class="feature-card p-3.5 rounded-lg border border-border bg-bg flex flex-col gap-1.5">
            <div class="flex items-center gap-2 text-primary font-bold text-app-sm">
              <n-icon :component="TouchAppOutlined" size="18" />
              <span>{{ t('onboarding.step_3.feature_menu_title') }}</span>
            </div>
            <p class="text-app-xs text-sub leading-relaxed">
              {{ t('onboarding.step_3.feature_menu_desc') }}
            </p>
          </div>
        </div>

        <!-- Interactive Playground -->
        <div class="playground-box p-4 rounded-lg border border-dashed border-primary/40 bg-bg-action">
          <p class="text-app-xs font-bold text-primary mb-3 flex items-center gap-1.5">
            <span>{{ t('onboarding.step_3.playground_tip') }}</span>
          </p>

          <div class="flex flex-wrap items-center gap-6 justify-center py-2">
            <!-- Demo ItemButton -->
            <div class="flex flex-col items-center gap-1.5">
              <ItemButton
                v-if="demoItem1"
                :item-info="demoItem1"
                show-icon
                show-name
                btn-extra-class="font-medium"
              />
              <span class="text-app-2xs text-sub">ItemButton (大按钮组件)</span>
            </div>

            <!-- Demo ItemSpan -->
            <div class="flex flex-col items-center gap-1.5">
              <div class="p-2 rounded bg-bg border border-border flex items-center">
                <ItemSpan
                  v-if="demoItem2"
                  :item-info="demoItem2"
                  :img-size="20"
                />
              </div>
              <span class="text-app-2xs text-sub">ItemSpan (内联标签组件)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Choose Default Homepage -->
      <div v-else-if="currentStep === 4" class="homepage-step py-2">
        <div class="step-header mb-4">
          <h2 class="text-xl font-bold text-text mb-1">{{ t('onboarding.step_4.title') }}</h2>
          <p class="text-app-xs text-sub">{{ t('onboarding.step_4.desc') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Choice 1: HQ Workbench -->
          <div
            class="choice-card p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2"
            :class="selectedHomepage === 'hqwb' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-bg hover:border-primary/40'"
            @click="selectedHomepage = 'hqwb'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <n-icon :component="DashboardOutlined" size="22" />
                </div>
                <span class="font-bold text-text text-app-base">{{ t('onboarding.step_4.hqwb_title') }}</span>
              </div>
              <n-icon
                :component="selectedHomepage === 'hqwb' ? CheckCircleFilled : CheckCircleOutlineRound"
                size="20"
                :class="selectedHomepage === 'hqwb' ? 'text-primary' : 'text-sub'"
              />
            </div>
            <p class="text-app-xs text-sub leading-relaxed mt-1">
              {{ t('onboarding.step_4.hqwb_desc') }}
            </p>
          </div>

          <!-- Choice 2: Recipe Calculator (Workflow) -->
          <div
            class="choice-card p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2"
            :class="selectedHomepage === 'workflow' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-bg hover:border-primary/40'"
            @click="selectedHomepage = 'workflow'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <n-icon :component="WavesOutlined" size="22" />
                </div>
                <span class="font-bold text-text text-app-base">{{ t('onboarding.step_4.workflow_title') }}</span>
              </div>
              <n-icon
                :component="selectedHomepage === 'workflow' ? CheckCircleFilled : CheckCircleOutlineRound"
                size="20"
                :class="selectedHomepage === 'workflow' ? 'text-primary' : 'text-sub'"
              />
            </div>
            <p class="text-app-xs text-sub leading-relaxed mt-1">
              {{ t('onboarding.step_4.workflow_desc') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Action Footer (Steps 2..4) -->
      <template v-if="currentStep > 1" #action>
        <div class="flex items-center justify-between">
          <n-button quaternary @click="handlePrev">
            <template #icon>
              <n-icon><ArrowBackOutlined /></n-icon>
            </template>
            {{ t('onboarding.btn.prev') }}
          </n-button>

          <n-button
            v-if="currentStep < totalSteps"
            type="primary"
            class="px-6 font-bold"
            @click="handleNext"
          >
            {{ t('onboarding.btn.next') }}
            <template #icon>
              <n-icon><ArrowForwardOutlined /></n-icon>
            </template>
          </n-button>

          <n-button
            v-else
            type="primary"
            class="px-6 font-bold"
            @click="handleFinish"
          >
            <template #icon>
              <n-icon><DoneOutlined /></n-icon>
            </template>
            {{ t('onboarding.btn.finish') }}
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

<style scoped>
.onboarding-card {
  border-radius: 12px;
  overflow: hidden;
}
.logo-wrapper {
  animation: float-slow 3s ease-in-out infinite;
}
@keyframes float-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
</style>
