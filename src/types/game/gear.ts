import {
  XivJobs
} from '@/assets/data'
import { deepCopy } from '@/tools'

export const gearSlots = [
  "mainHand", "offHand",
  "headAttire", "bodyAttire", "handsAttire", "legsAttire", "feetAttire",
  "earrings", "necklace", "wrist", "rings"
] as const
export type GearSlot = typeof gearSlots[number]

export const attireAffixes = [
  "fending",
  "healing",
  "maiming", "striking", "scouting", "aiming", "casting",
  "gathering", "crafting",
] as const
export type AttireAffix = typeof attireAffixes[number]

export const accessoryAffixes = [
  "fending",
  "healing",
  "slaying", "aiming", "casting",
  "gathering", "crafting",
] as const
export type AccessoryAffix = typeof accessoryAffixes[number]

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

export const defaultGearSelections : GearSelections = {
  mainHand: {},
  offHand: {},

  headAttire: {} as Record<AttireAffix, number>,
  bodyAttire: {} as Record<AttireAffix, number>,
  handsAttire: {} as Record<AttireAffix, number>,
  legsAttire: {} as Record<AttireAffix, number>,
  feetAttire: {} as Record<AttireAffix, number>,

  earrings: {} as Record<AccessoryAffix, number>,
  necklace: {} as Record<AccessoryAffix, number>,
  wrist: {} as Record<AccessoryAffix, number>,
  rings: {} as Record<AccessoryAffix, number>,
}

export const fixGearSelections = (gears?: GearSelections) => {
  if (!gears) {
    gears = deepCopy(defaultGearSelections)
  }
  const XivJobIds = Object.keys(XivJobs).map(jobId => parseInt(jobId))
  XivJobIds.forEach(jobId => {
    gears.mainHand[jobId] |= 0
    gears.offHand[jobId] |= 0
  })
  attireAffixes.forEach(affix => {
    gears.headAttire[affix] |= 0
    gears.bodyAttire[affix] |= 0
    gears.handsAttire[affix] |= 0
    gears.legsAttire[affix] |= 0
    gears.feetAttire[affix] |= 0
  })
  accessoryAffixes.forEach(affix => {
    gears.earrings[affix] |= 0
    gears.necklace[affix] |= 0
    gears.wrist[affix] |= 0
    gears.rings[affix] |= 0
  })
  return gears
}
