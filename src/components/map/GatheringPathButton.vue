<script setup lang="ts">
import {
  MapOutlined,
} from '@vicons/material'
import ItemPop from '@/components/item/ItemPop.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useLocale } from '@/composables/useLocale'
import UseConfig from '@/composables/useConfig.ts'
import { useResponsive } from '@/composables/useResponsive'
import { XivJobs } from '@/assets/data'
import type { ItemInfo } from '@/tools/item'
import { XivMaps, type XivMapAetheryteInfo, type XivMapInfo } from '@/tools/game/map.ts'

const { t } = useLocale()
const { isMobile } = useResponsive()
const { itemLanguage } = UseConfig()

interface GatheringPathButtonProps {
  targetItems: ItemInfo[]

  /** 物品按钮所处容器的ID，在模态框等场景时必须传递，否则无法正常复制物品名 */
  containerId?: string
}
const props = defineProps<GatheringPathButtonProps>()

interface GatheringTarget {
  item: ItemInfo
  mapId: number
  map: XivMapInfo
  x: number
  y: number
  nearestAetheryte?: XivMapAetheryteInfo
  nearestAetheryteDist: number
}

interface PathActionTeleport {
  type: 'teleport'
  mapId: number
  map: XivMapInfo
  aetheryte: XivMapAetheryteInfo
}
interface PathActionGather {
  type: 'gather'
  target: GatheringTarget
}
type PathAction = PathActionTeleport | PathActionGather

interface MapPathLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

const PATH_COLOR = '#9B4545'
const GATHER_JOB_SVG_IDS = new Set([16, 17, 18])

const targetItems = computed(() => props.targetItems.filter(item => item.gatherInfo?.placeID))
const relatePlaceIds = computed(() => {
  const placeIds = new Set<number>()
  targetItems.value.forEach(item => {
    if (item.gatherInfo?.placeID) {
      placeIds.add(item.gatherInfo.placeID)
    }
  })
  return Array.from(placeIds)
})
const relateMaps = computed(() => {
  return relatePlaceIds.value
    .map(placeId => ({ placeId, map: XivMaps[placeId] }))
    .filter(entry => !!entry.map) as { placeId: number; map: XivMapInfo }[]
})

const gatheringTargets = computed<GatheringTarget[]>(() => {
  return targetItems.value
    .map(item => {
      const gatherInfo = item.gatherInfo
      if (!gatherInfo?.placeID) return undefined
      const map = XivMaps[gatherInfo.placeID]
      if (!map) return undefined

      const nearest = getNearestAetheryteToPoint(map, gatherInfo.posX, gatherInfo.posY)
      return {
        item,
        mapId: gatherInfo.placeID,
        map,
        x: gatherInfo.posX,
        y: gatherInfo.posY,
        nearestAetheryte: nearest?.aetheryte,
        nearestAetheryteDist: nearest?.dist ?? Infinity,
      }
    })
    .filter(Boolean) as GatheringTarget[]
})

const routeTargetIndices = computed(() => solveShortestRoute(gatheringTargets.value))

const orderedTargets = computed(() => {
  const targets = gatheringTargets.value
  return routeTargetIndices.value
    .map(index => targets[index])
    .filter(Boolean)
})

const pathActions = computed<PathAction[]>(() => {
  const actions: PathAction[] = []
  let current: { mapId: number; x: number; y: number } | null = null

  for (const target of orderedTargets.value) {
    const decision = shouldTeleportToTarget(current, target)

    if (decision.useTeleport && target.nearestAetheryte) {
      actions.push({
        type: 'teleport',
        mapId: target.mapId,
        map: target.map,
        aetheryte: target.nearestAetheryte,
      })
      current = {
        mapId: target.mapId,
        x: target.nearestAetheryte.x,
        y: target.nearestAetheryte.y,
      }
    }

    actions.push({
      type: 'gather',
      target,
    })

    current = {
      mapId: target.mapId,
      x: target.x,
      y: target.y,
    }
  }

  return actions
})

