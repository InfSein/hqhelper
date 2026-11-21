<script setup lang="ts">
import {
  AccessTimeFilled,
  ContentCopyRound,
  CheckRound,
  DoneOutlined,
} from '@vicons/material'
import EorzeaTime from '@/utils/game.et'
import useConfig from '@/composables/useConfig'
import { useEorzeaTime } from '@/composables/useEorzeaTime'
import { useLocale } from '@/composables/useLocale'
import { CopyToClipboard, formatTime, formatTimestamp } from '@/tools'

const { uiLanguage } = useConfig()
const { t } = useLocale()
const { currentET } = useEorzeaTime()
const NAIVE_UI_MESSAGE = useMessage()

const showModal = defineModel<boolean>('show', { required: true })

const wrapper = ref<HTMLElement | null>(null)

const ltIconClass = computed(() => uiLanguage.value === 'zh' ? 'xiv local-time-chs' : 'xiv local-time')
const etIconClass = computed(() => uiLanguage.value === 'zh' ? 'xiv eorzea-time-chs' : 'xiv eorzea-time')

// 实时本地时间（每250ms刷新）
const currentLocalDate = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

watch(showModal, (visible) => {
  if (visible) {
    currentLocalDate.value = new Date()
    timer = setInterval(() => {
      currentLocalDate.value = new Date()
    }, 250)
  } else if (timer) {
    clearInterval(timer)
    timer = null
  }
}, { immediate: true })

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

interface EorzeaDateLike {
  year: number
  month: number
  day: number
}

// 星历日期格式化 (作为 title 悬浮展示)
const formatEorzeaDate = (et: EorzeaDateLike) => {
  return t('eorzea_time_modal.eorzea_date', {
    year: et.year,
    month: et.month,
    day: et.day,
  })
}

// --- 模块 1: 本地时间 -> 艾欧泽亚时间 ---
const inputLT = ref<number>(Date.now())
const calculatedET = computed(() => {
  const ts = inputLT.value || Date.now()
  return new EorzeaTime(new Date(ts))
})

const handleSetLTToNow = () => {
  inputLT.value = Date.now()
}

const isCopiedLT2ET = ref(false)
const handleCopyLT2ET = async () => {
  const text = t('eorzea_time_modal.copy_lt_to_et_content', {
    lt: formatTimestamp(inputLT.value || Date.now()),
    et: calculatedET.value.gameTime,
  })
  const err = await CopyToClipboard(text, wrapper.value)
  if (!err) {
    isCopiedLT2ET.value = true
    NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
    setTimeout(() => {
      isCopiedLT2ET.value = false
    }, 1500)
  }
}

// --- 模块 2: 艾欧泽亚时间 -> 下次到达本地时间 ---
const inputETHour = ref<number | null>(0)
const inputETMinute = ref<number | null>(0)

// 初始化为下一个整点 ET
const initETTime = () => {
  const nextHour = (currentET.value.hour + 1) % 24
  inputETHour.value = nextHour
  inputETMinute.value = 0
}
initETTime()

const handleSetETToCurrent = () => {
  inputETHour.value = currentET.value.hour
  inputETMinute.value = currentET.value.minute
}

const handleSetETToNextHour = () => {
  const nextHour = (currentET.value.hour + 1) % 24
  inputETHour.value = nextHour
  inputETMinute.value = 0
}

const nextLocalDate = computed(() => {
  const h = inputETHour.value ?? 0
  const m = inputETMinute.value ?? 0
  return EorzeaTime.getNextLocalTime(h, m, currentLocalDate.value)
})

