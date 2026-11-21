<script setup lang="ts">
import {
  ChecklistRtlSharp,
  CloseRound,
  KeyboardArrowDownRound,
  KeyboardArrowUpRound,
  RefreshOutlined,
} from '@vicons/material'
import useCloud from '@/composables/useCloud'
import useConfig from '@/composables/useConfig'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'

const { t } = useLocale()
const { alertInfo } = useDialog()
const { isMobile } = useResponsive()
const { theme } = useConfig()
const { userLoggedIn, userId } = useCloud()

const showModal = defineModel<boolean>('show', { required: true })

interface SponsorInfo {
  /** 赞助者名称 */
  name: string
  /** 赞助者关联的系统id */
  nbbid?: number
  /** 上次赞助时间 */
  date: string
  /** 上次赞助留言，没有返回空字符串即可 */
  word: string
  /** 赞助过的版本代数 */
  sponsored: number[]
}
interface SponsorApiResponse {
  success: boolean
  errmsg: string
  data: {
    content: {
      sponsors: SponsorInfo[]
    }
  }
}
interface MarqueeCell {
  sponsor: SponsorInfo
  index: number
  key: string
}
interface MarqueeRow {
  id: number
  halfItems: MarqueeCell[]
  durationSec: number
  delaySec: number
}

const sponsorLoadingStatus = ref<"finished" | "loading" | "error">('loading')
const sponsorLoadError = ref('')
const sponsors = ref<SponsorInfo[]>([])

// 翻页与交互状态
const currentPage = ref<1 | 2>(1)
const isTransitioning = ref(false)
const hoveredIndex = ref<number | null>(null)
const pinnedIndex = ref<number | null>(null)
const isPopoverHovered = ref(false)

// 气泡定位与容器引用
const silkStageRef = ref<HTMLElement | null>(null)
const silkCanvasRef = ref<HTMLCanvasElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const popoverPos = ref({ left: 16, top: 16 })

// WebGL 与交互辅助状态
let glContext: WebGLRenderingContext | null = null
let glProgram: WebGLProgram | null = null
let uTimeLoc: WebGLUniformLocation | null = null
let uResLoc: WebGLUniformLocation | null = null
let uThemeLoc: WebGLUniformLocation | null = null
let rafId: number | null = null
let resizeObserver: ResizeObserver | null = null
let glStartTime = 0
let touchStartY = 0
const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 判断当前登录用户是否在赞助者名单中登记 */
const matchedUserSponsor = computed(() => {
  if (!userLoggedIn.value || !userId.value) return undefined
  return sponsors.value.find(
    (sp) => sp.nbbid !== undefined && Number(sp.nbbid) === Number(userId.value),
  )
})

/** 当前正在展示详情的赞助者索引与数据 */
const activeSponsorIndex = computed(() => {
  return pinnedIndex.value !== null ? pinnedIndex.value : hoveredIndex.value
})
const activeSponsor = computed(() => {
  if (activeSponsorIndex.value === null) return undefined
  return sponsors.value[activeSponsorIndex.value]
})

/** 仅在悬停或点击锁定具体赞助者（或其详情卡片）时暂停横向滚动 */
const isMarqueePaused = computed(() => {
  return (
    isPopoverHovered.value ||
    hoveredIndex.value !== null ||
    pinnedIndex.value !== null
  )
})

/** 将赞助者列表拆分为多行，并重复填充至安全宽度以实现无缝循环 */
const marqueeRows = computed<MarqueeRow[]>(() => {
  const total = sponsors.value.length
  if (!total) return []

  const rowCount = total <= 3 ? 1 : total <= 6 ? 2 : total <= 10 ? 3 : total <= 15 ? 4 : total <= 22 ? 5 : 6
  const buckets: { sponsor: SponsorInfo; index: number }[][] = Array.from(
    { length: rowCount },
    () => [],
  )

  sponsors.value.forEach((sponsor, index) => {
    buckets[index % rowCount].push({ sponsor, index })
  })

  return buckets.map((bucket, rowIdx) => {
    const repeatCount = Math.max(1, Math.ceil(10 / bucket.length))
    const halfItems: MarqueeCell[] = []
    for (let r = 0; r < repeatCount; r++) {
      bucket.forEach((entry) => {
        halfItems.push({
          sponsor: entry.sponsor,
          index: entry.index,
          key: `r${rowIdx}-c${r}-i${entry.index}`,
        })
      })
    }
    const speedPerItem = 4.0 + (rowIdx % 3) * 0.45
    const durationSec = Math.max(24, Math.round(halfItems.length * speedPerItem))
    const delaySec = -(rowIdx * 6.5)
    return {
      id: rowIdx,
      halfItems,
      durationSec,
      delaySec,
    }
  })
})