const displayMapRenderData = computed(() => {
  const targetsByPlaceId = new Map<number, GatheringTarget[]>()
  const linesByPlaceId = new Map<number, MapPathLine[]>()

  gatheringTargets.value.forEach(target => {
    if (!targetsByPlaceId.has(target.mapId)) {
      targetsByPlaceId.set(target.mapId, [])
    }
    targetsByPlaceId.get(target.mapId)!.push(target)
  })

  pathActions.value.reduce<{ mapId: number; x: number; y: number } | null>((lastPoint, action) => {
    if (action.type === 'teleport') {
      return {
        mapId: action.mapId,
        x: action.aetheryte.x,
        y: action.aetheryte.y,
      }
    }

    if (lastPoint && lastPoint.mapId === action.target.mapId) {
      if (!linesByPlaceId.has(action.target.mapId)) {
        linesByPlaceId.set(action.target.mapId, [])
      }
      linesByPlaceId.get(action.target.mapId)!.push({
        x1: lastPoint.x,
        y1: lastPoint.y,
        x2: action.target.x,
        y2: action.target.y,
      })
    }

    return {
      mapId: action.target.mapId,
      x: action.target.x,
      y: action.target.y,
    }
  }, null)

  return relateMaps.value.map(({ placeId, map }) => ({
    placeId,
    map,
    targets: targetsByPlaceId.get(placeId) ?? [],
    lines: linesByPlaceId.get(placeId) ?? [],
  }))
})

const shouldShowButton = computed(() => gatheringTargets.value.length > 0)

const popoverWidth = computed(() => isMobile.value ? '85vw' : '498px')
const popoverContentMaxHeight = computed(() => isMobile.value ? '60vh' : '515px')

const MAP_SIZE = 222
const PATH_END_PADDING_PX = 7

function getMapScale(mapSize: number) {
  return mapSize / 40
}

function getPositionStyle(x: number, y: number, mapSize = MAP_SIZE) {
  const mapScale = getMapScale(mapSize)
  return {
    left: `${(x - 1) * mapScale}px`,
    top: `${(y - 1) * mapScale}px`,
    width: '16px',
    height: '16px',
  }
}

function getLineStyle(line: MapPathLine, mapSize = MAP_SIZE) {
  const mapScale = getMapScale(mapSize)
  const x1 = (line.x1 - 1) * mapScale
  const y1 = (line.y1 - 1) * mapScale
  const rawX2 = (line.x2 - 1) * mapScale
  const rawY2 = (line.y2 - 1) * mapScale
  const dx = rawX2 - x1
  const dy = rawY2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const trim = len > PATH_END_PADDING_PX ? PATH_END_PADDING_PX : 0
  const ratio = len > 0 ? (len - trim) / len : 1
  return {
    x1,
    y1,
    x2: x1 + dx * ratio,
    y2: y1 + dy * ratio,
  }
}

function getDistance(x1: number, y1: number, x2: number, y2: number) {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dx * dx + dy * dy)
}

function getNearestAetheryteToPoint(map: XivMapInfo, x: number, y: number) {
  if (!map.aetherytes.length) return undefined

  let minDist = Infinity
  let nearest: XivMapAetheryteInfo | undefined

  map.aetherytes.forEach(aetheryte => {
    const dist = getDistance(x, y, aetheryte.x, aetheryte.y)
    if (dist < minDist) {
      minDist = dist
      nearest = aetheryte
    }
  })

  if (!nearest) return undefined

  return {
    aetheryte: nearest,
    dist: minDist,
  }
}

function calculateTransitionCost(
  from: GatheringTarget | null,
  to: GatheringTarget,
): number {
  const teleportCost = to.nearestAetheryteDist

  if (!from) {
    return teleportCost
  }

  if (from.mapId === to.mapId) {
    const walkCost = getDistance(from.x, from.y, to.x, to.y)
    return Math.min(walkCost, teleportCost)
  }

  return teleportCost
}

function shouldTeleportToTarget(
  current: { mapId: number; x: number; y: number } | null,
  target: GatheringTarget,
) {
  if (!target.nearestAetheryte || target.nearestAetheryteDist === Infinity) {
    return { useTeleport: false }
  }

  if (!current) {
    return { useTeleport: true }
  }

  if (current.mapId !== target.mapId) {
    return { useTeleport: true }
  }

  const walkCost = getDistance(current.x, current.y, target.x, target.y)
  return {
    useTeleport: target.nearestAetheryteDist < walkCost,
  }
}

function solveShortestRoute(targets: GatheringTarget[]) {
  const n = targets.length
  if (n <= 1) {
    return n === 1 ? [0] : []
  }

  // 小规模时用精确 TSP（Held-Karp），保证全局最短。
  if (n <= 14) {
    return solveRouteWithDp(targets)
  }

  // 大规模降级为贪心，避免指数复杂度造成卡顿。
  return solveRouteWithGreedy(targets)
}

