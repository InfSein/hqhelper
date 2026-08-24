<script setup lang="ts">
// todo 记得处理兼容性问题

import {
  ChecklistRtlOutlined,
  CloudDownloadRound,
  CloudOutlined,
  CloudSyncOutlined,
  CloudUploadRound,
} from '@vicons/material'
import { useStore } from '@/store'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/composables/useLocale'
import { useNbbCloud } from '@/composables/useNbbCloud'
import { useResponsive } from '@/composables/useResponsive'
import { deepCopy } from '@/tools'
import { fixFuncConfig } from '@/types/config/func'
import { fixUserConfig } from '@/types/config/user'
import { HqList, type NbbResponse } from '@/types/api/nbb-cloud'
import { fixWorkState as fixCsHelperWorkState } from '@/types/workstate/cshelper'
import { fixWorkState as fixWorkflowWorkState } from '@/types/workstate/workflow'
import { fixWorkState as fixFashionclothWorkState } from '@/types/workstate/fchelper'
import { fixWorkState as fixMacromanageWorkState } from '@/types/workstate/macromanage'

const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()
const NAIVE_UI_MESSAGE = useMessage()
const { alertInfo, alertError, confirm } = useDialog()
const {
  getListBatch, addList, editList,
  resolveListTitle,
} = useNbbCloud()

const showModal = defineModel<boolean>('show', { required: true })

const cloudLists = ref<Record<HqList, CloudList>>()
const syncRange = ref<Record<HqList, boolean>>(
  Object.values(HqList)
    .filter((v): v is HqList => typeof v === 'number')
    .reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<HqList, boolean>)
)
const loading = ref(false)
const syncing = ref(false)

const onLoad = () => {
  loadLists()
}

interface CloudList {
  load_succeed: boolean
  last_update: number
  upload_version: string
  id: number
  content: string
}

const loadLists = async () => {
  loading.value = true

  // 从远程拉取数据
  const clists = {} as Record<HqList, CloudList>
  const listTypes = Object.values(HqList).filter((v): v is HqList => typeof v === 'number')
  const response = await getListBatch(listTypes)
  const load_succeed = !response.errno
  for (const tp of listTypes) {
    let last_update = 0, upload_version = '', id = 0, content = ''
    if (load_succeed) {
      if (response.data[tp]) {
        const data = response.data[tp]
        const { uploadVersion, uploadTime } = resolveListTitle(data.desc)
        last_update = uploadTime
        upload_version = uploadVersion
        id = data.id
        content = data.content
      }
    }
    clists[tp] = {
      load_succeed, last_update, upload_version, id, content,
    }
  }
  cloudLists.value = clists

  // 设置默认同步范围
  if (store.cloudConfig.nbb_sync_targets === 'all') {
    for (const listtype of listTypes) {
      syncRange.value[listtype] = true
    }
  } else {
    for (const listtype of listTypes) {
      syncRange.value[listtype] = store.cloudConfig.nbb_sync_targets.includes(listtype)
    }
  }

  loading.value = false
}

const syncRangeGroups = computed(() => {
  return [
    {
      key: 'preferences',
      title: t('common.appfunc.user_preference'),
      children: [
        {
          value: HqList.ConfigBackupUserConfig,
          label: t('common.appsetting.basic_setting'),
        },
        {
          value: HqList.ConfigBackupFuncConfig,
          label: t('common.appfunc.func_setting'),
        },
        {
          value: HqList.DataBackupInventory,
          label: t('common.appfunc.ingame_inventory'),
        },
      ]
    },
    {
      key: 'workstates',
      title: t('common.work_state'),
      children: [
        {
          value: HqList.WorkstateBackupMain,
          label: t('common.main_ui'),
        },
        {
          value: HqList.WorkstateBackupGatherClock,
          label: t('common.appfunc.gather_clock'),
        },
        {
          value: HqList.WorkstateBackupFtHelper,
          label: t('common.appfunc.fthelper'),
        },
        {
          value: HqList.WorkstateBackupCsHelper,
          label: t('common.appfunc.cshelper'),
        },
        {
          value: HqList.WorkstateBackupFashioncloth,
          label: t('common.appfunc.fchelper'),
        },
        {
          value: HqList.WorkstateBackupWorkflow,
          label: t('common.appfunc.workflow'),
        },
        {
          value: HqList.WorkstateBackupMacromanage,
          label: t('macro_manage.title'),
        },
      ]
    },
  ]
})
const syncTypeLabelMap = computed(() => {
  const map = {} as Record<HqList, string>
  syncRangeGroups.value.forEach(group => {
    group.children.forEach(child => {
      map[child.value] = child.label
    })
  })
  return map
})
const syncTargets = computed(() =>
  Object.values(HqList)
    .filter((v): v is HqList => typeof v === 'number')
    .filter(listtype => syncRange.value[listtype])
)
const getFailedLabels = computed(() => {
  return syncTargets.value
    .filter(target => !cloudLists.value?.[target]?.load_succeed)
    .map(target => syncTypeLabelMap.value[target])
})

