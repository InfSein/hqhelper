<script setup lang="ts">
import {
  EventNoteFilled,
  CopyAllOutlined,
  HistoryOutlined, StickyNote2Outlined,
} from '@vicons/material'
import { getChangelogs, type PatchChangeGroup } from '@/data/change-logs'
import AppStatus from '@/constants/app'
import { useStore } from '@/store'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const devMode = import.meta.env.DEV

const store = useStore()

const showModal = defineModel<boolean>('show', { required: true })

const showHistory = ref(false)

const wrapperStyle = computed(() => {
  return {
    height: isMobile.value ? '480px' : '450px'
  }
})
const latestPatchNote = computed(() => {
  return getChangelogs(store.userConfig.language_ui, t)[0]
})
const historyChangelogs = computed(() => {
  return getChangelogs(store.userConfig.language_ui, t).slice(1)
})
const latestPatchNoteNumWidth = computed(() => {
  const maxLengthOfNote = latestPatchNote.value.changes.map(change => change.changes.length).reduce((a, b) => Math.max(a, b), 0)
  return maxLengthOfNote > 9 ? '24px' : '16px'
})
const latestPatchGameVerText = computed(() => {
  if (AppStatus.SupportedGameVersion.CN === AppStatus.SupportedGameVersion.GLOBAL) {
    return t('common.game_data_version', AppStatus.SupportedGameVersion.CN)
  } else {
    return t('common.chs_and_global_data_version', {
      cnver: AppStatus.SupportedGameVersion.CN,
      glbver: AppStatus.SupportedGameVersion.GLOBAL,
    })
  }
})

const getChanges = (change: PatchChangeGroup) => {
  return change.changes.filter(str => str !== '')
}