function solveRouteWithDp(targets: GatheringTarget[]) {
  const n = targets.length
  const totalMasks = 1 << n
  const distFromStart = Array.from({ length: n }, (_, i) => calculateTransitionCost(null, targets[i]))
  const dist = Array.from({ length: n }, (_, i) => {
    return Array.from({ length: n }, (_, j) => {
      if (i === j) return Infinity
      return calculateTransitionCost(targets[i], targets[j])
    })
  })

  const dp = Array.from({ length: totalMasks }, () => Array(n).fill(Infinity))
  const parent = Array.from({ length: totalMasks }, () => Array(n).fill(-1))

  for (let i = 0; i < n; i++) {
    dp[1 << i][i] = distFromStart[i]
  }

  for (let mask = 1; mask < totalMasks; mask++) {
    for (let last = 0; last < n; last++) {
      if (!(mask & (1 << last))) continue
      const currentCost = dp[mask][last]
      if (!Number.isFinite(currentCost)) continue

      for (let next = 0; next < n; next++) {
        if (mask & (1 << next)) continue
        const nextCost = dist[last][next]
        if (!Number.isFinite(nextCost)) continue

        const nextMask = mask | (1 << next)
        const totalCost = currentCost + nextCost
        if (totalCost < dp[nextMask][next]) {
          dp[nextMask][next] = totalCost
          parent[nextMask][next] = last
        }
      }
    }
  }

  const fullMask = totalMasks - 1
  let bestEnd = -1
  let bestCost = Infinity

  for (let i = 0; i < n; i++) {
    if (dp[fullMask][i] < bestCost) {
      bestCost = dp[fullMask][i]
      bestEnd = i
    }
  }

  if (bestEnd === -1 || !Number.isFinite(bestCost)) {
    return solveRouteWithGreedy(targets)
  }

  const order: number[] = []
  let mask = fullMask
  let current = bestEnd

  while (current !== -1) {
    order.push(current)
    const prev = parent[mask][current]
    mask ^= (1 << current)
    current = prev
  }

  order.reverse()
  return order
}

function solveRouteWithGreedy(targets: GatheringTarget[]) {
  const n = targets.length
  const unvisited = new Set<number>(Array.from({ length: n }, (_, i) => i))
  const order: number[] = []

  let currentIndex: number | null = null

  while (unvisited.size > 0) {
    let bestIndex = -1
    let bestCost = Infinity

    for (const idx of unvisited) {
      const from = currentIndex === null ? null : targets[currentIndex]
      const cost = calculateTransitionCost(from, targets[idx])
      if (cost < bestCost) {
        bestCost = cost
        bestIndex = idx
      }
    }

    if (bestIndex === -1) {
      break
    }

    order.push(bestIndex)
    unvisited.delete(bestIndex)
    currentIndex = bestIndex
  }

  if (unvisited.size > 0) {
    order.push(...Array.from(unvisited))
  }

  return order
}

function hasGatherJobSvg(jobId: number) {
  return GATHER_JOB_SVG_IDS.has(jobId)
}
function getGatherJobSvgSrc(jobId: number) {
  return `./image/game-job/svg/class_job_${jobId.toString().padStart(3, '0')}.svg`
}
function getGatherJobSvgStyle(jobId: number) {
  const svg = getGatherJobSvgSrc(jobId)
  return {
    backgroundColor: PATH_COLOR,
    WebkitMaskImage: `url(${svg})`,
    maskImage: `url(${svg})`,
  }
}
</script>

