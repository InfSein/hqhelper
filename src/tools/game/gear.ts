import type { Ref } from "vue"
import type { AccessoryAffix, AttireAffix, GearSelections, GearSlot } from "@/types/game/gear"
import { XivGearRecomm, XivGearSets, type HqDataVer, type XivGearSet } from "@/assets/data"

import mainhandIcon from '@/assets/icons/game-gear/Armoury_MainArm.svg'
import offhandIcon from '@/assets/icons/game-gear/Armoury_SubArm.svg'
import headIcon from '@/assets/icons/game-gear/Armoury_Head.svg'
import bodyIcon from '@/assets/icons/game-gear/Armoury_Body.svg'
import handsIcon from '@/assets/icons/game-gear/Armoury_Hands.svg'
import legsIcon from '@/assets/icons/game-gear/Armoury_Legs.svg'
import feetIcon from '@/assets/icons/game-gear/Armoury_Feet.svg'
import earringsIcon from '@/assets/icons/game-gear/Armoury_Earrings.svg'
import necklaceIcon from '@/assets/icons/game-gear/Armoury_Necklace.svg'
import wristIcon from '@/assets/icons/game-gear/Armoury_Bracelets.svg'
import ringsIcon from '@/assets/icons/game-gear/Armoury_Ring.svg'

/** 判断给定已选部件对象是否为空 (即是否还未选择任何部件) */
export const isGearEmpty = (gearSelections: GearSelections) => {
  return Object.values(gearSelections).every(obj => Object.values(obj).every(val => val === 0))
}

export const getGearIcon = (slot: GearSlot) => {
  switch (slot) {
    case 'mainHand': return mainhandIcon
    case 'offHand': return offhandIcon
    case 'headAttire': return headIcon
    case 'bodyAttire': return bodyIcon
    case 'handsAttire': return handsIcon
    case 'legsAttire': return legsIcon
    case 'feetAttire': return feetIcon
    case 'earrings': return earringsIcon
    case 'necklace': return necklaceIcon
    case 'wrist': return wristIcon
    case 'rings': return ringsIcon
  }
}

export const getGearRecomm = (patch: string | undefined, jobId: number) => {
  const result : XivGearSet[] = []
  if (patch && XivGearRecomm[patch]?.[jobId]?.length) {
    XivGearRecomm[patch][jobId].forEach(setId => {
      result.push(XivGearSets[setId])
    })
  }
  return result
}

export const useGearAdder = () => {
  const addMainHand = (gearSelections: Ref<GearSelections>, patchData: HqDataVer | undefined, jobId: number) => {
    if (patchData?.mainHand?.[jobId]) {
      gearSelections.value.mainHand[jobId]++
    }
  }
  const addOffHand = (gearSelections: Ref<GearSelections>, patchData: HqDataVer | undefined, jobId: number) => {
    if (patchData?.offHand?.[jobId]) {
      gearSelections.value.offHand[jobId]++
    }
  }
  const addMainOffHand = (gearSelections: Ref<GearSelections>, patchData: HqDataVer | undefined, jobId: number) => {
    addMainHand(gearSelections, patchData, jobId)
    addOffHand(gearSelections, patchData, jobId)
  }
  const addAttire = (gearSelections: Ref<GearSelections>, patchData: HqDataVer | undefined, affix: AttireAffix) => {
    if (patchData?.headAttire?.[affix]) {
      gearSelections.value.headAttire[affix]++
    }
    if (patchData?.bodyAttire?.[affix]) {
      gearSelections.value.bodyAttire[affix]++
    }
    if (patchData?.handsAttire?.[affix]) {
      gearSelections.value.handsAttire[affix]++
    }
    if (patchData?.legsAttire?.[affix]) {
      gearSelections.value.legsAttire[affix]++
    }
    if (patchData?.feetAttire?.[affix]) {
      gearSelections.value.feetAttire[affix]++
    }
  }
  const addAccessory = (gearSelections: Ref<GearSelections>, patchData: HqDataVer | undefined, affix: AccessoryAffix) => {
    if (patchData?.earrings?.[affix]) {
      gearSelections.value.earrings[affix]++
    }
    if (patchData?.necklace?.[affix]) {
      gearSelections.value.necklace[affix]++
    }
    if (patchData?.wrist?.[affix]) {
      gearSelections.value.wrist[affix]++
    }
    if (patchData?.rings?.[affix]) {
      gearSelections.value.rings[affix] += 2
    }
  }

  return {
    addMainHand, addOffHand,
    addMainOffHand,
    addAttire,
    addAccessory
  }
}
