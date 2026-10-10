<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import type { ScrollbarInst } from 'naive-ui'
import {
  SearchRound,
  CloseRound,
  SubdirectoryArrowLeftRound,
} from '@vicons/material'
import useConfig from '@/composables/useConfig'
import { useLocale } from '@/composables/useLocale'
import { useItemLocale } from '@/composables/useItemLocale'

const { t } = useLocale()
const { theme } = useConfig()
const { getItemName, getItemSubName } = useItemLocale()

export interface SearchOverlayProps {
  /** 候选数据源数组 */
  items: any[]
  /** 搜索输入框占位符 */
  placeholder?: string
  /** 初始未输入时的提示文本 */
  inputHint?: string
  /** 未找到匹配项时的提示文本 */
  noMatchHint?: string
  /** 最大匹配条数，默认 20 */
  maxResults?: number
  /** 自定义匹配规则，若不传则使用默认的模糊匹配（物品名、ID、品级、版本等） */
  filter?: (item: any, query: string) => boolean
  /** 自定义物品标题获取逻辑 */
  getItemTitle?: (item: any) => string
  /** 自定义物品副标题/描述获取逻辑 */
  getItemSubTitle?: (item: any) => string
  /** 自定义物品图标 URL 获取逻辑 */
  getItemIcon?: (item: any) => string
  /** 自定义物品标签获取逻辑 */
  getItemTags?: (item: any) => string[]
  /** 是否正在加载 */
  loading?: boolean
}

const show = defineModel<boolean>('show', { required: true })
const props = withDefaults(defineProps<SearchOverlayProps>(), {
  maxResults: 20,
})
const emits = defineEmits<{
  (e: 'select', item: any): void
}>()

const searchInputRef = ref<HTMLInputElement>()
const scrollbarRef = ref<ScrollbarInst>()
const searchQuery = ref('')
const debouncedQuery = ref('')
const activeIndex = ref(0)
const itemRefs = ref<HTMLElement[]>([])

let debounceTimer: ReturnType<typeof setTimeout> | undefined

const setItemRef = (el: any, index: number) => {
  if (el) {
    itemRefs.value[index] = el
  }
}

// 防抖处理输入
const handleInput = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = searchQuery.value
    activeIndex.value = 0
  }, 300)
}

const clearQuery = () => {
  searchQuery.value = ''
  debouncedQuery.value = ''
  activeIndex.value = 0
  searchInputRef.value?.focus()
}

