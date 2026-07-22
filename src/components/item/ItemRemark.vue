<script setup lang="ts">
import ItemSpan from './ItemSpan.vue'
import LocationSpan from '@/components/map/LocationSpan.vue'
import { getItemInfo } from '@/tools/item'

const t = inject<(message: string, args?: any) => string>('t')!
// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

interface ItemRemarkProps {
  remarks: string[]
  /** 手动指定悬浮窗的触发方式 */
  popTrigger?: 'hover' | 'click' | 'manual'
}
defineProps<ItemRemarkProps>()

const dealLocationInfo = (str: string) => {
  const [placeId, posX, posY] = str.replace('~LOCATION:', '').split(',')
  return {
    placeId: Number(placeId),
    coordinateX: Number(posX),
    coordinateY: Number(posY)
  }
}

const dealRemarkContent = (str: string) => {
  const classes : string[] = []
  const styles : string[] = []
  if (str.includes('~SMALL:')) {
    classes.push('font-small')
    str = str.replace('~SMALL:', '')
  }
  if (str.includes('~LEFTMAR:')) {
    styles.push('margin-left: 1em;')
    str = str.replace('~LEFTMAR:', '')
  }
  return {
    content: str,
    classes: classes.join(' '),
    styles: styles.join(' ')
  }
}
</script>

<template>
  <div class="remark-container">
    <template
      v-for="(remark, index) in remarks"
      :key="index"
    >
      <span v-if="remark.startsWith('~REQUIRE')">
        <div class="item small-font">
          {{ t('item.text.need_learn') }}
          <ItemSpan hide-pop-icon span-max-width="180px" :img-size="12" :item-info="getItemInfo(Number(remark.replace('~REQUIRE:', '')))" />
        </div>
      </span>
      <span v-else-if="remark.startsWith('~ITEM')">
        <ItemSpan
          :item-info="getItemInfo(Number(remark.replace('~ITEM:', '')))"
          hide-pop-icon
          style="display: inline; margin: 0 3px;"
        />
      </span>
      <span v-else-if="remark.startsWith('~LOCATION')">
        <LocationSpan
          v-bind="dealLocationInfo(remark)"
          style="display: inline; margin: 0 3px;"
          :pop-trigger="popTrigger"
        />
      </span>
      <br v-else-if="remark === 'BR'" />
      <span
        v-else
        :class="dealRemarkContent(remark).classes"
        :style="dealRemarkContent(remark).styles"
      >
        {{ dealRemarkContent(remark).content }}
      </span>
    </template>
  </div>
</template>

<style scoped>
/* All */
.small-font {
  font-size: calc(var(--n-font-size) - 2px);
}
.item {
  margin-left: 1em;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
}

/* Desktop */
@media screen and (min-width: 768px) {
}

/* Mobile */
@media screen and (max-width: 767px) {
}
</style>