const isCopiedET2LT = ref(false)
const handleCopyET2LT = async () => {
  const h = inputETHour.value ?? 0
  const m = inputETMinute.value ?? 0
  const etStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  const text = t('eorzea_time_modal.copy_et_to_lt_content', {
    et: etStr,
    lt: formatTimestamp(nextLocalDate.value.getTime()),
  })
  const err = await CopyToClipboard(text, wrapper.value)
  if (!err) {
    isCopiedET2LT.value = true
    NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
    setTimeout(() => {
      isCopiedET2LT.value = false
    }, 1500)
  }
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="AccessTimeFilled"
    :title="t('eorzea_time_modal.title')"
    max-width="640px"
  >
    <div ref="wrapper" class="flex flex-col gap-4 py-1">
      <!-- 弹窗顶部: 当前时刻看板 -->
      <GroupBox :title="t('eorzea_time_modal.current_time')">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          <n-card size="small">
            <div class="text-center text-app-xl">
              <i :class="ltIconClass"></i>
              <span class="ml-1">{{ formatTime(currentLocalDate.getTime()) }}</span>
            </div>
          </n-card>
          <n-card size="small">
            <div class="text-center text-app-xl" :title="formatEorzeaDate(currentET)">
              <i :class="etIconClass"></i>
              <span class="ml-1">{{ currentET.gameTime }}</span>
            </div>
          </n-card>
        </div>
      </GroupBox>

      <!-- 弹窗中部: 本地时间 -> 艾欧泽亚时间 -->
      <GroupBox :title="t('eorzea_time_modal.lt_to_et')">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          <!-- 左侧: 本地时间选择 -->
          <n-card size="small">
            <template #header>
              <div class="flex items-center gap-1 font-bold">
                <i :class="ltIconClass"></i>
                <span>{{ t('eorzea_time_modal.local_time') }}</span>
              </div>
            </template>
            <template #header-extra>
              <n-button size="tiny" tertiary @click="handleSetLTToNow">
                {{ t('eorzea_time_modal.set_to_now') }}
              </n-button>
            </template>
            <n-date-picker
              v-model:value="inputLT"
              type="datetime"
              format="yyyy-MM-dd HH:mm:ss"
              clearable
              class="w-full"
            />
          </n-card>

          <!-- 右侧: 艾欧泽亚时间结果 -->
          <n-card size="small">
            <template #header>
              <div class="flex items-center gap-1 font-bold">
                <i :class="etIconClass"></i>
                <span>{{ t('eorzea_time_modal.eorzea_time') }}</span>
              </div>
            </template>
            <div class="flex items-center justify-center gap-2 h-full min-h-8">
              <span :title="formatEorzeaDate(calculatedET)">
                {{ calculatedET.gameTime }}
              </span>
              <n-button text @click="handleCopyLT2ET">
                <template #icon>
                  <n-icon :component="isCopiedLT2ET ? CheckRound : ContentCopyRound" />
                </template>
              </n-button>
            </div>
          </n-card>
        </div>
      </GroupBox>

      <!-- 弹窗中部: 艾欧泽亚时间 -> 下次到达本地时间 -->
      <GroupBox :title="t('eorzea_time_modal.et_to_lt')">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          <!-- 左侧: 艾欧泽亚时间输入 -->
          <n-card size="small">
            <template #header>
              <div class="flex items-center gap-1 font-bold">
                <i :class="etIconClass"></i>
                <span>{{ t('eorzea_time_modal.eorzea_time') }}</span>
              </div>
            </template>
            <template #header-extra>
              <div class="flex items-center gap-1">
                <n-button size="tiny" tertiary @click="handleSetETToCurrent">
                  {{ t('eorzea_time_modal.set_to_current_et') }}
                </n-button>
                <n-button size="tiny" tertiary @click="handleSetETToNextHour">
                  {{ t('eorzea_time_modal.set_to_next_hour') }}
                </n-button>
              </div>
            </template>
            <div>
              <n-input-group>
                <n-input-number
                  v-model:value="inputETHour"
                  :min="0"
                  :max="23"
                  placeholder="HH"
                  class="w-1/2 text-center"
                  button-placement="both"
                >
                  <template #suffix>
                    <span class="text-sub text-app-xs">{{ t('eorzea_time_modal.hour_suffix') }}</span>
                  </template>
                </n-input-number>
                <n-input-number
                  v-model:value="inputETMinute"
                  :min="0"
                  :max="59"
                  placeholder="mm"
                  class="w-1/2 text-center"
                  button-placement="both"
                >
                  <template #suffix>
                    <span class="text-sub text-app-xs">{{ t('eorzea_time_modal.minute_suffix') }}</span>
                  </template>
                </n-input-number>
              </n-input-group>
            </div>
          </n-card>

          <!-- 右侧: 下次到达时的本地时间结果 -->
          <n-card size="small">
            <template #header>
              <div class="flex items-center gap-1 font-bold">
                <i :class="ltIconClass"></i>
                <span>{{ t('eorzea_time_modal.next_local_time') }}</span>
              </div>
            </template>
            <div class="flex items-center justify-center gap-2 h-full min-h-8">
              <span>
                {{ formatTimestamp(nextLocalDate.getTime()) }}
              </span>
              <n-button text @click="handleCopyET2LT">
                <template #icon>
                  <n-icon :component="isCopiedET2LT ? CheckRound : ContentCopyRound" />
                </template>
              </n-button>
            </div>
          </n-card>
        </div>
      </GroupBox>
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