const getSponsorGenStyle = (gen: number) => {
  const genColors = ['#DC143C', '#E05328', '#C68B38', '#2E8B57', '#008080', '#3164B5', '#8C5E3C']
  return [
    '--gen-bg-color: ' + (genColors[gen - 1] ?? '#5a5a5a'),
  ]
}
const getSponsorGenContent = (gen: number) => {
  const genContent = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  return genContent[gen - 1] ?? '?' // 12年，够用到我弃坑了
}

const loadSponsors = async () => {
  currentPage.value = 1
  hoveredIndex.value = null
  pinnedIndex.value = null
  isPopoverHovered.value = false

  try {
    sponsorLoadingStatus.value = 'loading'
    sponsorLoadError.value = ''
    sponsors.value = []
    let loadSponsorsResponse : string
    const url = `https://hqhelper.com/api/sponsors?t=${new Date().getTime()}`
    if (window.electronAPI?.httpGet) {
      loadSponsorsResponse = await window.electronAPI.httpGet(url)
    } else {
      loadSponsorsResponse = await fetch(url)
        .then(response => response.text())
    }
    const sponsorsContent = JSON.parse(loadSponsorsResponse) as SponsorApiResponse
    if (!sponsorsContent.success) {
      throw new Error(sponsorsContent.errmsg)
    }
    sponsors.value = sponsorsContent.data.content.sponsors
    sponsorLoadingStatus.value = 'finished'
  } catch (e: any) {
    sponsorLoadingStatus.value = 'error'
    sponsorLoadError.value = e?.message ?? 'UNKNOWN ERROR' + e
  }
}

const showRules = () => {
  const msg = [
    t('donate_us.desc.desc_3'),
    t('donate_us.desc.desc_6'),
  ].join('\n')
  alertInfo(msg)
}

/** 计算并限制详情气泡位置，防止被弹窗边缘裁切 */
const updatePopoverPosition = async (targetEl: HTMLElement) => {
  await nextTick()
  const stageEl = silkStageRef.value
  if (!stageEl) return

  const stageRect = stageEl.getBoundingClientRect()
  const targetRect = targetEl.getBoundingClientRect()
  const popWidth = popoverRef.value?.offsetWidth || 280
  const popHeight = popoverRef.value?.offsetHeight || 128

  let left = (targetRect.left - stageRect.left) + (targetRect.width - popWidth) / 2
  left = Math.max(12, Math.min(left, stageRect.width - popWidth - 12))

  let top = (targetRect.bottom - stageRect.top) + 8
  if (top + popHeight > stageRect.height - 54) {
    top = (targetRect.top - stageRect.top) - popHeight - 8
  }
  top = Math.max(12, top)

  popoverPos.value = { left, top }
}

const handleSponsorEnter = (index: number, event: MouseEvent) => {
  if (isMobile.value || pinnedIndex.value !== null) return
  hoveredIndex.value = index
  const target = event.currentTarget as HTMLElement | null
  if (target) updatePopoverPosition(target)
}

const handleSponsorLeave = (index: number) => {
  if (isMobile.value || pinnedIndex.value !== null) return
  if (hoveredIndex.value === index) {
    hoveredIndex.value = null
  }
}

const handleSponsorClick = (index: number, event: MouseEvent) => {
  event.stopPropagation()
  if (pinnedIndex.value === index) {
    pinnedIndex.value = null
    hoveredIndex.value = null
    return
  }
  pinnedIndex.value = index
  hoveredIndex.value = index
  const target = event.currentTarget as HTMLElement | null
  if (target) updatePopoverPosition(target)
}

