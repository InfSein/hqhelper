<script setup lang="ts" generic="DataRow">
import { 
  ListFilled,
  DeleteFilled,
  AddSharp,
} from '@vicons/material'
import { VueDraggable } from 'vue-draggable-plus'
import { deepCopy } from '@/tools'

const NAIVE_UI_MESSAGE = useMessage()

const t = inject<(message: string, args?: any) => string>('t')!
// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const data = defineModel<DataRow[]>('data', { required: true })

const props = defineProps<{
  /** 是否允许添加行 */
  canAdd?: boolean,
  /** 最低行数限制 */
  min?: number,
  /** 触发最低行数限制时的提示 */
  minTip?: string,
  /** 允许添加行时的最多行数限制 */
  max?: number,
  /** 触发最多行数限制时的提示 */
  maxTip?: string,
  /** 获取默认的行数据函数 */
  getDefaultDataRow?: () => DataRow,
  /** 调用保存前的检查函数，不合法时应返回错误信息 */
  checkRowsBeforeSave?: (rows: DataRow[]) => string,
}>()
defineSlots<{
  default(props: { row: DataRow, rowIndex: number }): any,
  tableTitle: any
}>()

interface FormDataRow {
  id: number,
  data: DataRow,
}
const formDataRows = ref<FormDataRow[]>([]) as Ref<FormDataRow[]>
const workflowIdCounter = ref(0)

onMounted(() => {
  setFormData(data.value)
})
watch(
  () => data,
  (newData) => {
    setFormData(newData.value)
  },
  { deep: true }
)
const setFormData = (_data: DataRow[]) => {
  formDataRows.value = deepCopy(_data).map(dr => {
    return {
      id: workflowIdCounter.value++,
      data: dr
    }
  })
}

const tryGetDefaultDataRow = () => {
  if (props.getDefaultDataRow) {
    return props.getDefaultDataRow()
  } else {
    NAIVE_UI_MESSAGE.error('getDefaultDataRow not defined. Check your code.')
    throw new Error('getDefaultDataRow not defined. Check your code.')
  }
}

const handleAddRow = () => {
  if (props.max && formDataRows.value.length >= props.max) {
    NAIVE_UI_MESSAGE.warning(props.maxTip ?? t('common.message.data_line_max_len', props.max))
    return
  }
  const newRow = tryGetDefaultDataRow()
  formDataRows.value.push({
    id: workflowIdCounter.value++,
    data: newRow,
  })
}

const handleSave = () => {
  if (props.min && formDataRows.value.length < props.min) {
    NAIVE_UI_MESSAGE.warning(props.minTip ?? t('common.message.data_line_min_len', props.min))
    return false
  }
  const new_data = deepCopy(formDataRows.value.map(row => row.data))
  if (props.checkRowsBeforeSave) {
    const invalidMsg = props.checkRowsBeforeSave(new_data)
    if (invalidMsg) {
      NAIVE_UI_MESSAGE.error(invalidMsg)
      return false
    }
  }
  data.value = new_data
  return true
}

defineExpose({
  handleSave,
})
</script>

<template>
  <VueDraggable
    v-model="formDataRows"
    target=".sort-target"
    handle=".draggable-box"
    :animation="150"
  >
    <n-table class="draggable-table" :single-line="false">
      <thead>
        <tr>
          <th>
            <slot name="tableTitle" />
          </th>
          <th>{{ t('common.manage') }}</th>
        </tr>
      </thead>
      <tbody class="sort-target">
        <tr v-for="(row, rowIndex) in formDataRows" :key="row.id">
          <td>
            <n-input-group>
              <n-input-group-label class="draggable-box" :title="t('common.drag_to_sort')">
                <n-icon :size="18"><ListFilled /></n-icon>
              </n-input-group-label>
              <slot :row="row.data" :row-index="rowIndex">
                <n-input v-if="typeof row.data === 'string'" v-model:value="row.data"/>
                <div v-else class="color-error">Default slot unset. Check your code.</div>
              </slot>
            </n-input-group>
          </td>
          <td>
            <n-button ghost type="error" size="small" @click="() => formDataRows.splice(rowIndex, 1)">
              <template #icon>
                <n-icon><DeleteFilled /></n-icon>
              </template>
              {{ t('common.delete') }}
            </n-button>
          </td>
        </tr>
      </tbody>
      <tbody v-if="canAdd && (!max || formDataRows.length < max)">
        <tr>
          <td></td>
          <td>
            <n-button ghost type="info" size="small" @click="handleAddRow">
              <template #icon>
                <n-icon><AddSharp /></n-icon>
              </template>
              {{ t('common.add') }}
            </n-button>
          </td>
        </tr>
      </tbody>
    </n-table>
  </VueDraggable>
</template>

<style scoped>
.draggable-table {
  margin: 10px 0;

  th {
    font-weight: bold;
  }
  th:first-child, td:first-child {
    width: 60%;
  }
  th:nth-child(2), td:nth-child(2) {
    width: 15%;
    text-align: center;
  }

  .draggable-box {
    display: flex;
    align-items: center;
    cursor: move;
  }
}
</style>