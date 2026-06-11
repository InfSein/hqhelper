import { XivCraftActions, type XivCraftAction } from '@/assets/data'
import type { CraftMacroRow, RecordedCraftMacro } from "@/types/workstate/macromanage"
import { deepCopy } from "../tools"
import { getItemInfo } from "../tools/item"
import { useStore } from "@/store"

const useMacroHelper = () => {
  const store = useStore()

  /** 将生产宏转换为技能列表 */
  const parseCraftMacroText = (macro: string) => {
    const actions : string[] = []
    macro.split('\n').forEach(line => {
      const match = line.match(/\/(ac|action|技能)\s(?:"(.*?)"|(\S+))(?:\s?<wait\.\d+>)?/)
      const action = match?.[2] || match?.[3]
      if (action) actions.push(action)
    })
    const result: XivCraftAction[] = []
    actions.forEach(action => {
      const craftAction = Object.values(XivCraftActions).find(a => 
        a.name_zh === action || a.name_en === action || a.name_ja === action
      )
      if (craftAction) {
        result.push(craftAction)
      } else {
        console.warn(`Unknown action: ${action}`)
      }
    })
    return result
  }

  /** 将生产模拟器导出的工序转换为技能列表 */
  const parseCraftProcedure = (procedure: string) : XivCraftAction[] => {
    const procedures = JSON.parse(procedure) as string[]
    if (!Array.isArray(procedures) || !procedures?.length) {
      return []
    }
    const result: XivCraftAction[] = []
    procedures.forEach(p => {
      const craftAction = Object.values(XivCraftActions).find(a => 
        a.simulator_keys.includes(p)
      )
      if (craftAction) {
        result.push(craftAction)
      } else {
        console.warn(`Unknown procedure: ${p}`)
      }
    })
    return result
  }

  /** 计算生产宏消耗的CP */
  const calMacroCpCost = (actions: XivCraftAction[]) => {
    return actions.reduce((total, action, index) => {
      if (action.combo_actions && action.combo_cost_cp) {
        const in_combo = action.combo_actions.some(comboLink => {
          return comboLink.every((comboId, i) => actions[index - (comboLink.length - 1 - i)]?.id === comboId)
        })
        return total + (in_combo ? action.combo_cost_cp : action.cost_cp)
      } else {
        return total + action.cost_cp
      }
    }, 0)
  }

  /** 将技能列表按用户设置组装为宏 */
  const exportCraftMacroText = (_actions: XivCraftAction[]) => {
    const actions = deepCopy(_actions)

    let threshold = 15, pushLines = 14
    if (store.funcConfig.cmacro_use_macrolock) {
      threshold--; pushLines--
    }

    const columns : XivCraftAction[][] = []
    while (actions.length > 0) {
      if (actions.length > threshold) {
        columns.push(actions.splice(0, pushLines))
      } else {
        columns.push(actions.splice(0, actions.length))
      }
    }

    // 处理一些设置项的默认值
    const cmacro_transition_tipper_content = store.funcConfig.cmacro_transition_tipper_content || '/e Macro #~INDEX completed. <se.1>'
    const cmacro_end_tipper_content = store.funcConfig.cmacro_end_tipper_content || '/e Craft done! <se.14>'

    const result = {
      macros_zh: [] as string[],
      macros_en: [] as string[],
      macros_ja: [] as string[],
    }
    const linebreak = '\r\n'

    columns.forEach((column, index) => {
      const macro = {
        macro_zh: '',
        macro_en: '',
        macro_ja: '',
      }
      const langs = ['zh', 'en', 'ja']
      langs.forEach(_lang => {
        const lang = _lang as "zh" | "en" | "ja"
        if (store.funcConfig.cmacro_use_macrolock) {
          macro[`macro_${lang}`] += '/macrolock' + linebreak
        }
        column.forEach(action => {
          let actionName = action[`name_${lang}`]
          if (!store.funcConfig.cmacro_remove_quotes) {
            actionName = `"${actionName}"`
          }
          macro[`macro_${lang}`] += `/ac ${actionName} <wait.${action.wait_time}>${linebreak}`
        })

        if (column.length !== threshold) {
          if (column.length < pushLines) {
            macro[`macro_${lang}`] += cmacro_end_tipper_content + linebreak
          } else {
            macro[`macro_${lang}`] += cmacro_transition_tipper_content.replace('~INDEX', `${index + 1}`) + linebreak
          }
        }

        macro[`macro_${lang}`] = macro[`macro_${lang}`].slice(0, linebreak.length * -1)
        const _macro = deepCopy(macro)
        result[`macros_${lang}`].push(_macro[`macro_${lang}`])
      })
    })

    return result
  }

  /** 将表格行数据归档为缓存的宏内容 */
  const archiveMacroRow = (row: CraftMacroRow, customCpRequirement?: number) : RecordedCraftMacro => {
    const { id, name, remark, relateItems, tags, requirements, craftActions } = row
    return {
      id,
      name,
      remark,
      relateItems: relateItems.map(item => {
        if (typeof item === 'string') {
          return item
        } else {
          return item.id
        }
      }),
      tags,
      requirements: {
        craftsmanship: requirements.craftsmanship,
        control: requirements.control,
        cp: customCpRequirement ?? calMacroCpCost(craftActions),
      },
      craftActions: craftActions.map(action => action.id),
    }
  }
  /** 将缓存的宏内容解档为表格行数据 */
  const unarchiveMacroRow = (macro: RecordedCraftMacro) : CraftMacroRow => {
    const relateItems = macro.relateItems.map(item => {
      if (typeof item === 'number') {
        return getItemInfo(item)
      } else {
        return item
      }
    })
    const craftActions = macro.craftActions.map(actionid => XivCraftActions[actionid])
    const cpRequirement = calMacroCpCost(craftActions)

    return {
      id: macro.id,
      name: macro.name,
      remark: macro.remark,
      relateItems: relateItems,
      tags: macro.tags,
      requirements: {
        craftsmanship: macro.requirements?.craftsmanship,
        control: macro.requirements?.control,
        cp: macro.requirements?.cp ?? cpRequirement,
      },
      craftActions: craftActions,
    }
  }

  /** 将已记录的宏导出为JSON文件 */
  const exportRecordedMacros = (
    macros: RecordedCraftMacro[],
    filename?: string,
  ) => {
    const data = macros.map(m => ([
      m.id, m.name, m.remark, m.relateItems, m.tags,
      [m.requirements.craftsmanship, m.requirements.control, m.requirements.cp],
      m.craftActions
    ]))
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    function generateFileName() {
      const now = new Date()
      const formattedDate = now.toISOString().slice(0, 10) // YYYY-MM-DD
      const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, '') // HHMMSS
      const fileName = `hqhelper-macromanage-export_${formattedDate}T${formattedTime}.json`
      return fileName
    }
    const name = filename || generateFileName() // 保存的文件名

    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }
  /** 导入JSON文件，解析为已记录的宏 */
  const importRecordedMacros = async (file: File) : Promise<RecordedCraftMacro[]> => {
    const text = await file.text()
    let raw: any

    try {
      raw = JSON.parse(text)
    } catch {
      throw new Error('Format error, not a valid json.')
    }

    if (!isRecordedCraftMacroArray(raw)) {
      throw new Error('Struct invalid. Do not edit exported file!')
    }

    const macros: RecordedCraftMacro[] = raw.map((m: any) => ({
      id: m[0],
      name: m[1],
      remark: m[2],
      relateItems: m[3],
      tags: m[4],
      requirements: {
        craftsmanship: m[5][0],
        control: m[5][1],
        cp: m[5][2],
      },
      craftActions: m[6],
    }))

    return macros;

    function isRecordedCraftMacroArray(data: any) {
      return Array.isArray(data) && data.every(entry => {
        return Array.isArray(entry) &&
          typeof entry[0] === 'number' &&
          typeof entry[1] === 'string' &&
          typeof entry[2] === 'string' &&
          Array.isArray(entry[3]) && entry[3].every((x: any) => typeof x === 'number' || typeof x === 'string') &&
          Array.isArray(entry[4]) && entry[4].every((x: any) => typeof x === 'string') &&
          Array.isArray(entry[5]) &&
            (entry[5].length === 3) &&
            (entry[5].every((x: any) => {
              if (x === null) x = undefined
              return typeof x === 'number' || typeof x === 'undefined'
            })) &&
          Array.isArray(entry[6]) && entry[6].every((x: any) => typeof x === 'number')
      })
    }
  }

  return {
    /** 将生产宏转换为技能列表 */
    parseCraftMacroText,
    /** 将生产模拟器导出的工序转换为技能列表 */
    parseCraftProcedure,
    /** 计算生产宏消耗的CP */
    calMacroCpCost,
    /** 将技能列表按用户设置组装为宏 */
    exportCraftMacroText,
    /** 将表格行数据归档为缓存的宏内容 */
    archiveMacroRow,
    /** 将缓存的宏内容解档为表格行数据 */
    unarchiveMacroRow,
    /** 将已记录的宏导出为JSON文件 */
    exportRecordedMacros,
    /** 导入JSON文件，解析为已记录的宏 */
    importRecordedMacros,
  }
}

export default useMacroHelper