const clearSelection = () => {
  pinnedIndex.value = null
  hoveredIndex.value = null
  isPopoverHovered.value = false
}

const handleStageClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target?.closest('.sponsor-word') && !target?.closest('.floating-popover')) {
    clearSelection()
  }
}

/** 切换第一页（名单）与第二页（专属致谢） */
const goToPage = (target: 1 | 2) => {
  if (target === currentPage.value || isTransitioning.value) return
  if (target === 2 && !matchedUserSponsor.value) return
  isTransitioning.value = true
  clearSelection()
  currentPage.value = target
  window.setTimeout(() => {
    isTransitioning.value = false
  }, 650)
}

const handleWheel = (event: WheelEvent) => {
  if (!matchedUserSponsor.value || Math.abs(event.deltaY) < 8) return
  if (currentPage.value === 1 && event.deltaY > 0) {
    event.preventDefault()
    goToPage(2)
  } else if (currentPage.value === 2 && event.deltaY < 0) {
    event.preventDefault()
    goToPage(1)
  }
}

const handleTouchStart = (event: TouchEvent) => {
  touchStartY = event.touches[0]?.clientY ?? 0
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!matchedUserSponsor.value) return
  const endY = event.changedTouches[0]?.clientY ?? touchStartY
  const deltaY = touchStartY - endY
  if (currentPage.value === 1 && deltaY > 40) {
    goToPage(2)
  } else if (currentPage.value === 2 && deltaY < -40) {
    goToPage(1)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showModal.value || !matchedUserSponsor.value) return
  if (currentPage.value === 1 && (event.key === 'ArrowDown' || event.key === 'PageDown')) {
    event.preventDefault()
    goToPage(2)
  } else if (currentPage.value === 2 && (event.key === 'ArrowUp' || event.key === 'PageUp')) {
    event.preventDefault()
    goToPage(1)
  }
}

/** 初始化 WebGL 各向异性丝绸褶皱背景 */
const destroySilkShader = () => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (glContext) {
    if (glProgram) {
      glContext.deleteProgram(glProgram)
      glProgram = null
    }
    glContext.getExtension('WEBGL_lose_context')?.loseContext()
    glContext = null
  }
}

const resizeSilkCanvas = () => {
  const canvas = silkCanvasRef.value
  const stage = silkStageRef.value
  if (!canvas || !stage || !glContext) return
  const rect = stage.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.width = Math.max(1, Math.floor(rect.width * dpr))
  canvas.height = Math.max(1, Math.floor(rect.height * dpr))
  glContext.viewport(0, 0, canvas.width, canvas.height)
}

const drawSilkFrame = (now: number) => {
  if (!glContext || !uTimeLoc || !uResLoc || !uThemeLoc || !silkCanvasRef.value) return
  if (silkCanvasRef.value.width > 0 && silkCanvasRef.value.height > 0) {
    const elapsed = prefersReducedMotion ? 1.5 : (now - glStartTime) * 0.001
    glContext.uniform1f(uTimeLoc, elapsed)
    glContext.uniform2f(uResLoc, silkCanvasRef.value.width, silkCanvasRef.value.height)
    glContext.uniform1f(uThemeLoc, theme.value === 'light' ? 1.0 : 0.0)
    glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4)
  }

  if (!prefersReducedMotion && showModal.value) {
    rafId = requestAnimationFrame(drawSilkFrame)
  } else {
    rafId = null
  }
}

