<script setup lang="ts">
import {
  NotificationsRound, NotificationsNoneRound,
  StarBorderRound, StarRound,
} from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemButton from '@/components/item/ItemButton.vue'
import XivMap from '@/components/map/XivMap.vue'
import LocationSpan from '@/components/map/LocationSpan.vue'
import { XivJobs, type XivJob } from '@/assets/data'
import { XivMaps } from '@/tools/game/map'
import { type ItemInfo } from '@/tools/item'
import UseConfig from '@/composables/useConfig'
import EorzeaTime from '@/utils/game.et'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const currentET = inject<Ref<EorzeaTime>>('currentET')!

const {
  uiLanguage, itemLanguage,
} = UseConfig()

interface GatherItemCardProps {
  banItemPop: boolean
  showMap: boolean
  item: ItemInfo
  subscribedItems: number[]
  starItems: number[]
}
const props = defineProps<GatherItemCardProps>()
const emits = defineEmits([
  'onSubscribeButtonClick',
  'onStarButtonClick',
])

const getJobName = (jobInfo: XivJob) => {
  switch (uiLanguage.value) {
    case 'ja':
      return jobInfo?.job_name_ja || t('common.unknown')
    case 'en':
      return jobInfo?.job_name_en || t('common.unknown')
    case 'zh':
    default:
      return jobInfo?.job_name_zh || t('common.unknown')
  }
}
const getPlaceName = (itemInfo : ItemInfo) => {
  switch (itemLanguage.value) {
    case 'ja':
      return itemInfo.gatherInfo?.placeNameJA
    case 'en':
      return itemInfo.gatherInfo?.placeNameEN
    case 'zh':
    default:
      return itemInfo.gatherInfo?.placeNameZH
  }
}
const getItemGatherLocation = (itemInfo: ItemInfo) => {
  return t('item.text.quoted_position', { x: itemInfo.gatherInfo.posX.toFixed(1), y: itemInfo.gatherInfo.posY.toFixed(1) })
}

const dealTimeLimit = (start: string, end: string) => {
  let progressStatus : 'info' | 'warning' | 'error' = 'info'
  let progressPercentage = 0
  let canGather = false
  let remainET = 99999
  let remainLT : string | undefined = undefined
  let ltClass = 'font-small'
  let ltTitle = ''
  try {
    const parseTime = (time: string) => time.split(':').reduce((acc, val, idx) => acc + parseInt(val) * [60, 1][idx], 0)
    const s = parseTime(start)
    const e = parseTime(end)
    const c = currentET.value.hour * 60 + currentET.value.minute
    let ls = 0
    if (c >= s && c < e) {
      canGather = true
      progressPercentage = (c - s) / (e - s) * 100
      remainET = e - c
      ls = Math.floor(EorzeaTime.EorzeaMinute2LocalSecond(remainET))
      if (ls < 30) {
        ltClass += ' color-error'
      } else if (ls < 60) {
        ltClass += ' color-warning'
      }
      ltTitle = '剩余可采集时间'
    } else {
      progressPercentage = 0
      remainET = s - c
      if (remainET < 0) {
        remainET += 1440
      }
      ls = Math.floor(EorzeaTime.EorzeaMinute2LocalSecond(remainET))
      ltClass += ' text-sub'
      ltTitle = '距离变得可采集的剩余时间'
    }
    remainLT = t('common.remain_with_colon')
    if (ls >= 60) {
      remainLT += t('common.val_minutes', Math.floor(ls / 60))
    }
    remainLT += t('common.val_seconds', ls % 60)
  } catch (err) {
    console.error(err)
    progressStatus = 'error'; progressPercentage = 100
  }
  return {
    canGather: canGather,
    status: progressStatus,
    percentage: progressPercentage,
    remainLT, ltClass, ltTitle,
    remainET
  }
}

const timeLimitInfo = computed(() => {
  return props.item.gatherInfo.timeLimitInfo.map(tli => {
    const dl = dealTimeLimit(tli.start, tli.end)
    return {
      ...tli,
      ...dl,
    }
  })
})

const handleSubscribeButtonClick = (item: ItemInfo) => {
  emits('onSubscribeButtonClick', item)
}
const handleStarButtonClick = (item: ItemInfo) => {
  emits('onStarButtonClick', item)
}
</script>

