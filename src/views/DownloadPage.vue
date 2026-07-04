<script setup lang="ts">
import {
  DesktopWindowsRound,
  AppleRound,
  WarningRound,
  NextPlanFilled,
  AndroidRound,
  ChevronRightRound,
  FileDownloadRound,
  InfoRound
} from '@vicons/material'
import type { AppVersionJson } from '@/models'
import type { UserConfigModel } from '@/models/config-user'
import type { FuncConfigModel } from '@/models/config-func'
import { checkAppUpdates } from '@/tools'
import useConfig from '@/tools/use-config'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile')!
const userConfig = inject<Ref<UserConfigModel>>('userConfig')!
const funcConfig = inject<Ref<FuncConfigModel>>('funcConfig')!

const NAIVE_UI_MESSAGE = useMessage()
const { uiLanguage } = useConfig(userConfig, funcConfig)

const loading = ref(false)
const appVersionInfo = ref<AppVersionJson | undefined>(undefined)

onMounted(async () => {
  loading.value = true
  const checkUpdateResponse = await checkAppUpdates()
  if (checkUpdateResponse.success) {
    appVersionInfo.value = checkUpdateResponse.data!
  } else {
    NAIVE_UI_MESSAGE.error(checkUpdateResponse.message)
  }
  loading.value = false
})

const platformCards = computed(() => [
  {
    key: 'windows',
    title: 'Windows',
    icon: DesktopWindowsRound,
    version: appVersionInfo.value?.electron,
    btnData: winAppBtns.value,
    extra: t('download_page.text.text_10'),
  },
  {
    key: 'mac',
    title: 'macOS',
    icon: AppleRound,
    version: appVersionInfo.value?.electron,
    btnData: macAppBtns.value,
    extra: t('download_page.text.text_12'),
  },
  {
    key: 'android',
    title: 'Android',
    icon: AndroidRound,
    version: appVersionInfo.value?.android,
    btnData: androidAppBtns.value,
  }
])

interface DownloadBtn {
  text: string
  link: string
}

const getPlatformBtns = (platform: "win" | "mac" | "android") => {
  const vi = appVersionInfo.value
  if (!vi) return undefined
  let dlink = '', subLinks: string[] = []
  if (platform === 'android') {
    dlink = vi.dlink_android.replace('~VERSION', vi.android)
    subLinks = vi.client_info.android_cn_sub_links
  } else if (platform === 'mac') {
    dlink = vi.dlink_electron_mac.replace('~VERSION', vi.electron)
    subLinks = vi.client_info.mac_cn_sub_links
  } else { // win
    dlink = vi.dlink_electron.replace('~VERSION', vi.electron)
    subLinks = vi.client_info.cn_sub_links
  }

  let index = 1
  const primaryBtns: DownloadBtn[] = []
  const subBtns: DownloadBtn[] = []

  if (uiLanguage.value === 'zh') {
    primaryBtns.push({
      text: t('download_page.link.cn_with_index', index++),
      link: dlink.replace('~PROXY', vi.client_info.recomm_proxy),
    })
    subLinks.forEach((sublink) => {
      subBtns.push({
        text: t('download_page.link.cn_with_index', index++),
        link: sublink,
      })
    })
    subBtns.push({
      text: t('download_page.link.global'),
      link: dlink.replace('~PROXY', ''),
    })
  } else {
    primaryBtns.push({
      text: t('download_page.link.global'),
      link: dlink.replace('~PROXY', ''),
    })
  }
  return { primaryBtns, subBtns }
}

const winAppBtns = computed(() => getPlatformBtns('win'))
const macAppBtns = computed(() => getPlatformBtns('mac'))
const androidAppBtns = computed(() => getPlatformBtns('android'))

const handleDownloadBtnClick = (link: string) => {
  window.open(link, '_blank')
}
</script>