const initSilkShader = () => {
  destroySilkShader()
  const canvas = silkCanvasRef.value
  const stage = silkStageRef.value
  if (!canvas || !stage) return

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  })
  if (!gl) return

  const vsSource = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `
  const fsSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_res;
    uniform float u_theme;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / max(vec2(1.0), u_res.xy);
      vec2 p = (uv - 0.5) * vec2(u_res.x / max(1.0, u_res.y), 1.0);
      float t = u_time * 0.075;

      float ang = 0.42;
      mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
      vec2 rp = rot * p;

      float warp = noise(vec2(rp.x * 1.3, rp.y * 0.7 - t));
      float a = rp.x * 5.0 + warp * 1.4;
      float b = rp.y * 2.2 + noise(rp * 1.7 + t * 0.55) * 0.68;

      float dh = cos(a + t) * 5.0 + 0.42 * cos(a * 1.75 - t * 0.8 + b) * 8.8;
      vec3 n = normalize(vec3(-dh * 0.08, -0.05, 1.0));

      vec3 L = normalize(vec3(-0.45, 0.65, 0.62));
      float diff = clamp((dot(n, L) + 0.25) / 1.25, 0.0, 1.0);
      diff = diff * diff * (3.0 - 2.0 * diff);

      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float spec = pow(max(dot(n, H), 0.0), 14.0);
      // 仅中心区域保有丝绸色彩与光泽，向外自然收束淡出
      float centerFocus = 1.0 - smoothstep(0.05, 0.85, length(p * vec2(0.72, 1.05)));

      // 暗色：中心暖金丝绸，向外融向 rgb(44,44,50)；亮色：中心暖香槟亚麻，向外融向 #fff
      vec3 darkEdge = vec3(0.173, 0.173, 0.196);
      vec3 darkWarm = vec3(0.265, 0.202, 0.135);
      vec3 darkSheen = vec3(0.82, 0.62, 0.34);
      vec3 colDark = mix(darkEdge, darkWarm, diff * (0.35 + 0.65 * centerFocus));
      colDark = mix(colDark, darkSheen, spec * (0.28 * centerFocus));

      vec3 lightEdge = vec3(1.0, 1.0, 1.0);
      vec3 lightWarm = vec3(0.942, 0.896, 0.828);
      vec3 lightSheen = vec3(0.996, 0.976, 0.942);
      vec3 colLight = mix(lightEdge, lightWarm, (1.0 - diff * 0.55) * (0.35 + 0.65 * centerFocus));
      colLight = mix(colLight, lightSheen, spec * (0.36 * centerFocus));

      vec3 col = mix(colDark, colLight, u_theme);
      col += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) * 0.012;
      gl_FragColor = vec4(col, 1.0);
    }
  `

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
  }

  const vs = compile(gl.VERTEX_SHADER, vsSource)
  const fs = compile(gl.FRAGMENT_SHADER, fsSource)
  if (!vs || !fs) return

  const prog = gl.createProgram()
  if (!prog) return
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const posLoc = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

  glContext = gl
  glProgram = prog
  uTimeLoc = gl.getUniformLocation(prog, 'u_time')
  uResLoc = gl.getUniformLocation(prog, 'u_res')
  uThemeLoc = gl.getUniformLocation(prog, 'u_theme')
  glStartTime = performance.now()

  resizeSilkCanvas()
  resizeObserver = new ResizeObserver(() => {
    resizeSilkCanvas()
    if (prefersReducedMotion) drawSilkFrame(performance.now())
  })
  resizeObserver.observe(stage)
  rafId = requestAnimationFrame(drawSilkFrame)
}

watch(
  () => [showModal.value, sponsorLoadingStatus.value] as const,
  async ([isOpen, status]) => {
    if (isOpen && status === 'finished') {
      await nextTick()
      initSilkShader()
    } else if (!isOpen) {
      destroySilkShader()
    }
  },
)

watch(theme, () => {
  if (prefersReducedMotion && glContext) {
    drawSilkFrame(performance.now())
  }
})