<template>
  <div v-if="shouldShowButton" class="gathering-path-button">
    <n-popover
      :trigger="isMobile ? 'click' : 'hover'"
      :placement="isMobile ? 'bottom' : 'right-start'"
      :style="{ width: popoverWidth }"
    >
      <template #trigger>
        <n-button quaternary size="tiny" class="n-square-button">
          <n-icon :component="MapOutlined" />
        </n-button>
      </template>

      <div class="path-popover">
        <div class="popover-header">
          <div class="title font-big">
            <n-icon :size="16" :component="MapOutlined" />
            <span>{{ t('map.gathering_path.title') }}</span>
          </div>
          <n-divider style="margin: 0 0 3px;" />
        </div>

        <div v-if="!pathActions.length" class="empty-hint">
          {{ t('map.gathering_path.text.empty_hint') }}
        </div>

        <n-scrollbar v-else trigger="none" :style="{ maxHeight: popoverContentMaxHeight }">
          <div class="map-container">
            <div
              v-for="entry in displayMapRenderData"
              :key="entry.placeId"
              class="map-panel"
            >
              <div class="map-title">{{ entry.map[`name_${itemLanguage}`] }}</div>
              <div class="map-content" :style="{ width: MAP_SIZE + 'px', height: MAP_SIZE + 'px' }">
                <XivFARImage
                  class="map-image"
                  :size="MAP_SIZE"
                  :src="entry.map.map_src"
                />

                <svg class="path-svg" :width="MAP_SIZE" :height="MAP_SIZE">
                  <defs>
                    <marker
                      :id="`gather-path-arrowhead-${entry.placeId}`"
                      markerWidth="5"
                      markerHeight="5"
                      refX="5"
                      refY="2.5"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0.5 L5,2.5 L0,4.5 Z" :fill="PATH_COLOR" />
                    </marker>
                  </defs>
                  <line
                    v-for="(line, lineIndex) in entry.lines"
                    :key="`line-${entry.placeId}-${lineIndex}`"
                    :x1="getLineStyle(line).x1"
                    :y1="getLineStyle(line).y1"
                    :x2="getLineStyle(line).x2"
                    :y2="getLineStyle(line).y2"
                    :stroke="PATH_COLOR"
                    :stroke-width="1.5"
                    :marker-end="`url(#gather-path-arrowhead-${entry.placeId})`"
                  />
                </svg>

                <div class="markers-overlay">
                  <template v-for="(aetheryte, idx) in entry.map.aetherytes" :key="`aeth-${entry.placeId}-${idx}`">
                    <n-tooltip
                      :trigger="isMobile ? 'click' : 'hover'"
                      :show-arrow="false"
                      :keep-alive-on-hover="false"
                      style="padding: 4px 8px;"
                      content-style="padding: 0;"
                    >
                      <template #trigger>
                        <XivFARImage
                          class="marker aetheryte"
                          src="./ui/aetheryte.png"
                          :style="getPositionStyle(aetheryte.x, aetheryte.y)"
                        />
                      </template>
                      <div class="tooltip">{{ aetheryte[`name_${itemLanguage}`] }}</div>
                    </n-tooltip>
                  </template>

                  <template v-for="(target, targetIndex) in entry.targets" :key="`target-${entry.placeId}-${target.item.id}-${targetIndex}`">
                    <ItemPop :item-info="target.item" :container-id="containerId">
                      <template #default>
                        <div
                          class="marker gather-point"
                          :style="getPositionStyle(target.x, target.y)"
                        >
                          <span
                            v-if="hasGatherJobSvg(target.item.gatherInfo?.jobId || 0)"
                            class="gather-point-icon-box"
                          >
                            <span
                              class="gather-point-icon-svg"
                              :style="getGatherJobSvgStyle(target.item.gatherInfo?.jobId || 0)"
                            />
                          </span>
                          <XivFARImage
                            v-else
                            :size="16"
                            :src="XivJobs[target.item.gatherInfo?.jobId || 0]?.job_icon_url || './image/game-job/companion/none.png'"
                          />
                        </div>
                      </template>
                    </ItemPop>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </n-popover>
  </div>
</template>

<style scoped>
.gathering-path-button {
  display: inline-flex;
  align-items: center;
}

.path-popover {
  display: flex;
  flex-direction: column;

  .popover-header {
    .title {
      display: flex;
      align-items: center;
      gap: 3px;
    }
  }
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-sub);
}

.map-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  padding-right: 12px;

  .map-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .map-content {
      position: relative;

      .map-image {
        display: block;
        pointer-events: none;
      }

      .path-svg {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 4;
      }

      .markers-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;

        .marker {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 5;
          pointer-events: auto;
        }

        .gather-point {
          width: 16px;
          height: 16px;

          .gather-point-icon-box {
            display: inline-flex;
            width: 16px;
            height: 16px;
            align-items: center;
            justify-content: center;
            border: 1px solid #9B4545;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.9);
            box-sizing: border-box;
          }

          .gather-point-icon-svg {
            display: block;
            width: 14px;
            height: 14px;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: contain;
            mask-size: contain;
          }
        }
      }
    }
  }
}

.tooltip {
  font-size: 12px;
  text-align: center;
}
</style>
