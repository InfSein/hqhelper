// WorkState of MmHelper (Meal and Medicine).
import {
  assignDefaults,
} from '@/tools'

export interface WorkState {
  patch: string
  hidePrecraftMaterials: boolean
  itemSelected: Record<number, number>
}
const defaultWorkState: WorkState = {
  patch: '',
  hidePrecraftMaterials: false,
  itemSelected: {},
}

export const fixWorkState = (state?: WorkState): WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  return _state
}