watch(matchedUserSponsor, (val) => {
  if (!val && currentPage.value === 2) {
    currentPage.value = 1
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  destroySilkShader()
})
</script>

<template>
  <MyModal
    v-model:show="showModal"
    max-width="600px"
    @on-load="loadSponsors"
  >
    <template #header>
      <div class="card-title select-none">
        <n-icon><ChecklistRtlSharp /></n-icon>
        <span class="title">
          {{ t('common.appfunc.thank_list') }}
        </span>
        <div class="card-title__actions">
          <a href="javascript:void(0);" @click="showRules">[{{ t('common.rule') }}]</a>
        </div>
      </div>
    </template>

    <div class="wrapper">
      <div v-if="sponsorLoadingStatus === 'loading'" class="flex items-center gap-1 mt-1.25 ml-[1.2em]">
        <n-spin size="small" style="text-indent: initial;" />
        <div>{{ t('common.loading') }}</div>
      </div>
      <n-alert
        v-else-if="sponsorLoadingStatus === 'error'"
        type="error"
        :title="t('common.load_failed')"
        class="alert-container"
      >
        <div>{{ sponsorLoadError }}</div>
        <a @click="loadSponsors">
          <n-icon :size="14"><RefreshOutlined /></n-icon>
          {{ t('common.retry') }}
        </a>
      </n-alert>

      <div
        v-else
        ref="silkStageRef"
        class="silk-stage"
        :class="[
          theme === 'light' ? 'is-light' : 'is-dark',
          { 'is-mobile': isMobile },
        ]"
        @click="handleStageClick"
        @wheel="handleWheel"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
      >
        <div class="silk-bg-layer" aria-hidden="true">
          <canvas ref="silkCanvasRef" class="silk-canvas" />
          <div class="silk-veil" />
        </div>

        <div class="pages-track" :class="{ 'on-page-2': currentPage === 2 }">
          <!-- 第 1 页：流光绸境横向循环赞助者墙 -->
          <section class="stage-page page-1" :aria-hidden="currentPage !== 1">
            <div class="marquee-viewport" :class="{ 'is-paused': isMarqueePaused }">
              <div class="marquee-rows-box">
                <div
                  v-for="row in marqueeRows"
                  :key="'row-' + row.id"
                  class="marquee-row"
                >
                  <div
                    class="marquee-track"
                    :class="{ 'has-active': activeSponsorIndex !== null }"
                    :style="{
                      '--marquee-duration': `${row.durationSec}s`,
                      '--marquee-delay': `${row.delaySec}s`,
                    }"
                  >
                    <div
                      v-for="halfIndex in 2"
                      :key="'half-' + halfIndex"
                      class="marquee-half"
                      :aria-hidden="halfIndex === 2 ? 'true' : undefined"
                    >
                      <button
                        v-for="cell in row.halfItems"
                        :key="`${cell.key}-h${halfIndex}`"
                        type="button"
                        class="sponsor-word"
                        :class="[
                          { 'is-active': activeSponsorIndex === cell.index },
                        ]"
                        :tabindex="halfIndex === 2 ? -1 : 0"
                        @mouseenter="handleSponsorEnter(cell.index, $event)"
                        @mouseleave="handleSponsorLeave(cell.index)"
                        @click="handleSponsorClick(cell.index, $event)"
                      >
                        <span class="sponsor-word-label">{{ cell.sponsor.name }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer class="stage-footer">
              <button
                v-if="matchedUserSponsor"
                type="button"
                class="scroll-icon-cue is-down"
                @click="goToPage(2)"
              >
                <span class="cue-chevron cue-chevron-1">
                  <n-icon :size="20"><KeyboardArrowDownRound /></n-icon>
                </span>
                <span class="cue-chevron cue-chevron-2">
                  <n-icon :size="20"><KeyboardArrowDownRound /></n-icon>
                </span>
              </button>
              <div v-else class="and-you-faint select-none">……And YOU!</div>
            </footer>
          </section>

          <!-- 第 2 页：已登记赞助者的专属致敬页 -->
          <section
            v-if="matchedUserSponsor"
            class="stage-page page-2"
            :aria-hidden="currentPage !== 2"
          >
            <header class="page-2-top">
              <button
                type="button"
                class="scroll-icon-cue is-up"
                @click="goToPage(1)"
              >
                <span class="cue-chevron cue-chevron-2">
                  <n-icon :size="20"><KeyboardArrowUpRound /></n-icon>
                </span>
                <span class="cue-chevron cue-chevron-1">
                  <n-icon :size="20"><KeyboardArrowUpRound /></n-icon>
                </span>
              </button>
            </header>

            <div class="dedication-center">
              <div class="dedication-prefix">……And YOU:</div>
              <div class="dedication-name">{{ matchedUserSponsor.name }}</div>
              <div class="dedication-meta">
                <span>{{ t('thank_list.last_donate') }}: {{ matchedUserSponsor.date }}</span>
                <div class="dedication-badges">
                  <n-tooltip
                    v-for="sponsoredGen in matchedUserSponsor.sponsored"
                    :key="'dedicate-gen-' + sponsoredGen"
                    :trigger="isMobile ? 'click' : 'hover'"
                  >
                    <template #trigger>
                      <span class="sponsor-gen" :style="getSponsorGenStyle(sponsoredGen)">
                        {{ getSponsorGenContent(sponsoredGen) }}
                      </span>
                    </template>
                    {{ t('thank_list.donate_gen', sponsoredGen) }}
                  </n-tooltip>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 悬停/点击详情浮动卡片 -->
        <Transition name="popover-fade">
          <div
            v-if="activeSponsor && currentPage === 1"
            ref="popoverRef"
            class="floating-popover"
            :class="{ 'is-pinned': pinnedIndex !== null }"
            :style="{
              left: `${popoverPos.left}px`,
              top: `${popoverPos.top}px`,
            }"
            role="dialog"
            @mouseenter="isPopoverHovered = true"
            @mouseleave="isPopoverHovered = false"
            @click.stop
          >
            <div class="pop-head">
              <span class="pop-name">{{ activeSponsor.name }}</span>
              <button
                type="button"
                class="pop-close-btn"
                :class="{ 'is-visible': pinnedIndex !== null }"
                :tabindex="pinnedIndex !== null ? 0 : -1"
                :aria-hidden="pinnedIndex === null ? 'true' : undefined"
                :aria-label="t('common.close')"
                @click="clearSelection"
              >
                <n-icon :size="15"><CloseRound /></n-icon>
              </button>
            </div>
            <div class="pop-date">
              {{ t('thank_list.last_donate') }}: {{ activeSponsor.date }}
            </div>
            <div v-if="activeSponsor.word" class="pop-word">
              “{{ activeSponsor.word }}”
            </div>
            <div class="pop-gens">
              <n-tooltip
                v-for="sponsoredGen in activeSponsor.sponsored"
                :key="'pop-gen-' + sponsoredGen"
                :trigger="isMobile ? 'click' : 'hover'"
              >
                <template #trigger>
                  <span class="pop-gen-chip" :style="getSponsorGenStyle(sponsoredGen)">
                    {{ getSponsorGenContent(sponsoredGen) }}
                  </span>
                </template>
                {{ t('thank_list.donate_gen', sponsoredGen) }}
              </n-tooltip>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </MyModal>
