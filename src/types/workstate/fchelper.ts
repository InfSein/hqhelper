import type { XivPatchVer } from '@/assets/data'
import {
  assignDefaults,
} from '@/tools'

export interface WorkState {
  patch: XivPatchVer;
  hidePrecraftMaterials: boolean;
  itemSelected: Record<number, number>;
}
export const defaultWorkState: WorkState = {
  patch: '7.4',
  hidePrecraftMaterials: false,
  itemSelected: {},
}

export const fixWorkState = (state?: WorkState) : WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  return _state
}