// WorkState of HqWorkBench.
import type { XivPatchVer } from '@/assets/data'
import {
  assignDefaults,
} from '@/tools'
import { fixGearSelections, type AccessoryAffix, type AttireAffix } from './game.gear'

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

export interface GearSelections {
  mainHand: Record<number, number>;
  offHand: Record<number, number>;
  
  headAttire: Record<AttireAffix, number>;
  bodyAttire: Record<AttireAffix, number>;
  handsAttire: Record<AttireAffix, number>;
  legsAttire: Record<AttireAffix, number>;
  feetAttire: Record<AttireAffix, number>;

  earrings: Record<AccessoryAffix, number>;
  necklace: Record<AccessoryAffix, number>;
  wrist: Record<AccessoryAffix, number>;
  rings: Record<AccessoryAffix, number>;
}

export const fixWorkState = (state?: WorkState) : WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  _state.gears = fixGearSelections(_state.gears)
  return _state
}
