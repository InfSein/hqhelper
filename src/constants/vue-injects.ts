import type { InjectionKey } from 'vue'
import type { ItemInfo } from '@/tools/item'

/** 添加物品到当前工作流的回调 */
export const addToCurrentWorkflowKey: InjectionKey<(itemId: number) => void> = Symbol('addToCurrentWorkflow')

/** 反查配方：搜索使用指定物品作为素材的配方，并在制作笔记中展示结果 */
export const reverseRecipeLookupKey: InjectionKey<(item: ItemInfo) => void> = Symbol('reverseRecipeLookup')
