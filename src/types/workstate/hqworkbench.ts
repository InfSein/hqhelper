// WorkState of HqWorkBench.
import type { XivPatchVer } from '@/assets/data'
import {
  assignDefaults,
} from '@/tools'
import { fixGearSelections, type GearSelections } from '../game/gear'

export interface WorkState {
  patch?: XivPatchVer
  job?: number
  gears: GearSelections
}
const defaultWorkState: WorkState = {
  patch: undefined,
  job: undefined,
  gears: fixGearSelections()
}

export const fixWorkState = (state?: WorkState): WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  _state.gears = fixGearSelections(_state.gears)
  return _state
}
