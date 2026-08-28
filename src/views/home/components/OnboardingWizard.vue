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
import AppLogoPlate from '@/components/app/AppLogoPlate.vue'
import ItemButton from '@/components/item/ItemButton.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { getItemInfo } from '@/tools/item'
import ItemCell from '@/components/item/ItemCell.vue'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const store = useStore()
const { t, setLocale } = useLocale()

const currentStep = ref(1)
const totalSteps = 4

// 选中的默认首页
const selectedHomepage = ref<'hqwb' | 'workflow'>(store.userConfig.default_homepage || 'hqwb')

// 示例物品数据
const demoItem1 = computed(() => getItemInfo(44162))
const demoItem2 = computed(() => getItemInfo(44163))
const demoItem3 = computed(() => getItemInfo(44164))

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
  <div class="min-h-[80vh] flex items-center justify-center pt-6 md:pt-10 pb-12 px-3">
    <n-card
      embedded
      :bordered="false"
      class="max-w-240 w-[98%] rounded overflow-hidden"
      :class="store.userConfig.custom_background ? 'glasscard' : ''"
    >
      <!-- Stepper Header (Steps 2..4) -->
      <div class="mb-6 px-2" :class="currentStep > 1 ? '' : 'opacity-0'">
        <n-steps :current="currentStep - 1" :status="'process'" size="small">
          <n-step :title="t('onboarding.step_2.name')" />
          <n-step :title="t('onboarding.step_3.name')" />
          <n-step :title="t('onboarding.step_4.name')" />
        </n-steps>
      </div>

      <div class="min-h-95 max-h-[50vh] flex items-center justify-center">
        <Transition name="step-fade" mode="out-in">
          <!-- Step 1: Welcome -->
          <div v-if="currentStep === 1" key="step-1" class="text-center py-4 flex flex-col items-center justify-center">
            <div class="logo-wrapper mb-5">
              <AppLogoPlate />
            </div>
            <h1 class="text-2xl font-bold text-text">{{ t('onboarding.welcome.title') }}</h1>
            <p class="text-app-base text-primary font-medium mb-4">{{ t('onboarding.welcome.subtitle') }}</p>
            <p class="text-app-sm text-sub max-w-125 leading-relaxed">
              {{ t('onboarding.welcome.desc_1') }}
            </p>
            <p class="text-app-sm text-sub max-w-125 mb-8 leading-relaxed">
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
        <div v-else-if="currentStep === 2" key="step-2" class="w-full py-2 px-4">
          <div class="step-header mb-5">
            <h2 class="text-xl font-bold text-text mb-1">{{ t('onboarding.step_2.title') }}</h2>
            <p class="text-app-xs text-sub">{{ t('onboarding.step_2.desc') }}</p>
          </div>

          <div class="settings-list flex flex-col gap-1">
            <!-- UI Language -->
            <div class="p-3.5">
              <div class="flex items-center gap-1 mb-2.5">
                <n-icon :component="LanguageOutlined" class="text-primary" />
                <div class="font-bold text-text">{{ t('onboarding.step_2.ui_lang') }}</div>
              </div>
              <n-radio-group
                :value="store.userConfig.language_ui"
                name="ui-lang"
                @update:value="handleUiLanguageChange"
              >
                <n-radio-button value="zh">简体中文</n-radio-button>
                <n-radio-button value="en">English</n-radio-button>
                <n-radio-button value="ja">日本語</n-radio-button>
              </n-radio-group>
            </div>

            <!-- Item Language -->
            <div class="p-3.5">
              <div class="flex items-center gap-1 mb-2.5">
                <n-icon :component="TranslateOutlined" class="text-primary" />
                <div class="font-bold text-text">{{ t('onboarding.step_2.item_lang') }}</div>
              </div>
              <n-radio-group
                :value="store.userConfig.language_item"
                name="item-lang"
                @update:value="handleItemLanguageChange"
              >
                <n-radio-button value="auto">{{ t('common.auto') }}</n-radio-button>
                <n-radio-button value="zh">简体中文</n-radio-button>
                <n-radio-button value="en">English</n-radio-button>
                <n-radio-button value="ja">日本語</n-radio-button>
              </n-radio-group>
            </div>

            <!-- Theme -->
            <div class="p-3.5">
              <div class="flex items-center gap-1 mb-2.5">
                <n-icon :component="ColorLensRound" class="text-primary" />
                <div class="font-bold text-text">{{ t('onboarding.step_2.theme') }}</div>
              </div>
              <n-radio-group
                :value="store.userConfig.theme"
                name="theme"
                @update:value="handleThemeChange"
              >
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
              </n-radio-group>
            </div>
          </div>
        </div>

        <!-- Step 3: Interactive Features Showcase -->
        <div v-else-if="currentStep === 3" key="step-3" class="w-full py-2 px-4">
          <div class="step-header mb-5">
            <h2 class="text-xl font-bold text-text mb-1">{{ t('onboarding.step_3.title') }}</h2>
            <p class="text-app-xs text-sub">{{ t('onboarding.step_3.desc') }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3 mb-5">
            <n-alert type="info" :title="t('onboarding.step_3.feature_hover_title')">
              {{ t('onboarding.step_3.feature_hover_desc') }}
            </n-alert>
            <n-alert type="warning" :title="t('onboarding.step_3.feature_menu_title')">
              {{ t('onboarding.step_3.feature_menu_desc') }}
            </n-alert>
          </div>

          <!-- Interactive Playground -->
          <n-alert type="success" :title="t('onboarding.step_3.playground_tip')">
            <n-table :single-line="false" class="text-center">
              <thead>
                <tr>
                  <th class="font-bold!">{{ t('onboarding.step_3.button') }}</th>
                  <th class="font-bold!">{{ t('onboarding.step_3.label') }}</th>
                  <th class="font-bold!">{{ t('onboarding.step_3.cell') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <ItemButton :item-info="demoItem1" show-icon show-name />
                  </td>
                  <td>
                    <div class="flex items-center justify-center">
                      <ItemSpan :item-info="demoItem2" :img-size="14" />
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center justify-center">
                      <ItemCell :item-info="demoItem3" :amount="0" show-item-details />
                    </div>
                  </td>
                </tr>
              </tbody>
            </n-table>
          </n-alert>
        </div>

        <!-- Step 4: Choose Default Homepage -->
        <div v-else-if="currentStep === 4" key="step-4" class="w-full py-2 px-4">
          <div class="step-header mb-5">
            <h2 class="text-xl font-bold text-text mb-1">{{ t('onboarding.step_4.title') }}</h2>
            <p class="text-app-xs text-sub">{{ t('onboarding.step_4.desc') }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <!-- Choice 1: Recipe Calculator (Workflow) -->
            <div
              class="choice-card p-4.5 rounded border transition-all cursor-pointer flex flex-col gap-2.5 select-none"
              :class="selectedHomepage === 'workflow' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-bg hover:border-primary/50 hover:bg-bg-hover/40'"
              @click="selectedHomepage = 'workflow'"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="p-2.5 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <n-icon :component="WavesOutlined" size="22" />
                  </div>
                  <span class="font-bold text-text text-app-base">{{ t('onboarding.step_4.workflow_title') }}</span>
                </div>
                <n-icon
                  :component="selectedHomepage === 'workflow' ? CheckCircleFilled : CheckCircleOutlineRound"
                  size="22"
                  :class="selectedHomepage === 'workflow' ? 'text-primary' : 'text-sub'"
                />
              </div>
              <p class="text-app-xs text-sub leading-relaxed mt-1">
                {{ t('onboarding.step_4.workflow_desc') }}
              </p>
            </div>

            <!-- Choice 2: HQ Workbench -->
            <div
              class="choice-card p-4.5 rounded border transition-all cursor-pointer flex flex-col gap-2.5 select-none"
              :class="selectedHomepage === 'hqwb' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-bg hover:border-primary/50 hover:bg-bg-hover/40'"
              @click="selectedHomepage = 'hqwb'"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="p-2.5 rounded bg-primary/10 text-primary flex items-center justify-center">
                    <n-icon :component="DashboardOutlined" size="22" />
                  </div>
                  <span class="font-bold text-text text-app-base">{{ t('onboarding.step_4.hqwb_title') }}</span>
                </div>
                <n-icon
                  :component="selectedHomepage === 'hqwb' ? CheckCircleFilled : CheckCircleOutlineRound"
                  size="22"
                  :class="selectedHomepage === 'hqwb' ? 'text-primary' : 'text-sub'"
                />
              </div>
              <p class="text-app-xs text-sub leading-relaxed mt-1">
                {{ t('onboarding.step_4.hqwb_desc') }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
      </div>

      <!-- Action Footer (Steps 2..4) -->
      <template #action>
        <div class="flex items-center justify-between" :class="currentStep > 1 ? '' : 'opacity-0'">
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
.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.step-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.step-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
