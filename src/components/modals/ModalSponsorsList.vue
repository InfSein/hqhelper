<script setup lang="ts">
import {
  ChecklistRtlSharp,
  RefreshOutlined,
} from '@vicons/material'
import { useStore } from '@/store'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'

const store = useStore()
const { t } = useLocale()
const { alertInfo } = useDialog()
const { isMobile } = useResponsive()

const showModal = defineModel<boolean>('show', { required: true })

interface SponsorInfo {
  /** 赞助者名称 */
  name: string;
  /** 赞助者关联的系统id */
  nbbid?: number;
  /** 上次赞助时间 */
  date: string;
  /** 上次赞助留言，没有返回空字符串即可 */
  word: string;
  sponsored: number[];
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

const sponsorLoadingStatus = ref<"finished" | "loading" | "error">('loading')
const sponsorLoadError = ref('')
const sponsors = ref<SponsorInfo[]>([])

const loadSponsors = async () => {
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
    store.mainCache.sponsor_nbbids = sponsors.value.flatMap(s => s.nbbid ? [s.nbbid] : [])
    store.setMainCache(store.mainCache)
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

const getSponsorGenStyle = (gen: number) => {
  const genColors = ['#DC143C', '#FF4500', '#F4A460', '#2E8B57', '#008080', '#4169E1', '#800080']
  return [
    '--gen-bg-color: ' + (genColors[gen] ?? 'black'),
  ]
}
const getSponsorGenContent = (gen: number) => {
  const genContent = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  return genContent[gen - 1] ?? '?' // 12年，够用到我弃坑了
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
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
      <div v-if="sponsorLoadingStatus === 'loading'" class="flex items-center gap-1 mt-[5px] ml-[1.2em]">
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
      <div v-else class="content-container" :class="{ 'is-mobile': isMobile }">
        <!-- Desktop View: Table Layout -->
        <div class="desktop-table-wrapper">
          <n-table :single-line="false">
            <thead>
              <tr>
                <th>{{ t('thank_list.donater') }}</th>
                <th>{{ t('thank_list.last_donate') }}</th>
                <th>{{ t('thank_list.donate_comment') }}</th>
              </tr>
            </thead>
          </n-table>
          <n-scrollbar trigger="none" :style="{ height: '400px', 'margin-top': '-2px' }">
            <n-table class="table" size="small" :single-line="false">
              <tbody>
                <tr v-for="(sponsor, index) in sponsors" :key="'sponsor-' + index">
                  <td>
                    <div class="sponsor-cell">
                      <span class="sponsor-name">{{ sponsor.name }}</span>
                      <n-tooltip
                        v-for="sponsoredGen in sponsor.sponsored"
                        :key="'sponsor-' + sponsoredGen + '-badge'"
                        :trigger="isMobile ? 'click' : 'hover'"
                      >
                        <template #trigger>
                          <div class="sponsor-gen" :style="getSponsorGenStyle(sponsoredGen)">
                            {{ getSponsorGenContent(sponsoredGen) }}
                          </div>
                        </template>
                        {{ t('thank_list.donate_gen', sponsoredGen) }}
                      </n-tooltip>
                    </div>
                  </td>
                  <td>
                    {{ sponsor.date }}
                  </td>
                  <td>
                    {{ sponsor.word }}
                  </td>
                </tr>
              </tbody>
            </n-table>
          </n-scrollbar>
        </div>

        <!-- Mobile View: Card Layout -->
        <div class="mobile-cards-wrapper">
          <n-scrollbar trigger="none" :style="{ height: '440px' }">
            <div class="cards-list">
              <n-card
                v-for="(sponsor, index) in sponsors"
                :key="'sponsor-card-' + index"
                size="small"
                embedded
                class="sponsor-card"
                :content-style="{ padding: '6px 10px' }"
              >
                <div class="card-header-row">
                  <div class="sponsor-info-left">
                    <span class="sponsor-name">{{ sponsor.name }}</span>
                    <div class="sponsor-badges">
                      <n-tooltip
                        v-for="sponsoredGen in sponsor.sponsored"
                        :key="'sponsor-card-' + sponsoredGen + '-badge'"
                        trigger="click"
                      >
                        <template #trigger>
                          <div class="sponsor-gen" :style="getSponsorGenStyle(sponsoredGen)">
                            {{ getSponsorGenContent(sponsoredGen) }}
                          </div>
                        </template>
                        {{ t('thank_list.donate_gen', sponsoredGen) }}
                      </n-tooltip>
                    </div>
                  </div>
                  <div class="sponsor-date">
                    {{ sponsor.date }}
                  </div>
                </div>
                <div class="card-word-row">
                  <span class="word-label">赞助留言：</span>
                  <span class="word-content" :class="{ 'is-empty': !sponsor.word }">
                    {{ sponsor.word || '无' }}
                  </span>
                </div>
              </n-card>
            </div>
          </n-scrollbar>
        </div>
      </div>
    </div>
  </MyModal>
</template>

<style scoped>
.wrapper {
  height: 450px;

  .spin-container {
    display: flex;
    align-items: center;
    gap: 3px;
    margin: 5px 0 0 1.2em;
    text-indent: initial;
  }
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

  .content-container {
    height: 100%;

    .desktop-table-wrapper {
      display: block;

      table {
        width: 100%;

        th {
          font-weight: bold;
        }
        th:first-child, td:first-child,
        th:nth-child(3), td:nth-child(3) {
          width: 40%;
        }
        th:nth-child(2), td:nth-child(2) {
          width: 20%;
        }
        th:nth-child(2), td:nth-child(2),
        th:nth-child(3), td:nth-child(3) {
          text-align: center;
        }
        .sponsor-cell {
          padding-left: 6px;

          .sponsor-name {
            margin-right: 2px;
          }
          .sponsor-gen {
            display: inline-block;
            margin-left: 2px;
            font-size: 12px;
            width: 19.2px;
            text-align: center;
            border-radius: 4px;
            color: white;
            background-color: var(--gen-bg-color);
            transition: all 0.2s ease-in-out;
            cursor: pointer;
            user-select: none;
            &:hover {
              transform: scale(1.2);
            }
            &:active {
              transform: scale(1.1);
            }
          }
        }
      }
    }

    .mobile-cards-wrapper {
      display: none;

      .cards-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-right: 4px;
      }

      .sponsor-card {
        border-radius: 6px;
        transition: border-color 0.2s ease-in-out;

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          .sponsor-info-left {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;

            .sponsor-name {
              font-weight: 600;
              font-size: 13.5px;
              color: var(--n-text-color);
            }

            .sponsor-badges {
              display: inline-flex;
              align-items: center;
              gap: 3px;
            }

            .sponsor-gen {
              display: inline-block;
              font-size: 11px;
              height: 17px;
              width: 17px;
              text-align: center;
              border-radius: 4px;
              color: white;
              background-color: var(--gen-bg-color);
              transition: all 0.2s ease-in-out;
              cursor: pointer;
              user-select: none;
              &:hover {
                transform: scale(1.15);
              }
              &:active {
                transform: scale(1.05);
              }
            }
          }

          .sponsor-date {
            font-size: 12px;
            opacity: 0.75;
            white-space: nowrap;
            flex-shrink: 0;
          }
        }

        .card-word-row {
          margin-top: 4px;
          font-size: 12.5px;
          line-height: 1.4;
          word-break: break-word;
          color: var(--n-text-color);

          .word-label {
            color: var(--n-text-color-3, rgba(127, 127, 127, 0.85));
          }

          .word-content.is-empty {
            opacity: 0.6;
          }
        }
      }
    }

    &.is-mobile {
      .desktop-table-wrapper {
        display: none;
      }
      .mobile-cards-wrapper {
        display: block;
      }
    }
  }
}

/* Mobile media query */
@media screen and (max-width: 767px) {
  .wrapper {
    .content-container {
      .desktop-table-wrapper {
        display: none;
      }
      .mobile-cards-wrapper {
        display: block;
      }
    }
  }
}
</style>