<template>
  <div class="download-page__wrapper">
    <div class="download-page__root">
      <!-- Hero Section -->
      <div class="hero-section">
        <h1 class="hero-title">
          <span class="gradient-text">
            {{ t('download_page.text.text_11', 'HqHelper') }}
          </span>
        </h1>
        <p class="hero-subtitle" v-html="t('download_page.text.text_1') + '<br>' + t('download_page.text.text_2')" />
      </div>

      <!-- Main Download Grid -->
      <div class="download-grid">
        <div 
          v-for="card in platformCards" 
          :key="card.key"
          class="platform-card glass-card"
        >
          <div class="card-header">
            <n-icon :size="48" :component="card.icon" class="platform-icon" />
            <div class="platform-info">
              <h2 class="platform-name">{{ card.title }}</h2>
              <div v-if="loading" class="version-shimmer" />
              <template v-else>
                <span class="version-badge">{{ card.version }}</span>
                <n-popover v-if="card.key === 'mac'" :trigger="isMobile ? 'click' : 'hover'" placement="bottom" style="max-width: 350px;">
                  <template #trigger>
                    <span class="warning-badge">
                      <n-icon :size="16" :component="WarningRound" style="vertical-align: text-bottom;" />
                    </span>
                  </template>
                  <div>
                    <p>{{ t('download_page.text.text_14') }}</p>
                    <p>{{ t('download_page.text.text_15') }}</p>
                    <p>
                      {{ t('common.please_refer_to') }} 
                      <a target="_blank" href="https://zhuanlan.zhihu.com/p/135948430">
                        https://zhuanlan.zhihu.com/p/135948430
                      </a>
                    </p>
                  </div>
                </n-popover>
              </template>
            </div>
          </div>

          <div class="card-body">
            <div class="download-btn-group">
              <n-button
                v-for="(btn, idx) in (card.btnData?.primaryBtns ?? [])"
                :key="idx"
                block
                type="primary"
                class="download-btn"
                @click="handleDownloadBtnClick(btn.link)"
              >
                <template #icon>
                  <n-icon :component="FileDownloadRound" />
                </template>
                {{ btn.text }}
              </n-button>
            </div>
            <div v-if="card.btnData?.subBtns?.length" class="download-btn-sub-group">
              <n-button
                v-for="(btn, idx) in card.btnData.subBtns"
                :key="idx"
                text
                @click="handleDownloadBtnClick(btn.link)"
              >
                {{ btn.text }}
              </n-button>
            </div>
            <p class="platform-extra">{{ card.extra }}</p>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="features-section glass-card">
        <div class="feature-header">
          <n-icon :size="24" :component="InfoRound" color="var(--color-primary)" />
          <h3>{{ t('download_page.text.text_3') }}</h3>
        </div>
        <ul class="feature-list">
          <li>
            <n-icon :component="ChevronRightRound" />
            {{ t('download_page.text.text_4') }}
          </li>
          <li>
            <n-icon :component="ChevronRightRound" />
            {{ t('download_page.text.text_5') }}
          </li>
          <li>
            <n-icon :component="ChevronRightRound" />
            {{ t('download_page.text.text_16') }}
          </li>
        </ul>
      </div>

      <!-- Special Notices & Other Platforms -->
      <div class="bottom-sections">
        <div class="info-card glass-card">
          <div class="feature-header">
            <n-icon :size="24" :component="InfoRound" color="var(--color-info)" />
            <h3>{{ t('common.special_notice') }}</h3>
          </div>
          <p class="compact-text">{{ t('download_page.text.text_6') }}</p>
          <p class="compact-text">{{ t('download_page.text.text_7') }}</p>
        </div>

        <div class="mobile-platforms glass-card">
          <div class="feature-header">
            <n-icon :size="24" :component="NextPlanFilled" />
            <h3>{{ t('common.future_plan') }}</h3>
          </div>
          <div class="mobile-grid">
            <div class="mobile-item">
              <n-icon :component="AppleRound" :size="20" />
              <span>iOS: {{ t('common.not_planned') }}</span>
            </div>
            <div class="mobile-item" v-show="false">
              <n-icon :component="AndroidRound" :size="20" />
              <span>Android: {{ t('common.developing') }}</span>
            </div>
          </div>
        </div>
      </div>

      <n-back-top />
    </div>

      <!-- Background Decorative Elements -->
      <div class="bg-glows">
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
        <div class="glow glow-3"></div>
      </div>
  </div>
