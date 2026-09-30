<script setup lang="ts">
import {
  NotificationsNoneRound,
  NotificationsRound,
  StarBorderRound,
  StarRound,
} from '@vicons/material'
import XivMap from '@/components/map/XivMap.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemButton from '@/components/item/ItemButton.vue'
import LocationSpan from '@/components/map/LocationSpan.vue'
import useConfig from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { useEorzeaTime } from '@/composables/useEorzeaTime'
import { useResponsive } from '@/composables/useResponsive'
import { XivJobs, type XivJob } from '@/assets/data'
import type { ItemInfo } from '@/types/item'
import { XivMaps } from '@/tools/game/map'
import { dealTimeLimit } from '@/views/gatherclock/utils/dealTimeLimit'

const { t } = useLocale()
const { isMobile } = useResponsive()
const { currentET } = useEorzeaTime()
const {
  uiLanguage, itemLanguage,
} = useConfig()

interface GatherItemCardProps {
  banItemPop: boolean
  showMap: boolean
  item: ItemInfo
  isSubscribed?: boolean
  isStarred?: boolean
  subscribedItems?: number[]
  starItems?: number[]
  highlight?: boolean
}
const props = defineProps<GatherItemCardProps>()
const emits = defineEmits([
  'onSubscribeButtonClick',
  'onStarButtonClick',
])

const isSubscribed = computed(() => {
  if (props.isSubscribed !== undefined) return props.isSubscribed
  return props.subscribedItems?.includes(props.item.id) ?? false
})
const isStarred = computed(() => {
  if (props.isStarred !== undefined) return props.isStarred
  return props.starItems?.includes(props.item.id) ?? false
})

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

const timeLimitInfo = computed(() => {
  const currentMinutes = currentET.value.hour * 60 + currentET.value.minute
  return props.item.gatherInfo.timeLimitInfo.map(tli => {
    const dl = dealTimeLimit(tli.start, tli.end, currentMinutes, t)
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
  <div
    :id="'gather-item-card-' + item.id"
    class="item-card"
    :class="{ highlighted: props.highlight }"
    :data-item-id="item.id"
  >
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
              <n-icon v-if="isSubscribed" color="#A80ABF">
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
              <n-icon v-if="isStarred" color="#F6CA45">
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
            :size="14"
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
            <span v-if="timelimit.canGather" class="text-success" style="margin-left: 5px;">
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
.item-card.highlighted {
  border-color: var(--color-primary, #18a058) !important;
  box-shadow: 0 0 0 3px rgba(24, 160, 88, 0.4), 0 0 16px rgba(24, 160, 88, 0.6) !important;
  animation: card-highlight-pulse 0.8s ease-in-out infinite alternate;
}
@keyframes card-highlight-pulse {
  from {
    box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.3), 0 0 8px rgba(24, 160, 88, 0.4);
    transform: scale(1);
  }
  to {
    box-shadow: 0 0 0 4px rgba(24, 160, 88, 0.6), 0 0 20px rgba(24, 160, 88, 0.8);
    transform: scale(1.02);
  }
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
      --font-size: var(--app-font-size);

      .gather-job {
        font-size: var(--font-size);
        text-align: left;
        width: 70%;
        line-height: var(--font-size);

        .icon {
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