const handleCopyLatestPatchNode = () => {
  const br = '\r\n'
  let content = `我们刚刚发布了版本${latestPatchNote.value.version}。${br}${br}`
  latestPatchNote.value.changes.forEach(change => {
    content += `${change.name}：${br}`
    change.changes.forEach((str, strIndex) => {
      const cleanedStr = str.replace('<br>', br).replace(/<[^>]+>/g, '')
      content += `${strIndex+1}. ${cleanedStr}${br}`
    })
    content += br
  })
  content += `更新说明：
请在主界面左上方“HqHelper”的右侧检查您所在的版本。
刷新网站即可更新。如果刷新之后也没有更新到最新版本，请考虑使用Ctrl+F5等方法清除页面缓存。
如果您正在使用客户端，请点击左上方菜单“设置与更新”->“检查更新”来更新HqHelper版本。如果更新缓慢或是长时间卡在同一阶段，请重启程序并调整“加速服务”中的设置。`
  navigator.clipboard.writeText(content)
}
const handleCopyLatestPatchNodeMarkdown = () => {
  const br = '\r\n'
  let content = ``
  content += `## ${latestPatchNote.value.version} (${latestPatchNote.value.date})${br}${br}`
  latestPatchNote.value.changes.forEach(change => {
    content += `### ${change.name}${br}`
    change.changes.forEach((str, strIndex) => {
      let cleanedStr = str.replace('<br>', br).replace(/<[^>]+>/g, '')
      cleanedStr = cleanedStr.endsWith('\r\n') ? cleanedStr.slice(0, -2) : cleanedStr
      console.log({cleanedStr})
      content += `${strIndex+1}. ${cleanedStr}${br}`
    })
    content += br
  })
  navigator.clipboard.writeText(content)
}
/*
const handleCopyAllPatchNodeMarkdown = () => {
  const br = '\r\n'
  let content = `# HqHelper CHANGELOG${br}${br}`
  const allNote = getChangelogs(store.userConfig.language_ui, t)
  allNote.forEach(note => {
    content += `## ${note.version} (${note.date})${br}${br}`
    note.changes.forEach(change => {
      content += `### ${change.name}${br}`
      change.changes.forEach((str, strIndex) => {
        const cleanedStr = str.replace('<br>', br).replace(/<[^>]+>/g, '').replace('\r\n\r\n', br)
        content += `${strIndex+1}. ${cleanedStr}${br}`
      })
      content += br
    })
  })
  navigator.clipboard.writeText(content)
}
*/
const handleSwitchShowHistory = () => {
  showHistory.value = !showHistory.value
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="EventNoteFilled"
    :title="t('common.appfunc.changelog')"
    max-width="650px"
    :height="isMobile ? '650px' : '620px'"
  >
    <div v-if="!showHistory" class="wrapper " :style="wrapperStyle">
      <n-card embedded size="small" class="h-full" content-style="height: 100%;">
        <div class="wrapper-latest-update">
          <n-h1 prefix="bar" class="latest-update-baseinfo">
            <n-text>v{{ latestPatchNote.version }}</n-text>
            <n-text depth="3" class="date">{{ latestPatchNote.date }}</n-text>
            <n-text v-if="!isMobile" depth="3" class="data-version">
              ({{ latestPatchGameVerText }})
            </n-text>
          </n-h1>
          <n-divider style="margin: 8px 0 12px;" />
          <div class="latest-update-content">
            <div
              v-for="(change, changeIndex) in latestPatchNote.changes"
              :key="'latest-' + changeIndex"
              class="item"
            >
              <div class="change-group-title">{{ change.name }}</div>
              <div class="change-group-content">
                <div
                  v-for="(changeContent, changeContentIndex) in getChanges(change)"
                  :key="'latest-' + changeIndex + '-' + changeContentIndex"
                  class="content-line"
                  :style="{
                    '--line-num-width': latestPatchNoteNumWidth
                  }"
                >
                  <span class="line-index">
                    {{ (changeContentIndex + 1) + '. ' }}
                  </span>
                  <span v-html="changeContent"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>
    <div v-else class="wrapper flex" :style="wrapperStyle">
      <n-card
        v-for="(patchlog, logIndex) in historyChangelogs"
        :key="patchlog.version"
        embedded
        size="small"
      >
        <n-collapse :default-expanded-names="logIndex ? [] : ['1']">
          <n-collapse-item name="1" :title="patchlog.version">
            <template #header-extra>
              {{ t('changelog.text.release_date_with_val', patchlog.date) }}
            </template>
            <div class="patchnote-container">
              <div
                v-for="(change, changeIndex) in patchlog.changes"
                :key="patchlog.version + '-' + changeIndex"
                class="item"
              >
                <div class="change-group-title">{{ change.name }}</div>
                <div class="change-group-content">
                  <div
                    v-for="(changeContent, changeContentIndex) in getChanges(change)"
                    :key="patchlog.version + '-' + changeIndex + '-' + changeContentIndex"
                  >
                    <span>
                      {{ getChanges(change).length > 1 ? ((changeContentIndex + 1) + '. ') : '' }}
                    </span>
                    <span v-html="changeContent"></span>
                  </div>
                </div>
              </div>
            </div>
          </n-collapse-item>
        </n-collapse>
      </n-card>
    </div>

    <template #action>
      <div class="modal-submit-container">
        <n-button v-if="!showHistory && !isMobile && devMode" type="info" @click="handleCopyLatestPatchNode">
          <template #icon>
            <n-icon :component="CopyAllOutlined" />
          </template>
          复制
        </n-button>
        <n-button v-if="!showHistory && !isMobile && devMode" type="info" ghost @click="handleCopyLatestPatchNodeMarkdown">
          <template #icon>
            <n-icon :component="CopyAllOutlined" />
          </template>
          复制(Markdown)
        </n-button>
        <!-- <n-button v-if="!showHistory && !isMobile && devMode" type="warning" ghost @click="handleCopyAllPatchNodeMarkdown">
          <template #icon>
            <n-icon :component="CopyAllOutlined" />
          </template>
          复制全部日志(Markdown)
        </n-button> -->
        <n-button type="primary" @click="handleSwitchShowHistory">
          <template #icon>
            <n-icon :component="showHistory ? StickyNote2Outlined : HistoryOutlined" />
          </template>
          {{ showHistory ? t('changelog.text.view_latest') : t('changelog.text.view_history') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
:deep(.n-collapse-item__header-main) {
  font-size: 16px;
  font-weight: bold !important;
}
:deep(.n-collapse-item__content-inner) {
  padding-top: 0 !important;
  padding: 10px 10px 0 15px !important;
}
:deep(.n-card__content) {
  padding: 0 var(--n-padding-left) var(--n-padding-bottom) var(--n-padding-left);
}
/* All */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  user-select: text;
  overflow-y: auto;
}
.wrapper-latest-update {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .latest-update-baseinfo {
    line-height: 1.2;
    margin-bottom: 0;

    .date {
      padding-left: 8px;
      font-size: 14px;
    }
    .data-version {
      font-size: 14px;
      position: absolute;
      right: 0; bottom: 3px;
    }
  }
  .latest-update-content {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    overflow-y: auto;

    .item {
      margin-left: 1em;

      .change-group-title {
        font-weight: bold;
      }
      .change-group-content {
        margin-left: 0.5em;

        .content-line {
          display: grid;
          grid-template-columns: var(--line-num-width) 1fr;
          column-gap: 5px;

          .line-index {
            user-select: none;
            text-align: right;
          }
        }
      }
    }
  }
}
.patchnote-container {
  display: flex;
  flex-direction: column;
  gap: 3px;
  .item .change-group-title {
    font-weight: bold;
  }
}

/* Desktop */
@media screen and (min-width: 768px) {
  .patchnote-container .item {
    display: grid;
    gap: 5px 10px;
    grid-template-columns: 75px 1fr;

    .change-group-title {
      user-select: none;
    }
    .change-group-content {
      border-bottom: 1px solid;
    }
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
}
</style>