</template>

<style scoped>
.wrapper {
  height: 350px;

  .alert-container {
    margin: 5px 2em 0 1.2em;

    a {
      padding: 0;
      margin-left: 3px;
      display: flex;
      line-height: 1;
      cursor: pointer;
      width: fit-content;
      text-indent: initial;
    }
  }
}

.silk-stage {
  --silk-ink: #f6f1e9;
  --silk-muted: rgba(246, 241, 233, 0.58);
  --silk-faint: rgba(246, 241, 233, 0.3);
  --silk-amber: #e0ad62;
  --silk-line: rgba(246, 241, 233, 0.14);
  --silk-row-line: rgba(246, 241, 233, 0.06);
  --silk-popover-bg: rgba(34, 32, 34, 0.96);
  --silk-popover-border: rgba(224, 173, 98, 0.42);
  --silk-veil: radial-gradient(ellipse 46% 44% at 50% 50%, rgba(44, 44, 50, 0.14), transparent 100%);
  --silk-fallback: radial-gradient(ellipse 46% 44% at 50% 50%, rgba(224, 173, 98, 0.24), rgba(66, 54, 42, 0.35) 55%, transparent 100%);

  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--n-border-radius, 8px);
  background: transparent;
  color: var(--silk-ink);
  overflow: hidden;
  isolation: isolate;
  touch-action: pan-x;

  &.is-light {
    --silk-ink: #2b231b;
    --silk-muted: rgba(43, 35, 27, 0.6);
    --silk-faint: rgba(43, 35, 27, 0.34);
    --silk-amber: #9c641e;
    --silk-line: rgba(43, 35, 27, 0.11);
    --silk-row-line: rgba(43, 35, 27, 0.055);
    --silk-popover-bg: rgba(255, 253, 249, 0.97);
    --silk-popover-border: rgba(156, 100, 30, 0.38);
    --silk-veil: radial-gradient(ellipse 46% 44% at 50% 50%, rgba(255, 255, 255, 0.16), transparent 100%);
    --silk-fallback: radial-gradient(ellipse 46% 44% at 50% 50%, rgba(219, 164, 90, 0.22), rgba(242, 232, 216, 0.42) 55%, transparent 100%);
  }
}