const getUpdateTimeText = (time: number) => {
  if (time) {
    return t('cloud.text.last_upload', new Date(time).toLocaleString())
  }
  return t('cloud.text.not_uploaded')
}

const handleSelectAll = () => {
  for (const listtype of Object.values(HqList)) {
    if (typeof listtype === 'number') {
      syncRange.value[listtype] = true
    }
  }
}
const handleSelectRevert = () => {
  for (const listtype of Object.values(HqList)) {
    if (typeof listtype === 'number') {
      syncRange.value[listtype] = !syncRange.value[listtype]
    }
  }
}

const handleUpload = async () => {
  syncing.value = true

  if (getFailedLabels.value.length) {
    await alertError(
      t('cloud.message.cannot_sync_because_modules_data_load_failed') + '\n'
      + '-> ' + getFailedLabels.value.join(', ') + '\n'
      + t('cloud.message.please_refresh_and_retry')
    )
    syncing.value = false
    return
  }

  if (!await confirm(
    t('cloud.message.confirm_upload_1') + '\n'
    + t('cloud.message.confirm_upload_2')
  )) {
    syncing.value = false
    return
  }

  const failedModules : string[] = []
  for (const listtype of syncTargets.value) {
    const response = await dealUpload(listtype)
    if (response.errno) {
      failedModules.push(t('cloud.message.sync_error', {
        mod: syncTypeLabelMap.value[listtype],
        err: response.errmsg,
      }))
    }
  }

  if (failedModules.length) {
    await alertError(
      t('cloud.message.following_modules_sync_failed') + '\n'
      + failedModules.join('\n')
    )
  } else {
    NAIVE_UI_MESSAGE.success(t('cloud.message.sync_succeed'))
  }

  // 将同步范围保存到缓存
  const newCloudConfig = deepCopy(store.cloudConfig)
  newCloudConfig.nbb_sync_targets = syncTargets.value
  store.setCloudConfig(newCloudConfig)
  appForceUpdate()

  await loadLists()
  syncing.value = false

  async function dealUpload (listtype: HqList) {
    let content = ''
    switch (listtype) {
      case HqList.ConfigBackupUserConfig: {
        const obj = deepCopy(store.userConfig as any)
        delete obj.cache_work_state
        delete obj.fthelper_cache_work_state
        delete obj.gatherclock_cache_work_state
        delete obj.workflow_cache_work_state
        delete obj.macromanage_cache_work_state
        delete obj.fashioncloth_cache_work_state
        content = JSON.stringify(obj)
        break
      }
      case HqList.ConfigBackupFuncConfig: {
        const obj = deepCopy(store.funcConfig as any)
        delete obj.inventory_statement_enable_sync
        delete obj.inventory_workflow_enable_sync
        delete obj.inventory_other_items_way
        delete obj.inventory_data
        delete obj.cache_item_prices
        content = JSON.stringify(obj)
        break
      }
      case HqList.WorkstateBackupMain:
        content = JSON.stringify(store.userConfig.hqwb_cache_work_state)
        break
      case HqList.WorkstateBackupFtHelper:
        content = JSON.stringify(store.userConfig.mmhelper_cache_work_state)
        break
      case HqList.WorkstateBackupGatherClock:
        content = JSON.stringify(store.userConfig.gatherclock_cache_work_state)
        break
      case HqList.WorkstateBackupWorkflow: {
        const workstate = fixWorkflowWorkState(store.userConfig.workflow_cache_work_state)
        content = JSON.stringify(workstate)
        break
      }
      case HqList.WorkstateBackupMacromanage: {
        const workstate = fixMacromanageWorkState(store.userConfig.macromanage_cache_work_state)
        content = JSON.stringify(workstate)
        break
      }
      case HqList.WorkstateBackupFashioncloth: {
        const workstate = fixFashionclothWorkState(store.userConfig.fashioncloth_cache_work_state)
        content = JSON.stringify(workstate)
        break
      }
      case HqList.WorkstateBackupCsHelper: {
        const workstate = fixCsHelperWorkState(store.userConfig.cshelper_cache_work_state)
        content = JSON.stringify(workstate)
        break
      }
      case HqList.DataBackupInventory: 
        content = JSON.stringify({
          inventory_statement_enable_sync: store.funcConfig.inventory_statement_enable_sync,
          inventory_workflow_enable_sync: store.funcConfig.inventory_workflow_enable_sync,
          inventory_other_items_way: store.funcConfig.inventory_other_items_way,
          inventory_data: store.funcConfig.inventory_data,
        })
        break
      default:
        return {
          errno: 1,
          errmsg: 'Unexpected listtype' + listtype,
          data: {}
        } as NbbResponse
    }
    const isNewList = !cloudLists.value![listtype].id
    let response: NbbResponse
    if (isNewList) {
      response = await addList(listtype, content)
    } else {
      const id = cloudLists.value![listtype].id
      response = await editList(id, content)
    }
    return response
  }
}
const handleDownload = async () => {
  syncing.value = true

  if (getFailedLabels.value.length) {
    await alertError(
      t('cloud.message.cannot_sync_because_modules_data_load_failed') + '\n'
      + '-> ' + getFailedLabels.value.join(', ') + '\n'
      + t('cloud.message.please_refresh_and_retry')
    )
    syncing.value = false
    return
  }

  const novalLabels = syncTargets.value
    .filter(target => !cloudLists.value?.[target]?.last_update)
    .map(target => syncTypeLabelMap.value[target])
  if (novalLabels.length) {
    await alertError(
      t('cloud.message.cannot_sync_because_modules_data_not_uploaded') + '\n'
      + '-> ' + novalLabels.join(', ') + '\n'
      + t('cloud.message.please_upload_first')
    )
    syncing.value = false
    return
  }

  if (!await confirm(
    t('cloud.message.confirm_download_1') + '\n'
    + t('cloud.message.confirm_download_2')
  )) {
    syncing.value = false
    return
  }

  let configChanged = false

  // #region Sync user config
  const oldUserConfig = deepCopy(store.userConfig)
  let newUserConfig = deepCopy(store.userConfig)

  if (syncTargets.value.includes(HqList.ConfigBackupUserConfig)) {
    newUserConfig = JSON.parse(cloudLists.value![HqList.ConfigBackupUserConfig].content)
  }

  newUserConfig.cache_lasttime_version = oldUserConfig.cache_lasttime_version

  if (syncTargets.value.includes(HqList.WorkstateBackupMain)) {
    newUserConfig.hqwb_cache_work_state = JSON.parse(cloudLists.value![HqList.WorkstateBackupMain].content)
  } else {
    newUserConfig.hqwb_cache_work_state = oldUserConfig.hqwb_cache_work_state
  }

  if (syncTargets.value.includes(HqList.WorkstateBackupFtHelper)) {
    newUserConfig.mmhelper_cache_work_state = JSON.parse(cloudLists.value![HqList.WorkstateBackupFtHelper].content)
  } else {
    newUserConfig.mmhelper_cache_work_state = oldUserConfig.mmhelper_cache_work_state
  }

  if (syncTargets.value.includes(HqList.WorkstateBackupGatherClock)) {
    newUserConfig.gatherclock_cache_work_state = JSON.parse(cloudLists.value![HqList.WorkstateBackupGatherClock].content)
  } else {
    newUserConfig.gatherclock_cache_work_state = oldUserConfig.gatherclock_cache_work_state
  }

  if (syncTargets.value.includes(HqList.WorkstateBackupWorkflow)) {
    newUserConfig.workflow_cache_work_state = fixWorkflowWorkState(JSON.parse(cloudLists.value![HqList.WorkstateBackupWorkflow].content))
  } else {
    newUserConfig.workflow_cache_work_state = oldUserConfig.workflow_cache_work_state
  }

  if (syncTargets.value.includes(HqList.WorkstateBackupMacromanage)) {
    newUserConfig.macromanage_cache_work_state = fixMacromanageWorkState(JSON.parse(cloudLists.value![HqList.WorkstateBackupMacromanage].content))
  } else {
    newUserConfig.macromanage_cache_work_state = oldUserConfig.macromanage_cache_work_state
  }

  if (syncTargets.value.includes(HqList.WorkstateBackupFashioncloth)) {
    newUserConfig.fashioncloth_cache_work_state = fixFashionclothWorkState(JSON.parse(cloudLists.value![HqList.WorkstateBackupFashioncloth].content))
  } else {
    newUserConfig.fashioncloth_cache_work_state = oldUserConfig.fashioncloth_cache_work_state
  }

  if (syncTargets.value.includes(HqList.WorkstateBackupCsHelper)) {
    newUserConfig.cshelper_cache_work_state = fixCsHelperWorkState(JSON.parse(cloudLists.value![HqList.WorkstateBackupCsHelper].content))
  } else {
    newUserConfig.cshelper_cache_work_state = oldUserConfig.cshelper_cache_work_state
  }

  if (JSON.stringify(oldUserConfig) !== JSON.stringify(newUserConfig)) {
    console.log('userconfig json diff.\n', JSON.stringify(oldUserConfig), JSON.stringify(newUserConfig))
    configChanged = true
    store.userConfig = fixUserConfig(newUserConfig)
    store.updateUserConfig()
  } else {
    console.log('[CloudSync] Tip: no changes for userConfig.')
  }
  // #endregion

  // #region Sync func config
  const oldFuncConfig = deepCopy(store.funcConfig)
  let newFuncConfig = deepCopy(store.funcConfig)

  if (syncTargets.value.includes(HqList.ConfigBackupFuncConfig)) {
    newFuncConfig = JSON.parse(cloudLists.value![HqList.ConfigBackupFuncConfig].content)
  }

  if (syncTargets.value.includes(HqList.DataBackupInventory)) {
    const content = JSON.parse(cloudLists.value![HqList.DataBackupInventory].content)
    newFuncConfig.inventory_statement_enable_sync = content.inventory_statement_enable_sync
    newFuncConfig.inventory_workflow_enable_sync = content.inventory_workflow_enable_sync
    newFuncConfig.inventory_other_items_way = content.inventory_other_items_way
    newFuncConfig.inventory_data = deepCopy(content.inventory_data)
  } else {
    newFuncConfig.inventory_statement_enable_sync = oldFuncConfig.inventory_statement_enable_sync
    newFuncConfig.inventory_workflow_enable_sync = oldFuncConfig.inventory_workflow_enable_sync
    newFuncConfig.inventory_other_items_way = oldFuncConfig.inventory_other_items_way
    newFuncConfig.inventory_data = deepCopy(oldFuncConfig.inventory_data)
  }

  let itemPriceCacheCleaned = false
  if (oldFuncConfig.universalis_server !== newFuncConfig.universalis_server) {
    newFuncConfig.cache_item_prices = {}
    itemPriceCacheCleaned = true
  } else {
    newFuncConfig.cache_item_prices = oldFuncConfig.cache_item_prices
  }

  if (JSON.stringify(oldFuncConfig) !== JSON.stringify(newFuncConfig)) {
    console.log('funcconfig json diff.\n', JSON.stringify(oldFuncConfig), JSON.stringify(newFuncConfig))
    configChanged = true
    newFuncConfig = fixFuncConfig(newFuncConfig)
    store.setFuncConfig(newFuncConfig)
  } else {
    console.log('[CloudSync] Tip: no changes for funcConfig.')
  }
  // #endregion
  
  // 将同步范围保存到缓存
  const newCloudConfig = deepCopy(store.cloudConfig)
  newCloudConfig.nbb_sync_targets = syncTargets.value
  store.setCloudConfig(newCloudConfig)

  syncing.value = false
  if (configChanged) {
    const tips = [t('cloud.message.sync_succeed')]
    if (itemPriceCacheCleaned) tips.push(t('cloud.message.cache_cleaned'))
    tips.push(t('cloud.message.page_would_be_reloaded'))
    await alertInfo(tips.join('\n'))
    setTimeout(() => {
      window.electronAPI?.closeAllChildWindows?.()
      location.reload()
    }, 500)
  } else {
    NAIVE_UI_MESSAGE.success(t('cloud.message.data_consistent'))
  }
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="CloudSyncOutlined"
    :title="t('cloud.text.data_sync')"
    max-width="600px"
    @on-load="onLoad"
  >
    <n-spin :show="loading">
      <div class="wrapper">
        <n-card size="small" embedded>
          <template #header>
            <div class="card-title">
              <n-icon><ChecklistRtlOutlined /></n-icon>
              <span class="title">{{ t('cloud.text.sync_range') }}</span>
              <div class="card-title__actions font-small">
                <a href="javascript:void(0)" @click="handleSelectAll">[{{ t('common.select_all') }}]</a>
                <a href="javascript:void(0)" @click="handleSelectRevert">[{{ t('common.select_invert') }}]</a>
              </div>
            </div>
          </template>

          <div class="sync-range-wrapper">
            <GroupBox
              v-for="group in syncRangeGroups"
              :key="group.key"
              :title="group.title"
            >
              <div class="sync-range-container">
                <div
                  v-for="item in group.children"
                  :key="`syncrange-${item.value}`"
                  class="item"
                >
                  <n-checkbox v-model:checked="syncRange[item.value]">
                    {{ item.label }}
                  </n-checkbox>
                  <div class="desc">
                    <div v-if="loading" class="text">{{ t('cloud.text.loading') }}</div>
                    <div v-else-if="!cloudLists?.[item.value]?.load_succeed" class="text error">{{ t('common.load_failed') }}</div>
                    <div v-else class="text">{{ getUpdateTimeText(cloudLists[item.value].last_update) }}</div>
                  </div>
                </div>
              </div>
            </GroupBox>
          </div>
        </n-card>
        <n-card size="small" embedded>
          <template #header>
            <div class="card-title">
              <n-icon><CloudOutlined /></n-icon>
              <span class="title">{{ t('cloud.text.start_sync') }}</span>
            </div>
          </template>

          <div class="start-sync-wrapper">
            <n-button :text="!isMobile" :loading="syncing" :disabled="syncing || !syncTargets.length" @click="handleUpload">
              <div class="sync-button-container">
                <n-icon :size="isMobile ? 16 : 48"><CloudUploadRound /></n-icon>
                {{ t('cloud.text.upload_data') }}
              </div>
            </n-button>
            <n-button :text="!isMobile" :loading="syncing" :disabled="syncing || !syncTargets.length" @click="handleDownload">
              <div class="sync-button-container">
                <n-icon :size="isMobile ? 16 : 48"><CloudDownloadRound /></n-icon>
                {{ t('cloud.text.download_data') }}
              </div>
            </n-button>
          </div>
        </n-card>
      </div>
    </n-spin>
  </MyModal>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .sync-range-wrapper {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 10px;
    padding: 3px 12px;

    .sync-range-container {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 1px 6px 3px;

      .desc>.text {
        line-height: 1;
        font-size: 12px;
        padding-left: 2em;
      }
    }
  }
  .start-sync-wrapper {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 10px;
    padding: 0 12px;

    button {
      padding: 12px 12px 24px;
      border: 1px solid transparent;
      border-radius: 3px;

      .sync-button-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    }
    button:hover {
      border-color: var(--n-text-color-hover);
    }
  }
}
.text.error {
  color: var(--color-error);
}

/* Mobile */
@media screen and (max-width: 767px) {
  .wrapper {
    .sync-range-wrapper {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .start-sync-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;

      button {
        --n-height: 40px !important;
        padding: var(--n-padding);
        .sync-button-container {
          flex-direction: row;
          gap: 4px;
        }
      }
    }
  }
}
</style>