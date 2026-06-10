import type { GearSelections } from "@/types/game/gear"

/** 判断给定已选部件对象是否为空 (即是否还未选择任何部件) */
export const isGearEmpty = (gearSelections: GearSelections) => {
  return Object.values(gearSelections).every(obj => Object.values(obj).every(val => val === 0))
}