.silk-bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--silk-fallback);
  /* 椭圆半径设为 48% 46%，确保四条边与四个角落全部 100% 透明融入外层弹窗背景色 */
  -webkit-mask-image: radial-gradient(ellipse 48% 46% at 50% 50%, #000 0%, rgba(0, 0, 0, 0.72) 44%, rgba(0, 0, 0, 0.22) 76%, transparent 100%);
  mask-image: radial-gradient(ellipse 48% 46% at 50% 50%, #000 0%, rgba(0, 0, 0, 0.72) 44%, rgba(0, 0, 0, 0.22) 76%, transparent 100%);
}

.silk-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.silk-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--silk-veil);
}

.pages-track {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 200%;
  transform: translate3d(0, 0, 0);
  transition: transform 0.78s cubic-bezier(0.22, 1, 0.36, 1);

  &.on-page-2 {
    transform: translate3d(0, -50%, 0);
  }
}

.stage-page {
  position: relative;
  width: 100%;
  height: 50%;
  display: flex;
  flex-direction: column;
}

/* 第 1 页：多行水平无限循环跑马灯 */
.marquee-viewport {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 10px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%);
  mask-image: linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%);

  &.is-paused .marquee-track {
    animation-play-state: paused;
  }
}

.marquee-rows-box {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}

.marquee-row {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: 3px 0;

  &::after {
    content: '';
    position: absolute;
    left: 10%;
    right: 10%;
    bottom: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--silk-row-line) 25%, var(--silk-row-line) 75%, transparent);
    pointer-events: none;
  }

  &:last-child::after {
    display: none;
  }
}

.marquee-track {
  display: flex;
  align-items: baseline;
  width: max-content;
  will-change: transform;
  animation: marquee-scroll var(--marquee-duration, 36s) linear infinite;
  animation-delay: var(--marquee-delay, 0s);

  &.has-active .sponsor-word:not(.is-active) {
    opacity: 0.36;
  }
}

.marquee-half {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-right: 8px;
  flex-shrink: 0;
}

.sponsor-word {
  position: relative;
  background: transparent;
  border: none;
  padding: 6px 11px;
  font-family: inherit;
  line-height: 1.35;
  color: var(--silk-ink);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
  font-size: var(--app-font-size-sm);

  .sponsor-word-label {
    position: relative;
    display: inline-block;
    transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -2px;
      height: 1.5px;
      background: var(--silk-amber);
      transform: scaleX(0);
      transform-origin: left center;
      transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
  }

  &:hover,
  &.is-active {
    opacity: 1 !important;
    color: var(--silk-amber);

    .sponsor-word-label {
      transform: translateY(-2px);

      &::after {
        transform: scaleX(1);
      }
    }
  }
}

@keyframes marquee-scroll {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(-50%, 0, 0);
  }
}

/* 底部区域：未登录淡色文案 / 已登记纯图标动效 */
.stage-footer {
  position: relative;
  flex-shrink: 0;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.and-you-faint {
  font-size: var(--app-font-size-xs);
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--silk-faint);
}