<template>
  <div class="item-card">
    <div class="title">
      <ItemButton
        :item-info="item"
        show-icon show-name
        btn-extra-style="flex-grow: 1;"
        :disable-pop="banItemPop"
        pop-use-custom-width
        :pop-custom-width="isMobile ? 300 : undefined"
      />
      <n-popover placement="top" :trigger="isMobile ? 'manual' : 'hover'" :keep-alive-on-hover="false">
        <template #trigger>
          <n-button class="btn-alarm" @click="handleSubscribeButtonClick(item)">
            <template #icon>
              <n-icon v-if="subscribedItems.includes(item.id)" color="#A80ABF">
                <NotificationsRound />
              </n-icon>
              <n-icon v-else color="#A80ABF">
                <NotificationsNoneRound />
              </n-icon>
            </template>
          </n-button>
        </template>
        <div>{{ t('gather_clock.tooltip.subscribe_1') }}</div>
        <div>{{ t('gather_clock.tooltip.subscribe_2', t('gather_clock.preference.mention_way.title')) }}</div>
      </n-popover>
      <n-popover placement="top" :trigger="isMobile ? 'manual' : 'hover'" :keep-alive-on-hover="false">
        <template #trigger>
          <n-button class="btn-star" @click="handleStarButtonClick(item)">
            <template #icon>
              <n-icon v-if="starItems.includes(item.id)" color="#F6CA45">
                <StarRound />
              </n-icon>
              <n-icon v-else color="#F6CA45">
                <StarBorderRound />
              </n-icon>
            </template>
          </n-button>
        </template>
        <div>{{ t('common.favorite.desc.desc_1') }}</div>
        <div>{{ t('common.favorite.desc.desc_2') }}</div>
      </n-popover>
    </div>
    <n-divider class="m-0!" />
    <div class="content">
      <div class="standard-info">
        <div class="gather-job">
          <XivFARImage
            class="icon"
            :src="XivJobs[item.gatherInfo.jobId].job_icon_url"
          />
          <p>{{ getJobName(XivJobs[item.gatherInfo.jobId]) }}</p>
        </div>
        <div class="recommended-aetheryte" v-if="XivMaps[item.gatherInfo.placeID]">
          <span>{{ t('common.recomm') }}</span>
          <span style="vertical-align: middle;">
            <XivFARImage
              :size="14"
              src="./ui/aetheryte.png"
            />
          </span>
          <span>
            {{ item.gatherInfo.recommAetheryte?.[`name_${itemLanguage}`] }}
          </span>
        </div>
        <div class="gather-place">
          <LocationSpan
            :place-id="item.gatherInfo.placeID"
            :place-name="getPlaceName(item)"
            :coordinate-x="item.gatherInfo.posX"
            :coordinate-y="item.gatherInfo.posY"
            hide-coordinates
          />
          <div>{{ getItemGatherLocation(item) }}</div>
        </div>
      </div>
      <XivMap
        v-if="showMap && XivMaps[item.gatherInfo.placeID]"
        :map-data="XivMaps[item.gatherInfo.placeID]"
        :map-size="isMobile ? 225 : 125"
        :flag-x="item.gatherInfo.posX"
        :flag-y="item.gatherInfo.posY"
        style="justify-content: end;"
      />
      <div class="progresses">
        <div
          v-for="(timelimit, tlIndex) in timeLimitInfo"
          :key="item.id + '-' + tlIndex"
        >
          <div>
            {{ timelimit.start }} ~ {{ timelimit.end }}
            <span v-if="timelimit.canGather" class="color-success" style="margin-left: 5px;">
              {{ t('common.gatherable_now') }}
            </span>
            <span
              v-if="timelimit.remainLT"
              :title="timelimit.ltTitle"
              :class="timelimit.ltClass"
              style="margin-left: 5px;"
            >
              {{ timelimit.remainLT }}
            </span>
          </div>
          <n-progress
            type="line"
            processing
            :show-indicator="false"
            :status="timelimit.status"
            :percentage="timelimit.percentage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-card:hover {
  box-shadow: 0 0 10px var(--primary-color);
  border-color: var(--primary-color);
}
.item-card {
  height: 100%;
  border-radius: 5px;
  border: 1px solid var(--primary-color);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
  padding: 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  
  .title {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.2rem;

    .btn-alarm,
    .btn-star {
      padding: 0px 8px;
    }
  }
  .content {
    .standard-info {
      position: relative;
      line-height: 1.2;
      margin: 0 0.1rem 0.2rem;
      --font-size: var(--n-font-size);

      .gather-job {
        font-size: var(--font-size);
        text-align: left;
        width: 70%;
        line-height: var(--font-size);

        img {
          float: left;
          height: var(--font-size);
          display: block;
          user-select: none;
        }
        p {
          font-size: var(--font-size);
          padding-left: var(--textgap-left);
        }
      }
      .recommended-aetheryte {
        margin-top: 3px;
        max-width: 60%;
      }
      .gather-place {
        position: absolute;
        text-align: right;
        top: 0;
        right: 0;
      }
    }
    .progresses {
      margin: 0 0.1rem;
    }
  }
}

/* Desktop */
@media screen and (min-width: 768px) {
  .item-card .title .btn-star {
    height: 100%;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .item-card {
    width: 100%;
  }
}
</style>