// 计算单个物品针对查询词的匹配优先级：ID(1) > 名称(2) > 品级(3) > 版本(4) > 地图(5)
const getMatchRank = (item: any, query: string): number => {
  const q = query.trim().toLowerCase()
  if (!q) return Infinity

  // 1. ID 匹配 (仅精确匹配)
  const normalizedIdQuery = q.replace(/^(id|#)\s*/i, '')
  if (item.id?.toString() === q || item.id?.toString() === normalizedIdQuery) {
    return 1
  }

  // 2. 名称匹配 (模糊包含)
  const nameZh = item.name_zh?.toLowerCase()
  const nameEn = item.name_en?.toLowerCase()
  const nameJa = item.name_ja?.toLowerCase()
  const name = item.name?.toLowerCase()
  if (
    (nameZh && nameZh.includes(q)) ||
    (nameEn && nameEn.includes(q)) ||
    (nameJa && nameJa.includes(q)) ||
    (name && name.includes(q))
  ) {
    return 2
  }

  // 3. 品级匹配 (仅精确匹配)
  const normalizedIlvQuery = q.replace(/^(ilv|il)\s*/i, '')
  if (item.itemLevel?.toString() === q || item.itemLevel?.toString() === normalizedIlvQuery) {
    return 3
  }

  // 4. 版本匹配 (仅精确匹配)
  const normalizedPatchQuery = q.replace(/^(patch|v)\s*/i, '')
  const itemPatch = item.patch?.toString().toLowerCase()
  if (itemPatch && (itemPatch === q || itemPatch === normalizedPatchQuery)) {
    return 4
  }

  // 5. 地图匹配 (模糊包含)
  if (item.gatherInfo) {
    const pZh = item.gatherInfo.placeNameZH?.toLowerCase()
    const pEn = item.gatherInfo.placeNameEN?.toLowerCase()
    const pJa = item.gatherInfo.placeNameJA?.toLowerCase()
    if (
      (pZh && pZh.includes(q)) ||
      (pEn && pEn.includes(q)) ||
      (pJa && pJa.includes(q))
    ) {
      return 5
    }
  }

  return Infinity
}

// 过滤后的匹配物品列表（至多 maxResults 条，按 ID > 名称 > 品级 > 版本 > 地图 排序）
const filteredItems = computed(() => {
  const q = debouncedQuery.value.trim().toLowerCase()
  if (!q) return []

  if (props.filter) {
    const results: any[] = []
    for (const item of props.items) {
      if (props.filter(item, q)) {
        results.push(item)
        if (results.length >= props.maxResults) {
          break
        }
      }
    }
    return results
  }

  const matched: { item: any; rank: number }[] = []
  for (const item of props.items) {
    const rank = getMatchRank(item, q)
    if (rank !== Infinity) {
      matched.push({ item, rank })
    }
  }

  matched.sort((a, b) => a.rank - b.rank)

  return matched.slice(0, props.maxResults).map(m => m.item)
})

const resolveItemTitle = (item: any): string => {
  if (props.getItemTitle) return props.getItemTitle(item)
  return getItemName(item) || item.name || '未翻译的物品'
}

const resolveItemSubTitle = (item: any): string => {
  if (props.getItemSubTitle) return props.getItemSubTitle(item)
  return getItemSubName(item) || ''
}

const resolveItemIcon = (item: any): string => {
  if (props.getItemIcon) return props.getItemIcon(item)
  return item.iconUrl || item.icon || ''
}

const resolveItemTags = (item: any): string[] => {
  if (props.getItemTags) return props.getItemTags(item)
  const tags: string[] = []
  if (item.itemLevel) tags.push(`iLv ${item.itemLevel}`)
  if (item.patch) tags.push(`Patch ${item.patch}`)
  return tags
}

const handleSelect = (item: any) => {
  emits('select', item)
  show.value = false
}

// 键盘导航
const handleKeyDown = () => {
  if (!filteredItems.value.length) return
  activeIndex.value = (activeIndex.value + 1) % filteredItems.value.length
  scrollToActive()
}

const handleKeyUp = () => {
  if (!filteredItems.value.length) return
  activeIndex.value = (activeIndex.value - 1 + filteredItems.value.length) % filteredItems.value.length
  scrollToActive()
}

const handleKeyEnter = () => {
  if (!filteredItems.value.length) return
  const current = filteredItems.value[activeIndex.value]
  if (current) {
    handleSelect(current)
  }
}

const scrollToActive = () => {
  nextTick(() => {
    const el = itemRefs.value[activeIndex.value]
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  })
}

// 弹窗打开后自动聚焦
const handleAfterEnter = () => {
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

// 监听弹窗显示状态切换
watch(show, (newVal) => {
  if (newVal) {
    searchQuery.value = ''
    debouncedQuery.value = ''
    activeIndex.value = 0
    itemRefs.value = []
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  } else {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  }
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<template>
  <n-modal
    v-model:show="show"
    :mask-closable="true"
    :auto-focus="false"
    class="search-overlay-modal"
    @after-enter="handleAfterEnter"
  >
    <div
      class="search-overlay-card w-[94vw] max-w-165 border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto"
      :class="'theme-' + theme"
      @keydown.down.prevent="handleKeyDown"
      @keydown.up.prevent="handleKeyUp"
      @keydown.enter.prevent="handleKeyEnter"
    >
      <!-- Search Input Header -->
      <div class="search-header h-13 flex items-center gap-3 px-4 border-b border-border box-border overflow-hidden shrink-0">
        <n-icon :size="22" class="text-sub shrink-0">
          <SearchRound />
        </n-icon>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="grow bg-transparent border-none outline-none text-text text-app-base placeholder:text-sub"
          :placeholder="placeholder || t('common.search_overlay.placeholder')"
          @input="handleInput"
        />
        <div
          v-if="searchQuery"
          role="button"
          tabindex="0"
          class="cursor-pointer text-sub hover:text-text shrink-0 flex items-center justify-center w-6 h-6 rounded-full hover:bg-bg-hover transition-colors"
          @click="clearQuery"
        >
          <n-icon :size="18">
            <CloseRound />
          </n-icon>
        </div>
      </div>

      <!-- Results Container (Fixed Height 330px) -->
      <n-scrollbar
        ref="scrollbarRef"
        class="search-results-container"
        style="height: 330px;"
      >
        <!-- No query entered hint -->
        <div
          v-if="!debouncedQuery.trim()"
          class="flex flex-col items-center justify-center p-8 text-center text-sub text-app-sm select-none"
          style="height: 330px;"
        >
          <slot name="empty-hint">
            <div class="text-app-base font-medium mb-1">{{ inputHint || t('common.search_overlay.input_hint') }}</div>
          </slot>
        </div>

        <!-- No match found -->
        <div
          v-else-if="filteredItems.length === 0"
          class="flex flex-col items-center justify-center p-8 text-center text-sub text-app-sm select-none"
          style="height: 330px;"
        >
          <slot name="no-match">
            <n-icon :size="36" class="text-sub/50 mb-2">
              <SearchRound />
            </n-icon>
            <div>{{ noMatchHint || t('common.search_overlay.no_match') }}</div>
          </slot>
        </div>

        <!-- Item List -->
        <div v-else class="divide-y divide-border/40">
          <div
            v-for="(item, idx) in filteredItems"
            :key="item.id ?? idx"
            :ref="el => setItemRef(el, idx)"
            class="search-item flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer select-none"
            :class="{ active: activeIndex === idx }"
            @mouseenter="activeIndex = idx"
            @click="handleSelect(item)"
          >
            <slot
              name="item"
              :item="item"
              :active="activeIndex === idx"
              :index="idx"
            >
              <!-- Default item row layout -->
              <div class="flex items-center gap-3 min-w-0 grow">
                <XivFARImage
                  v-if="resolveItemIcon(item)"
                  class="shrink-0 rounded"
                  :size="36"
                  :src="resolveItemIcon(item)"
                  :lazy="false"
                />
                <div class="flex flex-col min-w-0 grow">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-medium text-app-base truncate"
                      :class="activeIndex === idx ? 'text-primary' : 'text-text'"
                    >
                      {{ resolveItemTitle(item) }}
                    </span>
                  </div>
                  <div
                    v-if="resolveItemSubTitle(item)"
                    class="text-sub text-app-xs truncate mt-0.5"
                  >
                    {{ resolveItemSubTitle(item) }}
                  </div>
                </div>
              </div>

              <!-- Tags / Enter Icon on Right -->
              <div class="flex items-center gap-2 shrink-0">
                <span
                  v-for="tag in resolveItemTags(item)"
                  :key="tag"
                  class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-app-2xs rounded bg-bg-action text-sub border border-border"
                  style="line-height: 1;"
                >
                  {{ tag }}
                </span>
                <n-icon
                  v-if="activeIndex === idx"
                  class="text-primary text-app-sm"
                >
                  <SubdirectoryArrowLeftRound />
                </n-icon>
              </div>
            </slot>
          </div>
        </div>
      </n-scrollbar>

      <!-- Footer Bar -->
      <div
        class="search-footer px-4 py-2 border-t border-border flex items-center justify-between text-sub text-app-xs select-none shrink-0"
      >
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1">
            <kbd class="border border-border rounded px-1 text-app-2xs bg-bg">↑</kbd>
            <kbd class="border border-border rounded px-1 text-app-2xs bg-bg">↓</kbd>
            <span>{{ t('common.search_overlay.navigate') }}</span>
          </span>
          <span class="flex items-center gap-1">
            <kbd class="border border-border rounded px-1 text-app-2xs bg-bg">↵</kbd>
            <span>{{ t('common.search_overlay.select') }}</span>
          </span>
        </div>
        <div v-if="debouncedQuery.trim() && filteredItems.length > 0" class="text-app-xs">
          {{ t('common.search_overlay.results_count', { count: filteredItems.length }) }}
        </div>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
:deep(.search-overlay-modal) {
  margin-top: 10vh !important;
}
@media (max-width: 640px) {
  :deep(.search-overlay-modal) {
    margin-top: 5vh !important;
  }
}

.search-overlay-card {
  background-color: var(--app-color-background-modal, #ffffff);
}
.search-overlay-card.theme-dark {
  background-color: var(--app-color-background-modal, rgb(44, 44, 50));
}
.search-overlay-card.theme-light {
  background-color: var(--app-color-background-modal, #ffffff);
}

.search-header {
  background-color: var(--app-color-background-modal, #ffffff);
}
.theme-dark .search-header {
  background-color: var(--app-color-background-modal, rgb(44, 44, 50));
}

.search-results-container {
  height: 330px !important;
  background-color: var(--app-color-background-modal, #ffffff);
}
.theme-dark .search-results-container {
  background-color: var(--app-color-background-modal, rgb(44, 44, 50));
}

.search-item {
  transition: background-color 0.15s ease;
}
.search-item:hover,
.search-item.active {
  background-color: var(--app-color-background-hover, rgba(128, 128, 128, 0.15));
}

.search-footer {
  background-color: var(--app-color-background-action, rgb(250, 250, 252));
}
.theme-dark .search-footer {
  background-color: var(--app-color-background-action, rgb(56, 56, 62));
}
</style>