.scroll-icon-cue {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--silk-amber);
  cursor: pointer;
  padding: 0;
  border-radius: 999px;
  transition: background-color 0.2s ease, transform 0.2s ease;

  .cue-chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 11px;
    line-height: 1;
  }

  &.is-down .cue-chevron-1 {
    animation: cue-glide-down 1.8s ease-in-out infinite;
  }
  &.is-down .cue-chevron-2 {
    animation: cue-glide-down 1.8s ease-in-out infinite 0.26s;
  }
  &.is-up .cue-chevron-1 {
    animation: cue-glide-up 1.8s ease-in-out infinite;
  }
  &.is-up .cue-chevron-2 {
    animation: cue-glide-up 1.8s ease-in-out infinite 0.26s;
  }
}

@keyframes cue-glide-down {
  0%, 100% {
    transform: translateY(-2px);
    opacity: 0.35;
  }
  50% {
    transform: translateY(3px);
    opacity: 1;
  }
}

@keyframes cue-glide-up {
  0%, 100% {
    transform: translateY(2px);
    opacity: 0.35;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

/* 第 2 页：个人致谢展示 */
.page-2 {
  justify-content: space-between;
  padding: 10px 24px 24px;
}

.page-2-top {
  flex-shrink: 0;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dedication-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 16px 24px;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.16s,
    transform 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.16s;
}

.pages-track.on-page-2 .dedication-center {
  opacity: 1;
  transform: translateY(0);
}

.dedication-prefix {
  font-size: calc(var(--app-font-size) * 1.35);
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--silk-amber);
  margin-bottom: 10px;
}

.dedication-name {
  font-size: clamp(28px, 4.8vw, 44px);
  font-weight: 700;
  line-height: 1.2;
  color: var(--silk-ink);
  margin-bottom: 14px;
  overflow-wrap: anywhere;
}

.dedication-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: var(--app-font-size-sm);
  color: var(--silk-muted);
  font-variant-numeric: tabular-nums;
  margin-bottom: 10px;
}

.dedication-badges {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sponsor-gen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-font-size-2xs);
  min-width: 19px;
  height: 18px;
  padding: 0 4px;
  border-radius: 4px;
  color: #fff;
  background-color: var(--gen-bg-color);
  cursor: default;
  user-select: none;
}

/* 浮动详情气泡 */
.floating-popover {
  position: absolute;
  z-index: 15;
  width: min(310px, calc(100% - 24px));
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--silk-popover-bg);
  border: 1px solid var(--silk-popover-border);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.36);
  pointer-events: none;

  &.is-pinned {
    pointer-events: auto;
  }

  .pop-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 22px;
    margin-bottom: 4px;
  }

  .pop-name {
    font-size: var(--app-font-size);
    font-weight: 600;
    color: var(--silk-ink);
    overflow-wrap: anywhere;
  }

  .pop-close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: var(--silk-muted);
    cursor: pointer;
    flex-shrink: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.15s ease, color 0.15s ease, background-color 0.15s ease;

    &.is-visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    &:hover {
      color: var(--silk-ink);
      background: rgba(128, 128, 128, 0.15);
    }
  }

  .pop-date {
    font-size: var(--app-font-size-xs);
    color: var(--silk-amber);
    font-variant-numeric: tabular-nums;
    margin-bottom: 6px;
  }

  .pop-word {
    font-size: var(--app-font-size-sm);
    line-height: 1.55;
    color: var(--silk-ink);
    opacity: 0.9;
    overflow-wrap: anywhere;
  }

  .pop-gens {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }

  .pop-gen-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--app-font-size-2xs);
    min-width: 19px;
    height: 18px;
    padding: 0 4px;
    border-radius: 4px;
    color: #fff;
    background-color: var(--gen-bg-color);
    cursor: pointer;
    user-select: none;
  }
}

.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* 移动端与减动效适配 */
@media screen and (max-width: 767px) {
  .wrapper {
    height: min(350px, 64vh);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
  .marquee-viewport {
    overflow-x: auto;
  }
  .scroll-icon-cue .cue-chevron {
    animation: none !important;
  }
  .pages-track,
  .dedication-center,
  .sponsor-word {
    transition: none;
  }
}
</style>