</template>

<style scoped>
.download-page__wrapper {
  position: relative;
  overflow-x: clip; /* Prevent horizontal scroll from glows */

  .download-page__root {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 72px;
    min-height: 100%;
  }

  /* Hero Section */
  .hero-section {
    text-align: center;
    margin-bottom: 24px;
    animation: fadeInDown 0.8s ease-out;

    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 12px;
      line-height: 1.1;

      .gradient-text {
        font-weight: bold;
        background: linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: var(--color-text-sub);
      line-height: 1.6;
    }
  }

  /* Grid & Cards */
  .download-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 20px;

    .platform-card {
      &:hover {
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        border-color: var(--color-primary);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;

        .platform-icon {
          color: var(--color-primary);
          filter: drop-shadow(0 4px 8px rgba(24, 160, 88, 0.3));
        }

        .platform-info {
          .platform-name {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
          }

          .version-badge, .warning-badge {
            display: inline-block;
            font-size: 0.85rem;
            padding: 2px 10px;
            background: rgba(24, 160, 88, 0.15);
            color: var(--color-primary);
            border-radius: 12px;
            font-weight: 600;
            margin-top: 4px;
          }

          .warning-badge {
            background: rgba(247, 181, 0, 0.15);
            color: var(--color-warning);
            margin-left: 4px;
          }

          .version-shimmer {
            width: 60px;
            height: 20px;
            background: var(--color-background-hover);
            border-radius: 10px;
            animation: pulse 1.5s infinite;
          }
        }
      }

      .card-body {
        .download-btn-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;

          & > button {
            width: 80%;
            height: 44px;
            font-weight: 600;
            border-radius: 12px;
          }
        }

        .download-btn-sub-group {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 12px;

          & > button:not(:first-child)::before {
            content: '/';
            width: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--color-text-sub);
          }
        }

        .platform-extra {
          margin-top: 16px;
          font-size: 0.85rem;
          color: var(--color-text-sub);
          text-align: center;
        }
      }
    }
  }

  .glass-card {
    background: var(--glasscard-bg);
    backdrop-filter: blur(var(--glasscard-blur));
    -webkit-backdrop-filter: blur(var(--glasscard-blur));
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  /* Features & Info */
  .features-section, .info-card, .mobile-platforms {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-card {
    gap: 4px;
    padding: 24px 36px;
    .feature-header {
      margin-bottom: 12px;
    }
  }

  .feature-header {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
  }

  .feature-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: var(--color-text);
      line-height: 1.4;

      .n-icon {
        color: var(--color-primary);
        margin-top: 2px;
      }
    }
  }

  .bottom-sections {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 20px;

    .compact-text {
      font-size: 0.9rem;
      color: var(--color-text-sub);
      margin: 0;
    }

    .mobile-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .mobile-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        padding: 10px 16px;
        background: var(--color-background-hover);
        border-radius: 12px;
      }
    }
  }

  .mac-alert {
    margin-top: 12px;
    font-size: 0.9rem;
  }

  .zhihu-link {
    display: inline-block;
    margin-top: 8px;
    color: var(--color-info);
    padding: 0;

    &:hover {
      text-decoration: underline;
      background: transparent;
    }
  }

  .no-border {
    border: none !important;
  }

  /* Background Glows */
  .bg-glows {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;

    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
      transition: all 0.5s ease;

      .theme-dark & {
        opacity: 0.25;
      }
    }

    .glow-1 {
      width: 400px;
      height: 400px;
      top: -100px;
      right: -100px;
      background: var(--color-primary);
    }

    .glow-2 {
      width: 350px;
      height: 350px;
      top: 45%;
      left: -150px;
      background: var(--color-info);
    }
  }
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .download-page__wrapper {
    .download-page__root {
      .hero-section {
        padding: 0 16px;
        .hero-title {
          font-size: 2.2rem;
        }
      }
      .download-grid {
        grid-template-columns: 1fr;
      }
      .bottom-sections {
        grid-template-columns: 1fr;
      }
    }

    .bg-glows .glow {
      filter: blur(50px);
      width: 250px;
      height: 250px;
    }
  }
}
</style>
