import {
  assignDefaults,
  deepCopy
} from '@/tools'

export interface Workflow {
  name?: string;
  /** 临时ID, 目前只用于 vue-draggable 渲染 */
  tempId?: number;
  /** 制作目标; key:item-id, value:amount */
  targetItems: Record<number, number>;
  /** 已有道具; key:item-id, value:amount */
  preparedItems: {
    craftTarget: Record<number, number>,
    materialsLv1: Record<number, number>,
    materialsLvBase: Record<number, number>
  },
  recommData: {
    expandedBlocks: Record<number, string[]>,
    /** (groupId, (itemId, checked)) */
    completedItems: Record<number, Record<number, boolean>>
  }
}
const defaultWorkflow: Workflow = {
  targetItems: {},
  preparedItems: {
    craftTarget: {},
    materialsLv1: {},
    materialsLvBase: {},
  },
  recommData: {
    expandedBlocks: {},
    completedItems: {}
  }
}
export const getDefaultWorkflow = () => deepCopy(defaultWorkflow)
export const _VAR_MAX_WORKFLOW = 10;

export interface WorkState {
  pageView: "AB" | "BC";
  selectedJob: number;
  selectedMenu: "common" | "special" | "master";
  selectedContentGroup: `i_${number}`;
  selectedItem: number;
  currentWorkflow: number;
  workflows: Workflow[];
}
export const defaultWorkState: WorkState = {
  pageView: 'BC',
  selectedJob: 8,
  selectedMenu: 'common',
  selectedContentGroup: 'i_96',
  selectedItem: 0,
  currentWorkflow: 0,
  workflows: [getDefaultWorkflow()]
}

export const fixWorkState = (state?: WorkState) : WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  _state.workflows.forEach(workflow => {
    if (!workflow.recommData) {
      workflow.recommData = deepCopy(defaultWorkflow.recommData)
    }
  })
  return _state
}
