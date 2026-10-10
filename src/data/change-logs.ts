export interface PatchNote {
  /**
   * 版本号
   */
  version: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 改动内容
   * * `key`: 改动类型
   * * `value`: 改动内容
   */
  changes: PatchChangeGroup[];
  /**
   * 是否为重要更新
   */
  important?: boolean;
}
export interface PatchChangeGroup {
  name: string;
  changes: string[];
}

/*
    {
      version: '2.4.3',
      date: '2026-01-04',
      changes: [
        {
          name: groupName.breaking,
          changes: [
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
          ]
        },
        {
          name: groupName.feature,
          changes: [
          ]
        }
      ]
    },

            t('changelog.2_0_12.feat.text_5', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appfunc.craft_statement'),
              f3: t('preference.statement_ignore_crystals.title')
            }),
    「」
 */

const halfEmBlock = '<span style="display:inline-block;width:0.5em;"></span>'
const emBlock = '<span style="display:inline-block;width:1em;"></span>'
const br = '<br>'
const tipper = '<br>' +  halfEmBlock + ' ※ '
const renderImg = (url: string) => `<img src="${url}" style="max-width: 70%;" />`
const renderLink = (url: string, text?: string) => {
  text ??= url
  return `<a target="_blank" href="${url}">${text}</a>`
}
const renderList = (list: string[]) => {
  const content = list.filter(line => !!line).map(line => `<li>${line}</li>`).join('')
  return `<ul>${content}</ul>`
}
const getNoteImage = (ver: string, filename: string) => {
  return renderImg(`https://infsein.github.io/static/hqhelper/patchnote/${ver}/${filename}`)
}
export const getChangelogs = (
  ui_lang: 'zh' | 'ja' | 'en',
  t: (message: string, args?: any) => string
) => {
  const groupName = {
    bugfix: t('changelog.fix'),
    feature: t('changelog.feat'),
    breaking: t('changelog.breaking'),
    milestone: t('changelog.milestone')
  }
  const isZh = ui_lang === 'zh'
  return [
    {
      version: '2.5.1',
      date: '2026-07-28',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.game_db_update', {
              ver: '7.55'
            }),
            t('changelog.shared.add_new_func', t('item.price.detail_table.title'))
              + br + t('changelog.2_5_1.breaking.text_1')
              + br + getNoteImage('2.5.1', '1.png'),
            t('changelog.2_5_1.breaking.text_2', [renderLink('https://hqhelper.com', 'hqhelper.com')])
              + br + t('changelog.2_5_1.breaking.text_3')
              + tipper + t('changelog.2_5_1.breaking.text_4')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_5_1.feat.text_1')
              + br + getNoteImage('2.5.1', '2.png'),
            t('changelog.2_5_1.feat.text_2'),
            t('changelog.2_5_1.feat.text_3')
          ]
        }
      ]
    },
    {
      version: '2.5.0',
      date: '2026-04-28',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.game_db_update', {
              ver: '7.5'
            }),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_5_0.fix.text_9'),
            t('changelog.2_5_0.fix.text_8'),
            t('changelog.2_5_0.fix.text_1'),
            t('changelog.2_5_0.fix.text_2'),
            t('changelog.2_5_0.fix.text_3'),
            t('changelog.2_5_0.fix.text_4'),
            t('changelog.2_5_0.fix.text_5'),
            t('changelog.2_5_0.fix.text_6'),
            t('changelog.2_5_0.fix.text_7'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_5_0.feat.text_1')
              + br + t('changelog.2_5_0.feat.text_2'),
          ]
        }
      ]
    },
    {
      version: '2.4.5',
      date: '2026-03-04',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.game_db_update', {
              ver: '7.45'
            })
              + (isZh ? (br + 
                '7.45版本对部分已有道具的描述进行了修订。涉及HqHelper的道具有：'
                + renderList(['阳光棱晶'])
                + '除此以外无实际变更。'
              ) : ''),
            t('changelog.2_4_5.breaking.text_8')
              + br + t('changelog.2_4_5.breaking.text_9')
              + br + getNoteImage('2.4.5', '4.jpg'),
            t('changelog.2_4_5.breaking.text_10')
              + renderList([
                t('changelog.2_4_5.breaking.text_11'),
                t('changelog.2_4_5.breaking.text_12'),
              ])
              + getNoteImage('2.4.5', '1.jpg')
              + br + getNoteImage('2.4.5', '2.jpg'),
            t('changelog.2_4_5.breaking.text_1')
              + renderList([
                t('changelog.2_4_5.breaking.text_2'),
                t('changelog.2_4_5.breaking.text_3'),
                t('changelog.2_4_5.breaking.text_4'),
                t('changelog.2_4_5.breaking.text_5'),
                t('changelog.2_4_5.breaking.text_6'),
              ])
              + getNoteImage('2.4.5', '3.jpg'),
            t('changelog.2_4_5.breaking.text_7'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_4_5.feat.text_1'),
            t('changelog.2_4_5.feat.text_2'),
          ]
        }
      ]
    },
    {
      version: '2.4.4',
      date: '2026-01-27',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.game_db_update', {
              ver: '7.41'
            })
              + (isZh ? (br + 
                '7.41版本对部分已有道具的名称进行了修订。涉及HqHelper的道具名变更如下：'
                + renderList(['高密度轻银矿 → 高密度轻铝矿'])
              ) : ''),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_4_4.feat.text_1')
              + br + getNoteImage('2.4.4', '1.png')
          ]
        }
      ]
    },
    {
      version: '2.4.3',
      date: '2026-01-04',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_4_3.breaking.text_1')
              + br + getNoteImage('2.4.3', '1.png')
              + br + getNoteImage('2.4.3', '2.png'),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_4_3.fix.text_1'),
            t('changelog.2_4_3.fix.text_2'),
            t('changelog.2_4_3.fix.text_3'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_12.feat.text_5', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appfunc.item_price'),
              f3: t('preference.costandbenefit_item_sort_by.title')
            })
              + br + t('changelog.2_4_3.feat.text_1')
              + br + getNoteImage('2.4.3', '3.png')
              + br + getNoteImage('2.4.3', '4.png'),
            t('changelog.shared.detail_optimized'),
          ]
        }
      ]
    },
    {
      version: '2.4.2',
      date: '2025-12-22',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_4_2.fix.text_1', {
              f1: t('common.appfunc.recomm_process'),
              f2: t('preference.processes_craftable_item_sortby.title'),
              f3: t('preference.processes_craftable_item_sortby.option.crafting_log')
            }),
            t('changelog.2_4_2.fix.text_3', [
              t('preference.macro_generate_mode.title'),
              t('preference.macro_generate_mode.option.multi_line'),
            ]),
            t('changelog.2_4_2.fix.text_4', [
              t('preference.macro_generate_mode.title'),
              t('preference.macro_generate_mode.option.multi_line'),
            ]),
            t('changelog.2_4_2.fix.text_2'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_4_2.feat.text_1', [t('common.appfunc.ingame_inventory')]),
            isZh ? '追加和修订了部分物品的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
          ]
        }
      ]
    },
    {
      version: '2.4.1',
      date: '2025-12-18',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_4_1.fix.text_1'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_4_1.feat.text_1')
              + '<br>' + getNoteImage('2.4.1', '1.png'),
            t('changelog.2_4_1.feat.text_2')
              + '<br>' + getNoteImage('2.4.1', '2.png'),
            t('changelog.shared.optimize_ui_detail'),
          ]
        }
      ]
    },
    {
      version: '2.4.0',
      date: '2025-12-16',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.game_db_update', {
              ver: '7.4'
            })
              + br + t('changelog.2_4_0.breaking.text_1')
              + t('changelog.2_4_0.breaking.text_2')
              + '<br>' + getNoteImage('2.4.0', 'patch_logo.png'),
            t('changelog.2_0_12.feat.text_5', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appsetting.appearance'),
              f3: t('preference.custom_background.title')
            })
              + '<br>' + getNoteImage('2.4.0', 'intro.png'),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_4_0.fix.text_1'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            isZh ? '修订了“参考资料”中的推荐攻略，并调整了菜单项的显示效果 (仅在界面语言设置为简体中文时显示)。' : '',
            isZh ? '追加和修订了部分物品的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.2_4_0.feat.text_6')
              + '<br>' + getNoteImage('2.4.0', 'workflow_import.png'),
            t('changelog.2_4_0.feat.text_5')
              + '<br>' + getNoteImage('2.4.0', 'context.png'),
            t('changelog.2_4_0.feat.text_3')
              + '<br>※ ' + t('changelog.2_4_0.feat.text_4'),
            t('changelog.2_4_0.feat.text_2'),
            t('changelog.2_4_0.feat.text_1'),
            t('changelog.shared.optimize_ui_detail'),
          ]
        }
      ]
    },
    {
      version: '2.3.7',
      date: '2025-11-11',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.global_db_update', {
              ver: '7.38'
            })
              + '<br> ※ ' + t('changelog.2_1_2.breaking.text_1'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            isZh ? '追加和修订了部分物品的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.shared.detail_optimized'),
          ]
        }
      ]
    },
    {
      version: '2.3.6',
      date: '2025-11-04',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.chs_db_update', {
              ver: '7.38'
            }),
            t('changelog.2_3_6.breaking.text_1')
              + '<br>'
              + renderList([
                isZh ? '现在物品语言设置为中文时，物品右键菜单中的“在花环数据库中打开”会访问国内的镜像站点(garlandtools.cn)；' : '',
                t('changelog.2_3_6.breaking.text_2', [t('common.appfunc.user_preference'),t('common.appsetting.general'),t('common.server')]),
                t('changelog.2_3_6.breaking.text_3', [t('common.appfunc.recomm_process'),t('recomm_process.text.hide_items_not_installed_in_chs')]),
                t('changelog.2_3_6.breaking.text_4')
              ])
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_3_6.fix.text_1'),
            t('changelog.2_3_6.fix.text_2'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_3_6.feat.text_1', t('preference.split_quick_operate_options_main_off.title'))
              + '<br>' + renderImg('https://infsein.github.io/static/hqhelper/patchnote/2.3.6/1.png'),
            t('changelog.shared.optimize_page_perform'),
          ]
        }
      ]
    },
    {
      version: '2.3.5',
      date: '2025-10-08',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.global_db_update', {
              ver: '7.35'
            }),
            t('changelog.shared.add_new_func', t('common.appfunc.cshelper'))
              + '<br>' + t('changelog.2_3_5.breaking.text_1')
              + '<br>' + t('changelog.2_3_5.breaking.text_2')
              + '<br>' + t('changelog.2_3_5.breaking.text_3')
              + '<ul><li>' + t('changelog.2_3_5.breaking.text_4')
                + '<br>' + renderImg('https://infsein.github.io/static/hqhelper/patchnote/2.3.5/1.png') + '</li>'
              + '<li>' + t('changelog.2_3_5.breaking.text_5')
                + '<br>' + renderImg('https://infsein.github.io/static/hqhelper/patchnote/2.3.5/2.png') + '</li></ul>' +
              t('changelog.2_3_5.breaking.text_6'),
            t('changelog.shared.add_new_func', t('common.appfunc.fchelper'))
              + '<br>' + t('changelog.2_3_5.breaking.text_7')
              + '<br>' + renderImg('https://infsein.github.io/static/hqhelper/patchnote/2.3.5/3.png'),
            t('changelog.2_3_5.breaking.text_8')
              + '<br>※ ' + t('changelog.2_3_5.breaking.text_9')
              + '<br>' + renderImg('https://infsein.github.io/static/hqhelper/patchnote/2.3.5/5.png'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_3_5.feat.text_1')
              + '<br>' + renderImg('https://infsein.github.io/static/hqhelper/patchnote/2.3.5/6.png'),
            t('changelog.2_3_5.feat.text_2'),
            t('changelog.2_3_5.feat.text_3'),
            t('changelog.2_3_5.feat.text_4')
              + '<br>' + renderImg('https://infsein.github.io/static/hqhelper/patchnote/2.3.5/7.png'),
            t('changelog.2_3_5.feat.text_5'),
            t('changelog.shared.detail_optimized'),
            isZh ? '追加和修订了部分物品的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
          ]
        }
      ]
    },
    {
      version: '2.3.4',
      date: '2025-09-16',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.game_db_update', {
              ver: '7.31'
            })
              + (isZh ? (
                tipper + '我们之前提供的物品名称／描述的翻译有部分与国服正式文本不同。如果想要查看变化详情，请参阅'
                + renderLink('https://docs.qq.com/doc/DY3dKYXB3ZElFU2xN', 'HqHelper 中文暂译修订记录')
                + '。'
              ) : ''),
            t('changelog.2_3_4.breaking.text_1'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_3_4.feat.text_1'),
            t('changelog.shared.detail_optimized'),
            isZh ? '追加和修订了部分物品的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
          ]
        }
      ]
    },
    {
      version: '2.3.3',
      date: '2025-08-13',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.chs_db_update', {
              ver: '7.25'
            })
              + (isZh ? (
                tipper + '国服7.25版本修改了一部分物品的名称和描述。如果想要查看修改详情，请参阅'
                + renderLink('https://docs.qq.com/doc/DY3dKYXB3ZElFU2xN', 'HqHelper 中文暂译修订记录')
                + '。'
              ) : ''),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_3_3.fix.text_1')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_3_3.feat.text_1')
          ]
        }
      ]
    },
    {
      version: '2.3.2',
      date: '2025-08-08',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_3_2.fix.text_1'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_3_2.feat.text_1'),
            isZh ? '追加和修订了部分物品的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
          ]
        }
      ]
    },
    {
      version: '2.3.1',
      date: '2025-08-06',
      changes: [
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_2_1.feat.text_1', '7.3'),
            isZh ? '追加和修订了部分物品的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.2_3_1.feat.text_1')
              + '<br>' + renderImg('https://infsein.github.io/static/hqhelper/patchnote/2_3_1.1.png'),
            t('changelog.2_3_1.feat.text_2'),
          ]
        }
      ]
    },
    {
      version: '2.3.0',
      date: '2025-08-05',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.global_db_update', {
              ver: '7.3'
            })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_3_0.fix.text_1'),
            t('changelog.2_3_0.fix.text_2')
              + tipper + t('changelog.2_3_0.fix.text_3') + ' ' + t('changelog.2_3_0.fix.text_4'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_3_0.feat.text_3'),
            t('changelog.2_3_0.feat.text_1', t('common.open_in.ffmomola'))
              + '<br>' + t('changelog.2_3_0.feat.text_4'),
            t('changelog.2_3_0.feat.text_2')
          ]
        }
      ]
    },
    {
      version: '2.2.8',
      date: '2025-07-18',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_2_8.breaking.text_1')
              + '<br>' +  halfEmBlock + '① ' + t('changelog.2_2_8.breaking.text_2')
              + '<br>' +  halfEmBlock + '② ' + t('changelog.2_2_8.breaking.text_3', renderLink('https://zh.crowdin.com/project/hqhelper', 'Crowdin'))
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_2_8.fix.text_1'),
            t('changelog.2_2_8.fix.text_2') + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/07/18/687a1850aefa7.png'),
            t('changelog.2_2_8.fix.text_3', {
              f1: t('common.appfunc.recomm_process'),
              f2: t('preference.processes_craftable_item_sortby.title'),
              f3: t('preference.processes_craftable_item_sortby.option.crafting_log')
            }) + '<br> ※ ' + t('changelog.2_2_8.fix.text_4') + t('changelog.2_2_8.fix.text_5')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_2_8.feat.text_1'),
            t('changelog.2_0_10.feat.text_2', '7.3')
              + '<br> ※ '
              + t('changelog.2_0_10.feat.text_3'),
          ]
        }
      ]
    },
    {
      version: '2.2.7',
      date: '2025-07-07',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_2_7.fix.text_1') + ' <i>(Found by Small-Dianer)</i>',
            t('changelog.2_2_7.fix.text_4'),
            t('changelog.2_2_7.fix.text_2'),
            t('changelog.2_2_7.fix.text_5'),
            t('changelog.2_2_7.fix.text_3'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_2_7.feat.text_1')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/07/05/6868ee62a8487.png'),
            t('changelog.2_2_7.feat.text_2'),
            t('changelog.2_2_7.feat.text_3')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/07/05/6868eec16b46b.png')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/07/05/6868eeef3af65.png'),
          ]
        }
      ]
    },
    {
      version: '2.2.6',
      date: '2025-06-24',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.chs_db_update', {
              ver: '7.2'
            }),
            t('changelog.2_2_6.breaking.text_1')
              + '<br>' + t('changelog.2_2_6.breaking.text_2')
              + '<br>※ ' + t('changelog.2_2_6.breaking.text_3')
              + '<br>※ ' + t('changelog.2_2_6.breaking.text_4')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/06/20/6855000d829df.png'),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_2_6.fix.text_1'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_12.feat.text_5', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appsetting.enhancement'),
              f3: t('preference.item_pop_craft_show_crystals.title')
            })
              + '<br>' + t('preference.item_pop_craft_show_crystals.desc.desc_1')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/06/20/68550174d1113.png'),
            t('changelog.2_2_6.feat.text_1')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/06/20/685501d6210d6.png'),
            t('changelog.2_2_6.feat.text_2')
          ]
        }
      ]
    },
    {
      version: '2.2.5',
      date: '2025-06-12',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_2_5.breaking.text_1')
              + '<br>' + t('changelog.2_2_5.breaking.text_2')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/06/11/68492f5d0871d.png'),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_2_5.fix.text_1'),
            t('changelog.2_2_5.fix.text_2'),
            t('changelog.2_2_5.fix.text_3'),
            t('changelog.2_2_5.fix.text_4'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_2_5.feat.text_1')
              + '<br>※ ' + t('changelog.2_2_5.feat.text_2')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/06/11/68493927bca72.png'),
            t('changelog.2_2_5.feat.text_3')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/06/11/6849329ac15b9.png'),
            t('changelog.2_2_5.feat.text_4', {
              f: t('common.appfunc.useful_tools')
            }) + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/06/11/684931b9d7796.png'),
            t('changelog.2_2_5.feat.text_5'),
            t('changelog.2_2_5.feat.text_6'),
            t('changelog.2_2_5.feat.text_7'),
          ]
        }
      ]
    },
    {
      version: '2.2.4',
      date: '2025-05-23',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_2_4.breaking.text_1')
              + (isZh ? '<br><a target="_blank" href="https://docs.qq.com/doc/DY0hFSUREbXhjdk5S">[点击此处查看完整说明和使用教程]</a>' : '')
              + '<br>※ ' + t('changelog.2_2_4.breaking.text_2', {
                f1: t('common.appfunc.user_preference'),
                f2: t('common.appfunc.craft_macro'),
              }) + t('changelog.2_2_4.breaking.text_3', {
                f: t('common.imexport')
              })
            ,
            t('changelog.shared.chs_db_update_with_comma', {
              ver: '7.15'
            }) +  t('changelog.shared.global_db_update', {
              ver: '7.21'
            })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_2_4.fix.text_1'),
            t('changelog.2_2_4.fix.text_2'),
            t('changelog.2_2_4.fix.text_3'),
            t('changelog.2_2_4.fix.text_4'),
            t('changelog.2_2_3.fix.text_1')
              + '<br>※ ' + t('changelog.2_2_4.fix.text_5'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_2_4.feat.text_1')
              + '<br>※ ' + t('changelog.2_2_4.feat.text_2')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/05/21/682d9eae36aae.png'),
            t('changelog.2_0_12.feat.text_5', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appfunc.craft_statement'),
              f3: t('preference.statement_ignore_crystals.title')
            }),
            t('changelog.2_2_4.feat.text_5')
              + '<br>※ ' + t('changelog.2_2_4.feat.text_6', {
                f1: t('common.appfunc.user_preference'),
                f2: t('common.appfunc.craft_statement'),
                f3: t('preference.statement_no_highlights.title')
              })
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/05/21/682d9f225fe9d.png'),
            t('changelog.2_2_4.feat.text_3')
              + '<br>※ ' + t('changelog.2_2_4.feat.text_4')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/05/21/682d9f462e211.png'),
          ]
        }
      ]
    },
    {
      version: '2.2.3',
      date: '2025-05-01',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_2_3.breaking.text_1')
              + '<br>' + t('changelog.2_2_3.breaking.text_2')
              + '<br>' + t('changelog.2_2_3.breaking.text_3')
              + '<br><span class="text-[orangered]">※ ' + t('donate_us.desc.desc_5') + '</span>'
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/04/30/6811e7604ed1e.png')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/04/30/6811e7a50b146.png'),
            t('changelog.2_2_3.breaking.text_4')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/04/30/6811e7f37662e.png'),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_2_3.fix.text_1'),
            t('changelog.2_2_3.fix.text_2'),
            t('changelog.2_2_3.fix.text_3'),
            t('changelog.2_2_3.fix.text_4', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appsetting.general'),
              f3: t('common.server')
            }) + '<br>' + t('changelog.2_2_3.fix.text_5'),
            t('changelog.2_2_3.fix.text_6'),
            t('changelog.2_2_3.fix.text_7'),
            t('changelog.2_2_3.fix.text_8'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            isZh ? (
              '更新了桌面端顶部菜单项“参考资料”的推荐攻略/工具列表 (仅在界面语言设置为简体中文时显示)。'
              + '<br>※ ' + '因作者弃坑，“自撰攻略”栏目移除。相应的，各子菜单的文本进行调整。'
            ) : '',
            t('changelog.2_2_3.feat.text_1')
              + '<br>※ ' + t('changelog.2_2_3.feat.text_2')
              + '<br>' + renderImg('http://lsky.nbb.fan/i/2025/04/30/6811e6aeb8dda.png'),
            t('changelog.2_2_3.feat.text_3'),
            t('changelog.2_2_3.feat.text_4')
              + '<br>' +  renderImg('http://lsky.nbb.fan/i/2025/04/29/68108e10c8065.png'),
            t('changelog.2_2_3.feat.text_5')
              + '<br>' +  renderImg('http://lsky.nbb.fan/i/2025/04/30/6811e844191a3.png'),
            t('changelog.2_2_3.feat.text_6'),
            t('changelog.2_2_3.feat.text_7'),
            t('changelog.2_2_3.feat.text_8'),
          ]
        }
      ]
    },
    {
      version: '2.2.2',
      date: '2025-04-01',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            isZh ? '修订了一部分道具的中文译名/描述。' : '',
            t('changelog.2_2_2.fix.text_1'),
            t('changelog.2_2_2.fix.text_2'),
            t('changelog.2_2_2.fix.text_3'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_2_2.feat.text_5'),
            t('changelog.2_0_12.feat.text_5', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appsetting.enhancement'),
              f3: t('preference.item_amount_use_comma.title')
            }),
            t('changelog.2_2_2.feat.text_1') + tipper + t('changelog.2_2_2.feat.text_2'),
            t('changelog.2_2_2.feat.text_3'),
            t('changelog.2_2_2.feat.text_4'),
          ]
        }
      ]
    },
    {
      version: '2.2.1',
      date: '2025-03-26',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_2_1.fix.text_1')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_2_1.feat.text_1', '7.2'),
            isZh ? '追加和修订了部分物品的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
          ]
        }
      ]
    },
    {
      version: '2.2.0',
      date: '2025-03-26',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.global_db_update', {
              ver: '7.2'
            })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_2_0.fix.text_1'),
            t('changelog.2_2_0.fix.text_2'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_2_0.feat.text_1'),
            t('changelog.2_2_0.feat.text_2'),
            t('changelog.2_2_0.feat.text_3'),
            t('changelog.2_2_0.feat.text_4'),
          ]
        }
      ]
    },
    {
      version: '2.1.10',
      date: '2025-03-11',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.chs_db_update_with_comma', {
              ver: '7.11'
            }) +  t('changelog.shared.global_db_update', {
              ver: '7.18'
            })
              + '<br> ※ ' + t('changelog.2_1_2.breaking.text_1'),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_1_10.fix.text_1'),
            t('changelog.2_1_10.fix.text_2'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_10.feat.text_1'),
            t('changelog.2_1_10.feat.text_2'),
            t('changelog.2_0_10.feat.text_2', '7.2')
              + '<br> ※ '
              + t('changelog.2_0_10.feat.text_3'),
            t('changelog.2_1_10.feat.text_3', t('common.appfunc.changelog'))
          ]
        }
      ]
    },
    {
      version: '2.1.9',
      date: '2025-02-27',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_1_9.fix.text_1') + ' <i>(Found by Contt99)</i>',
            t('changelog.2_1_9.fix.text_2'),
            t('changelog.2_1_9.fix.text_3'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_9.feat.text_1'),
            t('changelog.2_1_9.feat.text_2'),
            t('changelog.2_1_9.feat.text_3'),
            t('changelog.2_1_9.feat.text_4'),
            t('changelog.2_1_9.feat.text_5'),
            t('changelog.2_1_9.feat.text_6', t('gather_clock.export_alarm_macro.title')),
          ]
        }
      ]
    },
    {
      version: '2.1.8',
      date: '2025-02-18',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.chs_db_update', {
              ver: '7.1'
            }),
            t('changelog.shared.add_new_func', t('common.appfunc.workflow'))
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_8.feat.text_1'),
            t('changelog.2_1_8.feat.text_2'),
            t('changelog.2_1_8.feat.text_3'),
            t('changelog.2_1_8.feat.text_4'),
            t('changelog.2_1_4.feat.text_2', {
              f1: t('common.appfunc.user_preference'),
              f2: t('preference.item_list_style.title'),
              f3: t('preference.item_list_style.option.modern')
            }),
          ]
        }
      ]
    },
    {
      version: '2.1.7',
      date: '2025-01-22',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_1_7.breaking.text_1', {
              f1: t('common.appfunc.user_preference'), f2: t('common.appfunc.func_setting'), f3: t('common.appfunc.about_app')
            })
              + '<br>' + emBlock + '* ' + t('changelog.2_1_7.breaking.text_2')
              + '<br>' + emBlock + '* ' + t('changelog.2_1_7.breaking.text_3')
              + '<br>' + emBlock + '* ' + t('changelog.2_1_7.breaking.text_4', {
                f1: t('preference.auto_refresh_after_save.title'),
                f2: t('preference.universalis_showpriceinpop.title'),
                f3: t('preference.universalis_poppricetypes.title'),
                f4: t('preference.processes_merge_gatherings.title')
              })
              + '<br>' + emBlock + '* ' + t('changelog.2_1_7.breaking.text_5', t('common.appfunc.about_app'))
              + '<br> ※ ' + t('changelog.2_1_7.breaking.text_6')
            ,
            t('changelog.2_1_7.breaking.text_7')
              + tipper + t('changelog.2_1_7.breaking.text_8', t('preference.universalis_showpriceinpop.title'))
              + tipper + t('changelog.2_1_7.breaking.text_9'),
            t('changelog.2_0_6.feat.text_4', {
              f: t('statistics.group.cost_and_benefit.title')
            })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_1_7.fix.text_1')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_7.feat.text_1'),
            t('changelog.2_1_7.feat.text_2', t('statistics.group.cost_and_benefit.title')),
            t('changelog.2_1_7.feat.text_3'),
            t('changelog.2_1_7.feat.text_4'),
            t('changelog.2_1_7.feat.text_5')
          ]
        }
      ]
    },
    {
      version: '2.1.6',
      date: '2024-12-26',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_1_6.fix.text_1'),
            t('changelog.2_1_6.fix.text_2'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_6.feat.text_1')
              + tipper + t('changelog.2_1_6.feat.text_2'),
            t('changelog.2_1_6.feat.text_3')
              + tipper + t('changelog.2_1_6.feat.text_4')
          ]
        }
      ]
    },
    {
      version: '2.1.5',
      date: '2024-12-23',
      changes: [
        {
          name: groupName.milestone,
          changes: [
            t('changelog.2_1_5.milestone.text_1')
          ]
        },
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_1_5.breaking.text_1')
              + '<br>' + t('changelog.2_1_5.breaking.text_2'),
            t('changelog.2_1_5.breaking.text_3')
              + '<br>' + t('changelog.2_1_5.breaking.text_4'),
            t('changelog.2_1_5.breaking.text_5')
              + '<br> ※ ' + t('changelog.2_1_5.breaking.text_6')
              + '<br> ※ ' + t('changelog.2_1_5.breaking.text_7'),
            t('changelog.shared.global_db_update', {
              ver: '7.15'
            })
              + '<br> ※ ' + t('changelog.2_1_2.breaking.text_1'),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_1_5.fix.text_1')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_5.feat.text_1'),
            t('changelog.2_1_5.feat.text_2'),
            isZh ? '推荐攻略增加了全战职开荒/毕业配装 (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.2_1_5.feat.text_3')
          ]
        }
      ]
    },
    {
      version: '2.1.4',
      date: '2024-12-04',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_1_4.breaking.text_1')
              + '<br>' + t('changelog.2_1_4.breaking.text_2'),
            t('changelog.2_1_4.breaking.text_3')
              + '<br>' + emBlock + '* ' + t('changelog.2_1_4.breaking.text_4', {
                f: t('statistics.group.other_materials.title')
              })
              + '<br>' + emBlock + '* ' + t('changelog.2_1_4.breaking.text_5')
              + '<br>' + emBlock + '* ' + t('changelog.2_1_4.breaking.text_6', {
                f1: t('ft_helper.option.hide_precraft_materials'),
                f2: t('statistics.preference.show_direct_materials_only'),
                f3: t('statistics.group.precrafts')
              })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_1_4.fix.text_1'),
            t('changelog.2_1_4.fix.text_2', {
              f: t('common.open_in.angler')
            }),
            t('changelog.2_1_4.fix.text_3'),
            t('changelog.2_1_4.fix.text_4'),
            t('changelog.2_1_4.fix.text_5'),
            t('changelog.2_1_4.fix.text_6')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_4.feat.text_1'),
            t('changelog.2_1_4.feat.text_2', {
              f1: t('common.appfunc.user_preference'),
              f2: t('preference.item_list_style.title'),
              f3: t('preference.item_list_style.option.tight')
            }),
            t('changelog.2_1_4.feat.text_3'),
            isZh ? '追加了部分鱼类的雇员探险笔记 (仅在界面语言设置为简体中文时显示)。' : ''
          ]
        }
      ]
    },
    {
      version: '2.1.2',
      date: '2024-11-27',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.global_db_update', {
              ver: '7.11'
            })
              + '<br> ※ ' + t('changelog.2_1_2.breaking.text_1'),
            t('changelog.shared.released_func', {
              f: t('common.appfunc.food_and_tinc_new_window')
            })
              + '<br> ※ ' + t('changelog.2_1_2.breaking.text_2', {
                ver: 'v5'
              })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_1_2.fix.text_1')
              + '<br> ※ ' + t('changelog.2_1_2.fix.text_2'),
            t('changelog.2_1_2.fix.text_3'),
            t('changelog.2_1_2.fix.text_4'),
            t('changelog.2_1_2.fix.text_5')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_2.feat.text_1', {
              f1: t('common.appfunc.gather_clock'), f2: t('main.select_gear.quick_operate.title')
            }),
            isZh ? '追加了爆发药适用职业的笔记 (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.2_1_2.feat.text_2')
          ]
        }
      ]
    },
    {
      version: '2.1.1',
      date: '2024-11-20',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_1_1.breaking.text_1', t('gather_clock.export_alarm_macro.title')),
            t('changelog.2_0_11.breaking.text_1', t('common.list'))
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_1_1.fix.text_1'),
            t('changelog.2_1_1.fix.text_2'),
            t('changelog.2_1_1.fix.text_3'),
            isZh ? '修订了一部分道具译名。' : ''
          ]
        },
        {
          name: groupName.feature,
          changes: [
            isZh ? '更新了桌面端顶部菜单项“参考资料”的推荐攻略/工具列表 (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.2_1_1.feat.text_1'),
            t('changelog.2_1_1.feat.text_2'),
          ]
        }
      ]
    },
    {
      version: '2.1.0',
      date: '2024-11-16',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.global_db_update', {
              ver: '7.1'
            }),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            isZh ? '修复了部分国服7.05已经实装的道具仍会显示物品名为暂译的问题。' : '',
            t('changelog.2_1_0.fix.text_1', {
              f: t('main.select_job.title')
            })
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_1_0.feat.text_1', t('common.appfunc.recomm_process'))
              + '<br>' + t('changelog.2_1_0.feat.text_2')
              + '<br> ※ ' + t('changelog.2_1_0.feat.text_3', {f:t('common.appfunc.recomm_process')}),
            t('changelog.2_1_0.feat.text_4')
          ]
        }
      ]
    },
    {
      version: '2.0.13',
      date: '2024-11-11',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.chs_db_update', {
              ver: '7.05'
            }),
            t('changelog.2_0_13.breaking.text_1', {
              f1: t('gather_clock.preference.mention_way.title'),
              f2: t('gather_clock.preference.mention_way.option.sound')
            })
              + `<br>${emBlock} ※ ` + t('changelog.2_0_13.breaking.text_2') + `<span style="font-size:12px;">(C) SQUARE ENIX <a target="_blank" href="https://jp.finalfantasyxiv.com/lodestone/special/fankit/smartphone_ringtone/">Fan Kit</a></span>`
          ]
        },
        {
          name: groupName.feature,
          changes: [
            isZh ? '向桌面端顶部菜单项“关于”的下属选项中追加了“常见问题” (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.2_0_13.feat.text_1')
              + '<br>' + t('changelog.2_0_13.feat.text_2'),
            t('changelog.2_0_13.feat.text_3', {
              f1: t('item.text.simulate_craft_bestcraft'),
              f2: t('item.text.simulate_craft_teamcraft')
            })
          ]
        }
      ]
    },
    {
      version: '2.0.12',
      date: '2024-11-01',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_0_12.breaking.text_1')
              + '<br>'
              + t('changelog.2_0_12.breaking.text_2', {
                f1: t('gather_clock.text.subscribed'),
                f2: t('gather_clock.preference.title'),
                f3: t('gather_clock.preference.mention_way.title'),
                f4: t('gather_clock.preference.mention_way.option.system_notice')
              })
              + `<br>${emBlock} ※ `
              + t('changelog.2_0_12.breaking.text_3', t('gather_clock.preference.mention_way.title'))
              + `<br>${emBlock} ※ `
              + t('changelog.2_0_12.breaking.text_4')
              + `<br>${emBlock} ※ `
              + t('changelog.2_0_12.breaking.text_5')
              + (isZh ? '<br> 遇到问题时，请先尝试在<a target="_blank" href="https://docs.qq.com/doc/DY3pPZmRGRHpubEFi">常见问题文档</a>中寻找解决方案。' : ''),
            t('changelog.2_0_12.breaking.text_6')
              + '<br>'
              + t('changelog.2_0_12.breaking.text_7')
              + '<br>'
              + t('changelog.2_0_12.breaking.text_8', t('recomm_process.text.show_gather_detail')),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_12.fix.text_1', t('preference.use_traditional_statement.title'))
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_8.feat.text_1', {
              f: t('common.appfunc.gather_clock')
            })
              + '<br>' + emBlock
              + t('changelog.2_0_12.feat.text_1')
              + '<br>' + emBlock
              + t('changelog.2_0_12.feat.text_2')
              + '<br>' + emBlock
              + t('changelog.2_0_12.feat.text_3'),
            t('changelog.2_0_12.feat.text_4'),
            t('changelog.2_0_12.feat.text_5', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appsetting.enhancement'),
              f3: t('preference.item_list_style.title')
            })
              + '<br>' + t('changelog.2_0_12.feat.text_6') + ' <i>(by etnAtker)</i>',
            isZh ? '追加了货币类道具和7.05能工巧匠秘籍的笔记。可以在对应道具的物品按钮悬浮窗中查看 (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.2_0_12.feat.text_7'),
            isZh ? '更新了桌面端顶部菜单项“参考资料”的推荐攻略/工具列表 (仅在界面语言设置为简体中文时显示)。' : '',
            t('changelog.2_0_12.feat.text_8'),
          ]
        }
      ]
    },
    {
      version: '2.0.11',
      date: '2024-10-27',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_0_11.breaking.text_1', {
              f: t('common.appfunc.recomm_process')
            })
              + '<br>'
              + t('changelog.2_0_11.breaking.text_2')
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_11.fix.text_1'),
            t('changelog.2_0_11.fix.text_2'),
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_11.feat.text_1'),
            t('changelog.2_0_10.feat.text_1', t('preference.item_info_icon_click_event.title')),
            t('changelog.2_0_11.feat.text_2')
          ]
        }
      ]
    },
    {
      version: '2.0.10',
      date: '2024-10-24',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_0_10.breaking.text_1', {
              f: t('common.appfunc.craft_statement')
            })
              + '<br>'
              + t('changelog.2_0_10.breaking.text_2')
              + '<br>'
              + t('changelog.2_0_10.breaking.text_3')
              + '<br>'
              + t('changelog.2_0_10.breaking.text_4', t('common.view_statement'))
              + '<br> ※ '
              + t('changelog.2_0_10.breaking.text_5', {
                f1: t('common.appfunc.user_preference'),
                f2: t('common.appsetting.enhancement'),
                f3: t('preference.use_traditional_statement.title')
              })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_10.fix.text_1'),
            t('changelog.2_0_8.fix.text_2')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            isZh
              ? '追加了灵砂鱼的采集信息。<br>相关资料来自<a target="_blank" href="https://bbs.nga.cn/read.php?tid=41277468">7.0灵砂鱼和工票鱼信息整理和钓法 by plas_g</a><br> ※ 仅限在“界面语言”设置为简体中文时可以查看。'
              : '',
            t('changelog.2_0_10.feat.text_1', t('preference.click_to_show_pop_in_span.title')),
            t('changelog.2_0_10.feat.text_2', '7.1')
              + '<br> ※ '
              + t('changelog.2_0_10.feat.text_3'),
            t('changelog.2_0_10.feat.text_4')
          ]
        }
      ]
    },
    {
      version: '2.0.9',
      date: '2024-10-22',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.chs_db_update', {
              ver: '7.01'
            })
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_9.feat.text_1', {
              f1: t('common.appfunc.user_preference'),
              f2: t('common.appsetting.appearance')
            }),
            t('changelog.2_0_9.feat.text_2', {
              f: t('common.appfunc.gather_clock')
            })
          ]
        }
      ]
    },
    {
      version: '2.0.8',
      date: '2024-10-18',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.2_0_8.breaking.text_1')
              + '<br>'
              + t('changelog.2_0_8.breaking.text_2')
              + '<br>'
              + t('changelog.2_0_8.breaking.text_3', {
                f: t('map.text.open_in.ffcafe')
              })
              + '<br> ※ '
              + t('changelog.2_0_8.breaking.text_4')
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_8.fix.text_1', {
              f: t('statistics.group.cost_and_benefit.title')
            }),
            t('changelog.2_0_8.fix.text_2')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_8.feat.text_1', {
              f: t('common.appfunc.gather_clock')
            })
              + '<br>' + emBlock
              + t('changelog.2_0_8.feat.text_2')
              + '<br>' + emBlock
              + t('changelog.2_0_8.feat.text_3')
              + '<br>' + emBlock
              + t('changelog.2_0_8.feat.text_4')
              + '<br>' + emBlock
              + t('changelog.2_0_8.feat.text_5', t('gather_clock.preference.show_map'))
              + '<br>' + emBlock
              + t('changelog.2_0_8.feat.text_6', t('main.select_gear.quick_operate.title'))
              + '<br>' + emBlock
              + t('changelog.2_0_8.feat.text_7')
              + '<br>' + emBlock
              + t('changelog.2_0_8.feat.text_8')
            ,
            t('changelog.2_0_8.feat.text_9', {
              f1: t('statistics.group.cost_and_benefit.title'),
              f2: t('common.item_price_type'),
              o1: t('preference.universalis_price_type.option.purchase_average.title'),
              o2: t('preference.universalis_price_type.option.market_min.title'),
              o3: t('preference.universalis_price_type.option.market_average.title')
            })
              + '<br>'
              + t('changelog.2_0_8.feat.text_10', {
                f1: t('common.appfunc.user_preference'),
                f2: t('common.special'),
                f3: t('common.item_price_type')
              })
              + '<br> ※ '
              + t('changelog.2_0_8.feat.text_11')
            ,
            t('changelog.2_0_8.feat.text_12')
              + '<br> ※ '
              + t('changelog.2_0_8.feat.text_13')
          ]
        }
      ]
    },
    {
      version: '2.0.7',
      date: '2024-10-14',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.released_func', {
              f: t('statistics.group.cost_and_benefit.title')
            })
              + '<br>※ '
              + t('changelog.shared.require_setting', {
                f1: t('common.appfunc.user_preference'),
                f2: t('common.special')
              })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_7.fix.text_1'),
            t('changelog.2_0_7.fix.text_2', {
              f: t('common.appfunc.fthelper')
            }),
            t('changelog.2_0_7.fix.text_3')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_7.feat.text_1', {
              f: t('common.appfunc.gather_clock'),
              f1: t('gather_clock.preference.pin_gatherable_items'),
              f2: t('gather_clock.preference.disable_item_pop')
            }),
            t('changelog.2_0_7.feat.text_2'),
            isZh ? '根据国服目前的文本更新了部分7.05版本道具的中文暂译。' : '',
            t('changelog.2_0_7.feat.text_3', {
              f: t('common.export_excel')
            }),
            t('changelog.2_0_6.feat.text_7', {
              f1: t('common.appfunc.fthelper'),
              f2: t('ft_helper.select_food_and_tinc')
            }),
            t('changelog.2_0_3.feat.text_3')
          ]
        }
      ]
    },
    {
      version: '2.0.6',
      date: '2024-10-09',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.released_func', {
              f: t('common.export_excel')
            })
              + '<br>'
              + t('changelog.2_0_6.breaking.text_1', {
                f1: t('statistics.view_statistics'),
                f2: t('common.export_excel')
              })
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_6.fix.text_1', {
              f: t('common.view_statement')
            }),
            t('changelog.2_0_6.fix.text_2', {
              f: t('main.select_gear.title')
            }),
            t('changelog.2_0_6.fix.text_3', {
              lang: t('preference.language_ui')
            })
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_6.feat.text_1')
              + '<br>※ '
              + t('changelog.2_0_6.feat.text_2', {
                f: t('common.appfunc.user_preference'),
                f1: t('common.appsetting.appearance'),
                f2: t('preference.hide_collector_icons.title')
              }),
            t('changelog.2_0_6.feat.text_3'),
            t('changelog.2_0_6.feat.text_4', {
              f: t('common.view_statement')
            }),
            t('changelog.2_0_6.feat.text_5')
              + '<br>※ '
              + t('changelog.shared.temp_not_support_mobile'),
            t('changelog.2_0_6.feat.text_6'),
            t('changelog.2_0_6.feat.text_7', {
              f1: t('statistics.view_statistics'),
              f2: t('statistics.group.aethersands')
            }),
            t('changelog.2_0_6.feat.text_8', {
              f: t('common.open_in.gamer_escape')
            }),
            t('changelog.2_0_6.feat.text_9', {
              f: t('common.back_to_index')
            }),
            t('changelog.2_0_3.feat.text_3')
          ]
        }
      ]
    },
    {
      version: '2.0.5',
      date: '2024-09-29',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            isZh ? '修正地名与物品类型的中文文本未更新7.0国服译名的问题。' : '',
            t('changelog.2_0_5.fix.text_1')
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_5.feat.text_1', {
              f: t('main.select_gear.title')
            })
          ]
        }
      ]
    },
    {
      version: '2.0.4',
      date: '2024-09-26',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.chs_db_update', {
              ver: '7.0'
            }),
            t('changelog.2_0_4.breaking.text_1'),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_4.fix.text_1', {
              lang: t('preference.language_ui')
            })
          ]
        },
        {
          name: groupName.feature,
          changes: [
            isZh ? '增加了“参考资料”菜单项 (仅在界面语言设置为简体中文的电脑上会显示)。' : '',
            t('changelog.2_0_4.feat.text_1'),
            t('changelog.2_0_4.feat.text_2', {
              f: t('common.appfunc.craft_statement')
            }),
            t('changelog.2_0_4.feat.text_3'),
            t('changelog.2_0_4.feat.text_4'),
            t('changelog.2_0_3.feat.text_3')
          ]
        }
      ]
    },
    {
      version: '2.0.3',
      date: '2024-09-17',
      changes: [
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_3.fix.text_1', {
              f1: t('common.appfunc.gather_clock'), f2: t('common.favorite.title')
            }),
            t('changelog.2_0_3.fix.text_2', {
              f: t('common.appfunc.changelog')
            }),
            t('changelog.2_0_3.fix.text_3', {
              lang: t('preference.language_ui'),
              f: t('common.appfunc.changelog')
            })
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_3.feat.text_1'),
            t('changelog.2_0_3.feat.text_2', {
              f1: t('common.appfunc.gather_clock'), f2: t('common.favorite.title')
            }),
            t('changelog.2_0_3.feat.text_3')
          ]
        }
      ]
    },
    {
      version: '2.0.2',
      date: '2024-09-11',
      changes: [
        {
          name: groupName.breaking,
          changes: [
            t('changelog.shared.released_func', {
              f: t('common.appfunc.gather_clock')
            }),
            t('changelog.shared.released_func', {
              f: t('common.appfunc.changelog')
            }),
          ]
        },
        {
          name: groupName.bugfix,
          changes: [
            t('changelog.2_0_2.fix.text_1'),
            t('changelog.2_0_2.fix.text_2'),
            t('changelog.2_0_2.fix.text_3'),
            t('changelog.2_0_2.fix.text_4', t('changelog.2_0_2.fix.text_5')),
            isZh ? '修正了部分道具的中文译名。' : ''
          ]
        },
        {
          name: groupName.feature,
          changes: [
            t('changelog.2_0_2.feat.text_1'),
            t('changelog.2_0_2.feat.text_2'),
            isZh ? '根据国服7.0特设站公布的新消息更新了职业名。' : '',
            t('changelog.2_0_2.feat.text_3'),
            t('changelog.2_0_2.feat.text_4')
          ]
        }
      ]
    },
    {
      version: '2.0.0',
      date: '2024-09-01',
      important: true,
      changes: [
        {
          name: groupName.milestone,
          changes: [
            t('changelog.2_0_0.milestone.text_1')
          ]
        }
      ]
    }
  ] as PatchNote[]
}