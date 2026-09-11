import {
  assignDefaults,
} from '@/tools'

export type CsHelperMode = "target" | "free"
export type CsHelperTarget = {
  lesser: CsHelperTargetValue,
  greater: CsHelperTargetValue,
}
export type CsHelperTargetValue = {
  scrip: number,
  item: number | null,
}

export interface WorkState {
  mode: CsHelperMode;
  hidePrecraftMaterials: boolean;
  target: CsHelperTarget;
  free: {
    job: number;
    itemSelected: Record<number, number>;
  };
}
export const defaultWorkState: WorkState = {
  mode: 'target',
  hidePrecraftMaterials: false,
  target: {
    lesser: {
      scrip: 0, item: null,
    },
    greater: {
      scrip: 0, item: null,
    },
  },
  free: {
    job: 8,
    itemSelected: {},
  },
}

export const fixWorkState = (state?: WorkState) : WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  return _state
}