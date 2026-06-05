<script setup lang="ts">
import {
  ChecklistRtlSharp,
  RefreshOutlined,
} from '@vicons/material'
import { useStore } from '@/store'
import { useDialog } from '@/tools/dialog'
import type { MainCacheModel } from '@/models/cache-main'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const mainCache = inject<Ref<MainCacheModel>>('mainCache')!

const store = useStore()
const { alertInfo } = useDialog(t)

const showModal = defineModel<boolean>('show', { required: true })

interface SponsorInfo {
  name: string;
  nbbid?: number;
  date: string;
  word: string;
  sponsored: number[];
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
    let url = 'https://strapi.nbb.fan/api/hq-helper-configs/vif4s1czgkysocpg1bnoa8vi'
    url += `?t=${new Date().getTime()}&fields[0]=content`
    if (window.electronAPI?.httpGet) {
      loadSponsorsResponse = await window.electronAPI.httpGet(url)
    } else {
      loadSponsorsResponse = await fetch(url)
        .then(response => response.text())
    }
    const sponsorsContent = JSON.parse(loadSponsorsResponse) as {
      data: {
        content: {
          sponsors: SponsorInfo[]
        }
      }
    }
    sponsors.value = sponsorsContent.data.content.sponsors
    mainCache.value.sponsor_nbbids = sponsors.value.flatMap(s => s.nbbid ? [s.nbbid] : [])
    store.setMainCache(mainCache.value)
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
        <div class="card-title-actions">
          <a href="javascript:void(0);" @click="showRules">[{{ t('common.rule') }}]</a>
        </div>
      </div>
    </template>

    <div class="wrapper">
      <div v-if="sponsorLoadingStatus === 'loading'" class="spin-container">
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
      <div v-else class="table-container">
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
  .table-container {
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
}

/* Mobile */
@media screen and (max-width: 767px) {
  .wrapper {
    .table-container {
      table {
        th:first-child, td:first-child,
        th:nth-child(3), td:nth-child(3) {
          width: 50%;
        }
        th:nth-child(2), td:nth-child(2) {
          display: none;
        }
      }
    }
  }
}
</style>