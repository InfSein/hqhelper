<script setup lang="ts">
import {
  AllInclusiveSharp,
  ArchiveSharp,
  AttachMoneyOutlined,
  CodeSharp,
  ColorLensRound,
  DiscountOutlined,
  InfoOutlined,
  MemoryRound,
  SaveOutlined,
  SettingsSharp,
  SettingsSuggestFilled,
  TableViewOutlined,
  TravelExploreRound,
  TrendingUpRound,
  UnarchiveSharp,
  UpdateRound,
} from '@vicons/material'
import AboutApp from '@/components/app/AboutApp.vue'
import SettingItem from '@/components/ui/SettingItem.vue'
import ModalPreferencesImportExport from './ModalPreferencesImportExport.vue'
import { useStore } from '@/store/index'
import { useLocale } from '@/composables/useLocale'
import { useDialog } from '@/composables/useDialog'
import useUiTools from '@/composables/useUiTools'
import { useResponsive } from '@/composables/useResponsive'
import { deepCopy } from '@/tools'
import type { PreferenceGroup, SettingGroupKey } from '@/types/index'
import { fixFuncConfig, type FuncConfigModel } from '@/types/config/func'
import { fixUserConfig, type UserConfigModel } from '@/types/config/user'
import { fixWorkState as fixMmHelperWorkState } from '@/types/workstate/mmhelper'
import { fixWorkState as fixWorkflowWorkState } from '@/types/workstate/workflow'
import { fixWorkState as fixHqwbWorkState } from '@/types/workstate/hqworkbench'
import { fixWorkState as fixGatherclockWorkState } from '@/types/workstate/gatherclock'
import { dbKey } from '@/utils/app.idb'

const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})

const store = useStore()
const { t } = useLocale()
const { confirm } = useDialog()
const { renderIcon } = useUiTools()
const { isMobile } = useResponsive()
const NAIVE_UI_MESSAGE = useMessage()

const showModal = defineModel<boolean>('show', { required: true })
const emit = defineEmits(['close', 'afterSubmit'])
interface ModalPreferencesProps {
  settingGroup?: SettingGroupKey
  /** (仅限APP使用) 仅展示偏好设置项目 */
  appShowUp?: boolean
  /** (仅限APP使用) 仅展示功能设置项目 */
  appShowFp?: boolean
}
const props = defineProps<ModalPreferencesProps>()

// #region data
const dealSimOptions = (options: string[]) => {
  return options.map(option => {
    return {
      label: option,
      value: option
    }
  })
}
const getPriceTypeOptions = () => {
  return [
    { value: 'averagePrice', label: t('preference.universalis_price_type.option.average') },
    { value: 'currentAveragePrice', label: t('preference.universalis_price_type.option.curr_average') },
    { value: 'minPrice', label: t('preference.universalis_price_type.option.min') },
    { value: 'maxPrice', label: t('preference.universalis_price_type.option.max') },
    { value: 'purchasePrice', label: t('preference.universalis_price_type.option.purchase_average.title'), description: t('preference.universalis_price_type.option.purchase_average.tooltip.tooltip_1') },
    { value: 'marketLowestPrice', label: t('preference.universalis_price_type.option.market_min.title'), description: t('preference.universalis_price_type.option.market_min.tooltip.tooltip_1') },
    { value: 'marketPrice', label: t('preference.universalis_price_type.option.market_average.title'), description: t('preference.universalis_price_type.option.market_average.tooltip.tooltip_1') }
  ]
}
const preferenceGroups = computed(() : PreferenceGroup[] => {
  return [
    {
      key: 'userConfig',
      text: t('common.appsetting.basic_setting'),
      settings: [
        /* General */
        {
          key: 'general',
          icon: TravelExploreRound,
          text: t('common.appsetting.general'),
          children: [
            {
              key: 'language_ui',
              label: t('preference.language_ui'),
              type: 'radio-group',
              options: [
                { value: 'zh', label: '简体中文' },
                { value: 'en', label: 'English' },
                { value: 'ja', label: '日本語' }
              ],
            },
            {
              key: 'language_item',
              label: t('preference.language_item.title'),
              descriptions: [
                t('preference.language_item.desc.desc_1'),
                t('preference.language_item.desc.desc_2'),
              ],
              type: 'radio-group',
              options: [
                { value: 'auto', label: t('common.auto') },
                { value: 'zh', label: '简体中文' },
                { value: 'en', label: 'English' },
                { value: 'ja', label: '日本語' }
              ],
            },
            {
              key: 'action_after_savesettings',
              label: t('preference.auto_refresh_after_save.title'),
              warnings: [
                t('preference.auto_refresh_after_save.desc.desc_1')
              ],
              type: 'radio-group',
              options: [
                { value: 'ask', label: t('common.ask_every_time') },
                { value: 'reload', label: t('common.auto_refresh') },
                { value: 'none', label: t('common.dont_refresh') }
              ]
            }
          ]
        },
        /* Appearance */
        {
          key: 'appearance',
          icon: ColorLensRound,
          text: t('common.appsetting.appearance'),
          children: [
            {
              key: 'theme',
              label: t('preference.theme.title'),
              type: 'radio-group',
              options: [
                { value: 'system', label: t('preference.theme.option.follow_system') },
                { value: 'light', label: t('preference.theme.option.light') },
                { value: 'dark', label: t('preference.theme.option.dark') }
              ]
            },
            {
              key: 'custom_background',
              label: t('preference.custom_background.title'),
              warnings: [
                t('preference.custom_background.desc.desc_1'),
                t('preference.custom_background.desc.desc_2'),
                {
                  value: t('preference.custom_background.desc.desc_3'),
                  class: 'text-sub font-small',
                },
              ],
              type: 'image-select',
              options: [
                { value: '', label: t('preference.custom_background.option.no_background') },
                ...(isMobile.value
                  ? []
                  : [
                    { value: 'https://fu5.web.sdo.com/10036/202511/17624187245354.jpg' },
                    { value: 'https://fu5.web.sdo.com/10036/202511/17621672273734.jpg' },
                    { value: 'https://fu5.web.sdo.com/10036/202511/17621669788001.jpg' },
                  ]
                )
              ],
              custom: {
                allow: true,
                key: dbKey.appBackground,
              }
            },
            {
              key: 'custom_font_size',
              label: t('preference.custom_font_size.title'),
              descriptions: [
                t('preference.custom_font_size.desc.desc_1'),
                t('preference.custom_font_size.desc.desc_2'),
                t('preference.custom_font_size.desc.desc_3'),
              ],
              type: 'radio-group',
              options: [
                { value: '12px', label: t('preference.custom_font_size.option.tiny') },
                { value: '13px', label: t('preference.custom_font_size.option.small') },
                { value: '14px', label: t('preference.custom_font_size.option.medium') },
                { value: '15px', label: t('preference.custom_font_size.option.big') },
                { value: '16px', label: t('preference.custom_font_size.option.large') },
              ],
            },
            {
              key: 'custom_font',
              label: t('preference.custom_font.title'),
              descriptions: [
                t('preference.custom_font.desc.desc_1'),
                t('preference.custom_font.desc.desc_2'),
                t('preference.custom_font.desc.desc_3'),
                t('preference.custom_font.desc.desc_4'),
              ],
              type: 'string',
            },
            {
              key: 'hide_collector_icons',
              label: t('preference.hide_collector_icons.title'),
              descriptions: [
                t('preference.hide_collector_icons.desc.desc_1'),
                t('preference.hide_collector_icons.desc.desc_2'),
                t('preference.hide_collector_icons.desc.desc_3'),
              ],
              type: 'switch'
            },
          ]
        },
        /* Enhancements */
        {
          key: 'enhancements',
          icon: TrendingUpRound,
          text: t('common.appsetting.enhancement'),
          children: [
            {
              key: 'disable_patchcard_autofold',
              label: t('preference.disable_patchcard_autofold.title'),
              hide: !isMobile.value,
              descriptions: [
                t('preference.disable_patchcard_autofold.desc.desc_1'),
                t('preference.disable_patchcard_autofold.desc.desc_2'),
              ],
              type: 'switch'
            },
            {
              key: 'disable_jobbtn_doubleclick',
              label: t('preference.disable_jobbtn_doubleclick.title'),
              descriptions: [
                t('preference.disable_jobbtn_doubleclick.desc.desc_1'),
                t('preference.disable_jobbtn_doubleclick.desc.desc_2'),
              ],
              type: 'switch'
            },
            {
              key: 'split_quick_operate_options_main_off',
              label: t('preference.split_quick_operate_options_main_off.title'),
              descriptions: [
                t('preference.split_quick_operate_options_main_off.desc.desc_1'),
                t('preference.split_quick_operate_options_main_off.desc.desc_2'),
              ],
              type: 'switch'
            },
            {
              key: 'item_pop_craft_show_crystals',
              label: t('preference.item_pop_craft_show_crystals.title'),
              hide: isMobile.value,
              descriptions: [
                t('preference.item_pop_craft_show_crystals.desc.desc_1'),
              ],
              type: 'switch'
            },
            {
              key: 'click_to_show_pop_in_span',
              label: t('preference.click_to_show_pop_in_span.title'),
              hide: isMobile.value,
              descriptions: [
                t('preference.click_to_show_pop_in_span.desc.desc_1'),
                t('preference.click_to_show_pop_in_span.desc.desc_2'),
              ],
              type: 'switch'
            },
            {
              key: 'item_amount_use_comma',
              label: t('preference.item_amount_use_comma.title'),
              descriptions: [
                t('preference.item_amount_use_comma.desc.desc_1'),
                t('preference.item_amount_use_comma.desc.desc_2'),
              ],
              type: 'switch',
            },
            {
              key: 'item_button_click_event',
              label: t('preference.item_button_click_event'),
              type: 'select',
              options: [
                { value: 'none', label: t('preference.shared.option.donothing') },
                { value: 'copy_name', label: t('preference.shared.option.copy_item_name') },
                { value: 'copy_isearch', label: t('preference.shared.option.copy_isearch_macro') },
              ]
            },
            {
              key: 'item_info_icon_click_event',
              label: t('preference.item_info_icon_click_event.title'),
              descriptions: [
                t('preference.item_info_icon_click_event.desc.desc_1'),
                t('preference.item_info_icon_click_event.desc.desc_2', t('preference.click_to_show_pop_in_span.title')),
              ],
              type: 'select',
              options: [
                { value: 'none', label: t('preference.shared.option.donothing') },
                { value: 'copy_name', label: t('preference.shared.option.copy_item_name') },
                { value: 'copy_isearch', label: t('preference.shared.option.copy_isearch_macro') },
              ]
            },
            {
              key: 'item_list_style',
              label: t('preference.item_list_style.title'),
              descriptions: [
                t('preference.item_list_style.desc.desc_1'),
                t('preference.item_list_style.desc.desc_2'),
              ],
              type: 'select',
              options: [
                { value: 'standard', label: t('preference.item_list_style.option.standard') },
                { value: 'tight', label: t('preference.item_list_style.option.tight') },
                { value: 'modern', label: t('preference.item_list_style.option.modern') },
                { value: 'teamcraft', label: t('preference.item_list_style.option.teamcraft') },
              ]
            },
          ]
        },
        /* Performance */
        {
          key: 'performance',
          icon: MemoryRound,
          text: t('common.appsetting.performance'),
          children: [
            {
              key: 'disable_workstate_cache',
              label: t('preference.disable_workstate_cache.title'),
              descriptions: [
                t('preference.disable_workstate_cache.desc.desc_1'),
                t('preference.disable_workstate_cache.desc.desc_2'),
              ],
              warnings: [
                {
                  value: t('preference.disable_workstate_cache.desc.desc_3'),
                  style: 'color: var(--color-error)',
                }
              ],
              type: 'switch',
              require_reload: true
            },
            {
              key: 'enable_dev_mode',
              label: t('preference.enable_dev_mode'),
              hide: !window.electronAPI?.openDevTools,
              type: 'switch',
              require_reload: true
            }
          ]
        },
        /* Update */
        {
          key: 'update',
          icon: UpdateRound,
          text: t('common.appsetting.update'),
          children: [
            {
              key: 'disable_auto_update',
              label: t('preference.disable_auto_update.title'),
              descriptions: [
                t('preference.disable_auto_update.desc.desc_1'),
                t('preference.disable_auto_update.desc.desc_2'),
                {
                  value: t('preference.disable_auto_update.desc.desc_3'),
                  class: 'color-info',
                }
              ],
              type: 'switch'
            },
            {
              key: 'update_client_builtin.title',
              label: t('preference.update_client_builtin.title'),
              descriptions: [
                t('preference.update_client_builtin.desc.desc_1'),
                t('preference.update_client_builtin.desc.desc_2'),
              ],
              type: 'switch',
              hide: !window.electronAPI?.downloadAndOpen
            },
            {
              key: 'use_custom_proxy',
              label: t('preference.use_custom_proxy'),
              type: 'switch',
              hide: !window.electronAPI
            },
            {
              key: 'custom_proxy_url',
              label: t('preference.custom_proxy_url'),
              type: 'string',
              hide: !window.electronAPI
            }
          ]
        }
      ]
    },
    {
      key: 'funcConfig',
      text: t('common.appfunc.func_setting'),
      settings: [
        /* 复制宏 */
        {
          key: 'copy_macro',
          icon: CodeSharp,
          text: t('common.appfunc.copy_macro'),
          children: [
            {
              key: 'macro_direct_copy',
              label: t('preference.macro_direct_copy.title'),
              descriptions: [
                t('preference.macro_direct_copy.desc.desc_1'),
                t('preference.macro_direct_copy.desc.desc_2'),
              ],
              type: 'switch'
            },
            {
              key: 'macro_copy_prefix',
              label: t('preference.macro_copy_prefix.title'),
              type: 'select',
              options: [
                { value: '', label: t('preference.macro_copy_prefix.option.none') },
                { value: '/e ', label: t('preference.macro_copy_prefix.option.echo') },
                { value: '/p ', label: t('preference.macro_copy_prefix.option.party') },
                { value: '/fc ', label: t('preference.macro_copy_prefix.option.free_company') },
                { value: '/b ', label: t('preference.macro_copy_prefix.option.beginner') },
              ]
            },
            {
              key: 'macro_generate_mode',
              label: t('preference.macro_generate_mode.title'),
              descriptions: [
                t('preference.macro_generate_mode.desc.desc_1'),
                t('preference.macro_generate_mode.desc.desc_2'),
                t('preference.macro_generate_mode.desc.desc_3'),
              ],
              type: 'select',
              options: [
                { value: 'singleLine', label: t('preference.macro_generate_mode.option.single_line') },
                { value: 'multiLine', label: t('preference.macro_generate_mode.option.multi_line') },
              ]
            },
          ]
        },
        /* 生产宏 */
        {
          key: 'craft_macro',
          icon: DiscountOutlined,
          text: t('common.appfunc.craft_macro'),
          children: [
            {
              key: 'cmacro_use_macrolock',
              label: t('preference.cmacro_use_macrolock.title'),
              descriptions: [
                t('preference.cmacro_use_macrolock.desc.desc_1'),
              ],
              type: 'switch'
            },
            {
              key: 'cmacro_remove_quotes',
              label: t('preference.cmacro_remove_quotes.title'),
              descriptions: [
                t('preference.cmacro_remove_quotes.desc.desc_1'),
              ],
              type: 'switch'
            },
            {
              key: 'cmacro_transition_tipper_content',
              label: t('preference.cmacro_transition_tipper_content.title'),
              descriptions: [
                t('preference.cmacro_transition_tipper_content.desc.desc_1'),
                t('preference.cmacro_transition_tipper_content.desc.desc_2'),
                t('preference.shared.desc.use_default_val_when_empty', '/e Macro #~INDEX completed. <se.1>'),
              ],
              type: 'string',
              placeholder: '/e Macro #~INDEX completed. <se.1>',
            },
            {
              key: 'cmacro_end_tipper_content',
              label: t('preference.cmacro_end_tipper_content'),
              descriptions: [
                t('preference.shared.desc.use_default_val_when_empty', '/e Craft done! <se.14>'),
              ],
              type: 'string',
              placeholder: '/e Craft done! <se.14>',
            },
          ]
        },
        /* 制作报表 */
        {
          key: 'craft_statement',
          icon: TableViewOutlined,
          text: t('common.appfunc.craft_statement'),
          children: [
            {
              key: 'use_traditional_statement',
              label: t('preference.use_traditional_statement.title'),
              descriptions: [
                t('preference.use_traditional_statement.desc.desc_1'),
                t('preference.use_traditional_statement.desc.desc_2'),
              ],
              type: 'switch',
              require_reload: true
            },
            {
              key: 'statement_ignore_crystals',
              label: t('preference.statement_ignore_crystals.title'),
              descriptions: [
                t('preference.statement_ignore_crystals.desc.desc_1'),
              ],
              warnings: [
                t('preference.statement_ignore_crystals.desc.desc_2', t('statistics.group.cost_and_benefit.title')),
              ],
              type: 'switch'
            },
            {
              key: 'statement_no_highlights',
              label: t('preference.statement_no_highlights.title'),
              descriptions: [
                t('preference.statement_no_highlights.desc.desc_1'),
                t('preference.statement_no_highlights.desc.desc_2'),
              ],
              type: 'switch'
            },
            {
              key: 'prostate_concise_mode',
              label: t('preference.prostate_concise_mode.title'),
              descriptions: [
                t('preference.prostate_concise_mode.desc.desc_1')
              ],
              type: 'switch'
            }
          ]
        },
        /* 推荐流程 */
        {
          key: 'recomm_process',
          icon: AllInclusiveSharp,
          text: t('common.appfunc.recomm_process'),
          children: [
            {
              key: 'processes_show_item_details',
              label: t('preference.processes_show_item_details'),
              type: 'switch'
            },
            {
              key: 'processes_merge_gatherings',
              label: t('preference.processes_merge_gatherings.title'),
              type: 'switch',
              descriptions: [
                t('preference.processes_merge_gatherings.desc.desc_1'),
                t('preference.processes_merge_gatherings.desc.desc_2'),
              ],
            },
            {
              key: 'processes_craftable_item_sortby',
              label: t('preference.processes_craftable_item_sortby.title'),
              type: 'select',
              options: [
                { value: 'itemId', label: t('game.item_id') },
                { value: 'recipeOrder', label: t('preference.processes_craftable_item_sortby.option.crafting_log') },
                { value: 'recipeOrderSearch', label: t('preference.processes_craftable_item_sortby.option.crafting_log_search') },
              ],
              descriptions: [
                t('preference.processes_craftable_item_sortby.desc.desc_1'),
                t('preference.processes_craftable_item_sortby.desc.desc_2'),
              ],
            }
          ]
        },
        /* 物品价格 */
        {
          key: 'cost_benefit',
          icon: AttachMoneyOutlined,
          text: t('common.appfunc.item_price'),
          children: [
            {
              key: 'universalis_server',
              label: t('common.server'),
              descriptions: [
                t('preference.shared.desc.fit_to_func_and_item_pop_price', t('statistics.group.cost_and_benefit.title')),
                t('preference.universalis_server.desc.desc_1'),
              ],
              warnings: [
                {
                  value: t('preference.universalis_server.desc.desc_2'),
                  style: 'color: var(--color-error)',
                }
              ],
              type: 'cascader',
              options: [
              {
                  value: 'chs',
                  label: '中国',
                  children: [
                    {
                      value: 'g_陆行鸟',
                      label: '陆行鸟',
                      children: dealSimOptions([
                        '陆行鸟',"红玉海","神意之地","拉诺西亚","幻影群岛","萌芽池","宇宙和音","沃仙曦染","晨曦王座"
                      ])
                    },
                    {
                      value: 'g_莫古力',
                      label: '莫古力',
                      children: dealSimOptions([
                        '莫古力',"白银乡","白金幻象","神拳痕","潮风亭","旅人栈桥","拂晓之间","龙巢神殿","梦羽宝境"
                      ])
                    },
                    {
                      value: 'g_猫小胖',
                      label: '猫小胖',
                      children: dealSimOptions([
                        '猫小胖',"紫水栈桥","延夏","静语庄园","摩杜纳","海猫茶屋","柔风海湾","琥珀原"
                      ])
                    },
                    {
                      value: 'g_豆豆柴',
                      label: '豆豆柴',
                      children: dealSimOptions([
                        '豆豆柴',"水晶塔","银泪湖","太阳海岸","伊修加德","红茶川","黄金谷","月牙湾","雪松原"
                      ])
                    },
                    {
                      value: 'g_陸行鳥',
                      label: '陸行鳥(繁中服)',
                      children: dealSimOptions([
                        '陸行鳥',"伊弗利特","迦樓羅","利維坦","鳳凰","奧汀","巴哈姆特","拉姆","泰坦",
                      ])
                    },
                  ]
                },
                {
                  value: 'japan',
                  label: '日本',
                  children: [
                    {
                      value: 'g_Elemental',
                      label: 'Elemental',
                      children: dealSimOptions([
                        'Elemental',"Carbuncle","Kujata","Typhon","Garuda","Atomos","Tonberry","Aegis","Gungnir"
                      ])
                    },
                    {
                      value: 'g_Gaia',
                      label: 'Gaia',
                      children: dealSimOptions([
                        'Gaia',"Alexander","Fenrir","Ultima","Ifrit","Bahamut","Tiamat","Durandal","Ridill"
                      ])
                    },
                    {
                      value: 'g_Mana',
                      label: 'Mana',
                      children: dealSimOptions([
                        'Mana',"Asura","Pandaemonium","Anima","Hades","Ixion","Titan","Chocobo","Masamune"
                      ])
                    },
                    {
                      value: 'g_Meteor',
                      label: 'Meteor',
                      children: dealSimOptions([
                        'Meteor',"Belias","Shinryu","Unicorn","Yojimbo","Zeromus","Valefor","Ramuh","Mandragora"
                      ])
                    }
                  ]
                },
                {
                  value: 'na',
                  label: 'North-America',
                  children: [
                    {
                      value: 'g_Aether',
                      label: 'Aether',
                      children: dealSimOptions([
                        'Aether',"Jenova","Faerie","Siren","Gilgamesh","Midgardsormr","Adamantoise","Cactuar","Sargatanas"
                      ])
                    },
                    {
                      value: 'g_Primal',
                      label: 'Primal',
                      children: dealSimOptions([
                        'Primal',"Famfrit","Exodus","Lamia","Leviathan","Ultros","Behemoth","Excalibur","Hyperion"
                      ])
                    },
                    {
                      value: 'g_Crystal',
                      label: 'Crystal',
                      children: dealSimOptions([
                        'Crystal',"Brynhildr","Mateus","Zalera","Diabolos","Coeurl","Malboro","Goblin","Balmung"
                      ])
                    },
                    {
                      value: 'g_Dynamis',
                      label: 'Dynamis',
                      children: dealSimOptions([
                        'Dynamis',"Marilith","Seraph","Halicarnassus","Maduin","Cuchulainn","Kraken","Rafflesia","Golem"
                      ])
                    }
                  ]
                },
                {
                  value: 'eu',
                  label: 'Europe',
                  children: [
                    {
                      value: 'g_Chaos',
                      label: 'Chaos',
                      children: dealSimOptions([
                        'Chaos',"Omega","Moogle","Cerberus","Louisoix","Spriggan","Ragnarok","Sagittarius","Phantom"
                      ])
                    },
                    {
                      value: 'g_Light',
                      label: 'Light',
                      children: dealSimOptions([
                        'Light',"Twintania","Lich","Zodiark","Phoenix","Odin","Shiva","Alpha","Raiden"
                      ])
                    },
                  ]
                },
                {
                  value: 'ocean',
                  label: 'Oceania',
                  children: [
                    {
                      value: 'g_Materia',
                      label: 'Materia',
                      children: dealSimOptions([
                        'Materia',"Ravana","Bismarck","Sephirot","Sophia","Zurvan"
                      ])
                    },
                  ]
                },
                {
                  value: 'kr',
                  label: '한국',
                  children: [
                    {
                      value: 'g_한국',
                      label: '한국',
                      children: dealSimOptions([
                        '한국',"카벙클","초코보","모그리","톤베리","펜리르"
                      ])
                    },
                  ]
                },
              ],
              require_reload: true
            },
            {
              key: 'universalis_priceType',
              label: t('preference.universalis_price_type.title'),
              descriptions: [
                t('preference.shared.desc.fit_to_func', t('statistics.group.cost_and_benefit.title')),
                t('preference.universalis_price_type.desc.desc_1'),
                {
                  value: t('preference.universalis_price_type.desc.desc_2'),
                  style: 'margin-top: 5px;'
                },
                t('preference.universalis_price_type.desc.desc_3'),
                t('preference.universalis_price_type.desc.desc_4'),
                t('preference.universalis_price_type.desc.desc_5'),
              ],
              type: 'select',
              options: getPriceTypeOptions()
            },
            {
              key: 'universalis_expireTime',
              label: t('preference.universalis_expire_time.title'),
              descriptions: [
                t('preference.shared.desc.fit_to_func_and_item_pop_price', t('statistics.group.cost_and_benefit.title')),
                t('preference.universalis_expire_time.desc.desc_1'),
                t('preference.universalis_expire_time.desc.desc_2'),
              ],
              type: 'select',
              options: [
                {
                  value: 1 * 60 * 60 * 1000,
                  label: t('common.time.val_hours', 1)
                },
                {
                  value: 3 * 60 * 60 * 1000,
                  label: t('common.time.val_hours', 3)
                },
                {
                  value: 6 * 60 * 60 * 1000,
                  label: t('common.time.val_hours', 6)
                },
                {
                  value: 24 * 60 * 60 * 1000,
                  label: t('common.time.val_hours', 24)
                },
                {
                  value: 3 * 24 * 60 * 60 * 1000,
                  label:t('common.time.val_days', 3)
                },
                {
                  value: 7 * 24 * 60 * 60 * 1000,
                  label:t('common.time.val_days', 7)
                },
                {
                  value: 999999999999999,
                  label: t('preference.universalis_expire_time.option.never_expires')
                }
              ]
            },
            {
              key: 'costandbenefit_show_item_details',
              label: t('preference.costandbenefit_show_item_details'),
              type: 'switch'
            },
            {
              key: 'costandbenefit_item_sort_by',
              label: t('preference.costandbenefit_item_sort_by.title'),
              descriptions: [
                t('preference.costandbenefit_item_sort_by.desc.desc_1'),
              ],
              type: 'select',
              options: [
                {
                  value: 'itemId',
                  label: t('game.item_id')
                },
                {
                  value: 'priceAsc',
                  label: t('preference.costandbenefit_item_sort_by.option.price_asc')
                },
                {
                  value: 'priceDesc',
                  label: t('preference.costandbenefit_item_sort_by.option.price_desc')
                },
                {
                  value: 'subTotalAsc',
                  label: t('preference.costandbenefit_item_sort_by.option.subtotal_asc')
                },
                {
                  value: 'subTotalDesc',
                  label: t('preference.costandbenefit_item_sort_by.option.subtotal_desc')
                },
              ]
            },
            {
              key: 'universalis_showpriceinpop',
              label: t('preference.universalis_showpriceinpop.title'),
              descriptions: [
                t('preference.universalis_showpriceinpop.desc.desc_1'),
              ],
              type: 'switch'
            },
            {
              key: 'universalis_poppricetypes',
              label: t('preference.universalis_poppricetypes.title'),
              descriptions: [
                t('preference.universalis_poppricetypes.desc.desc_1'),
              ],
              type: 'select',
              multiple: true,
              options: getPriceTypeOptions()
            }
          ]
        },
      ]
    },
    {
      key: 'about',
      text: t('common.other'),
      settings: [
        {
          key: 'about_app',
          icon: InfoOutlined,
          text: t('common.appfunc.about_app'),
          children: []
        }
      ]
    }
  ]
})
const preferenceMenuOptions = computed(() => {
  return preferenceGroups.value.map(group => {
    return {
      type: 'group',
      key: group.key,
      label: group.text,
      children: group.settings.map(setting => {
        return {
          key: setting.key,
          label: setting.text,
          icon: renderIcon(setting.icon)
        }
      })
    }
  })
})
const appPreferenceTabs = computed(() => {
  let target = preferenceGroups.value.map(group => group.settings).flat()
  if (props.appShowUp) {
    target = preferenceGroups.value[0].settings
  } else if (isMobile.value && props.appShowFp) {
    target = preferenceGroups.value[1].settings
  }
  return target
})
const currentUPSettings = computed(() => {
  return preferenceGroups.value[0].settings.find(setting => setting.key === currentMenuVal.value)?.children ?? []
})
const currentFPSettings = computed(() => {
  return preferenceGroups.value[1].settings.find(setting => setting.key === currentMenuVal.value)?.children ?? []
})
const modalTitle = computed(() => {
  let icon = SettingsSharp
  let text = t('common.appfunc.user_preference')
  if (isMobile.value && props.appShowFp) {
    icon = SettingsSuggestFilled
    text = t('common.appfunc.func_setting')
  }
  return { icon, text }
})
const currentGroupName = computed(() => {
  return preferenceGroups.value.map(group => group.settings).flat().find(setting => setting.key === currentMenuVal.value)?.text ?? ''
})
// #endregion

const currentMenuVal = ref<string>('general')
const formUserConfigData = ref<UserConfigModel>(deepCopy(fixUserConfig(store.userConfig)))
const formFuncConfigData = ref<FuncConfigModel>(deepCopy(fixFuncConfig(store.funcConfig)))

const onLoad = () => {
  if (props.settingGroup) {
    currentMenuVal.value = props.settingGroup
  } else if (props.appShowFp) {
    currentMenuVal.value = 'copy_macro'
  } else {
    currentMenuVal.value = 'general'
  }
  formUserConfigData.value = deepCopy(fixUserConfig(store.userConfig))
  formFuncConfigData.value = deepCopy(fixFuncConfig(store.funcConfig))
}

const handleCheck = () => {
  return ''
}
const handleSave = async () => {
  // * 检查设置合法性
  const checkError = handleCheck()
  if (checkError) {
    NAIVE_UI_MESSAGE.error(checkError); return
  }

  // * 处理偏好设置
  const oldUserConfig = deepCopy(fixUserConfig(store.userConfig))
  formUserConfigData.value.theme ??= 'system'
  formUserConfigData.value.language_ui ??= 'zh'
  formUserConfigData.value.language_item ??= 'auto'
  formUserConfigData.value.disable_workstate_cache ??= false
  if (formUserConfigData.value.disable_workstate_cache) {
    formUserConfigData.value.hqwb_cache_work_state = fixHqwbWorkState()
    formUserConfigData.value.mmhelper_cache_work_state = fixMmHelperWorkState()
    formUserConfigData.value.gatherclock_cache_work_state = fixGatherclockWorkState()
    formUserConfigData.value.workflow_cache_work_state = fixWorkflowWorkState()
  }
  const newUserConfig = fixUserConfig(formUserConfigData.value)
  store.setUserConfig(newUserConfig)

  // * 处理功能设置
  const oldFuncConfig = deepCopy(fixFuncConfig(store.funcConfig))
  if (formFuncConfigData.value.universalis_server !== oldFuncConfig?.universalis_server) {
    formFuncConfigData.value.cache_item_prices = {}
  }
  const newFuncConfig = fixFuncConfig(formFuncConfigData.value)
  store.setFuncConfig(newFuncConfig)

  // * 判断是否需要刷新
  let needReload = false, reloadTimeout = 100
  preferenceGroups.value[0].settings.forEach(setting => {
    setting.children.forEach(item => {
      if (item.require_reload) {
        const key = item.key as keyof UserConfigModel
        if (formUserConfigData.value[key] !== oldUserConfig?.[key]) {
          needReload = true
          if (key === 'language_ui') {
            reloadTimeout = 500
          }
        }
      }
    })
  })
  preferenceGroups.value[1].settings.forEach(setting => {
    setting.children.forEach(item => {
      if (item.require_reload) {
        const key = item.key as keyof FuncConfigModel
        if (formFuncConfigData.value[key] !== oldFuncConfig?.[key]) {
          needReload = true
        }
      }
    })
  })

  // * 处理刷新
  if (needReload) {
    const dealReload = () => {
      setTimeout(() => {
        window.electronAPI?.closeAllChildWindows?.()
        location.reload()
      }, reloadTimeout) // 必须设置一个延迟，不然有些设置不会生效
    }
    const dealTip = () => {
      NAIVE_UI_MESSAGE.success(t('preference.message.save_succeed_but_need_refresh'))
    }
    if (formUserConfigData.value.action_after_savesettings === 'reload') {
      dealReload()
    } else if (formUserConfigData.value.action_after_savesettings === 'none') {
      dealTip()
    } else {
      if (await confirm(
        t('preference.message.saved_but_some_changes_need_refresh')
        + '\n' + t('preference.message.ask_refresh_now')
      )) {
        dealReload()
      } else {
        dealTip()
      }
    }
  } else {
    NAIVE_UI_MESSAGE.success(t('common.save_succeed'))
  }

  // * 结算
  showModal.value = false
  appForceUpdate()
  emit('afterSubmit')
}

// #region 导入/导出设置

const showImportExportModal = ref(false)
const importExportAction = ref<"import" | "export">('import')
const extraHeaderButtons = computed(() => {
  if (props.appShowUp || props.appShowFp) {
    return [] // 为了避免可能的稀奇古怪的 bug
  }
  return [
    {
      icon: ArchiveSharp,
      text: t('common.import'),
      onClick: () => {
        importExportAction.value = 'import'
        showImportExportModal.value = true
      }
    },
    {
      icon: UnarchiveSharp,
      text: t('common.export'),
      onClick: () => {
        importExportAction.value = 'export'
        showImportExportModal.value = true
      }
    }
  ]
})

// #endregion

const pageMaxHeightPx = computed(() => {
  return isMobile.value ? 400 : 535
})
const menuMaxHeight = computed(() => {
  return pageMaxHeightPx.value + 'px'
})
const containerMaxHeight = computed(() => {
  const padding = isMobile.value ? 24 : 28
  return (pageMaxHeightPx.value - padding) + 'px'
})
</script>

<template>
  <MyModal
    v-model:show="showModal"
    max-width="800px"
    :height="isMobile ? '590px' : '670px'"
    header-padding="var(--n-padding-top) var(--n-padding-left) 5px var(--n-padding-left)"
    content-padding="0 var(--n-padding-left) 0 var(--n-padding-left)"
    :extra-header-buttons="extraHeaderButtons"
    @on-load="onLoad"
  >
    <template #header>
      <div class="app-card-title select-none">
        <n-icon :component="modalTitle.icon" />
        <span class="title">{{ modalTitle.text }}</span>
        <span class="description">[{{ currentGroupName }}]</span>
      </div>
    </template>

    <n-layout v-if="!isMobile" has-sider style="background-color: var(--n-color-modal);">
      <n-layout-sider
        v-model:collapsed="formUserConfigData.preference_menu_folded"
        collapse-mode="width"
        :collapsed-width="105"
        :width="180"
        show-trigger="arrow-circle"
        content-style="padding: 24px;"
        bordered
        :native-scrollbar="false"
        :scrollbar-props="{
          trigger: 'none',
          style: {}
        }"
        style="background-color: var(--n-color-modal);"
        :style="{ maxHeight: menuMaxHeight }"
      >
        <n-menu
          v-model:value="currentMenuVal"
          :options="preferenceMenuOptions"
        />
      </n-layout-sider>
      <n-layout-content content-style="padding: 24px;" style="background-color: var(--n-color-modal);">
        <div class="items-container" :style="{ maxHeight: containerMaxHeight }">
          <SettingItem
            v-for="item in currentUPSettings"
            :key="item.key"
            v-model:form-data="formUserConfigData"
            :setting-item="item"
          />
          <SettingItem
            v-for="item in currentFPSettings"
            :key="item.key"
            v-model:form-data="formFuncConfigData"
            :setting-item="item"
          />
          <AboutApp v-if="currentMenuVal === 'about_app'" />
        </div>
      </n-layout-content>
    </n-layout>
    <n-tabs
      v-else
      animated
      type="line"
      placement="top"
      default-value="general"
      style="height: 100%;"
      v-model:value="currentMenuVal"
    >
      <n-tab-pane
        v-for="(group, index) in appPreferenceTabs"
        :key="index"
        :name="group.key"
      >
        <template #tab>
          <div class="tab-title">
            <n-icon :size="20"><component :is="group.icon" /></n-icon>
          </div>
        </template>
        <div class="items-container" :style="{ maxHeight: containerMaxHeight }">
          <SettingItem
            v-for="item in currentUPSettings"
            :key="item.key"
            v-model:form-data="formUserConfigData"
            :setting-item="item"
          />
          <SettingItem
            v-for="item in currentFPSettings"
            :key="item.key"
            v-model:form-data="formFuncConfigData"
            :setting-item="item"
          />
          <AboutApp v-if="currentMenuVal === 'about_app'" />
        </div>
      </n-tab-pane>
    </n-tabs>

    <ModalPreferencesImportExport
      v-model:show="showImportExportModal"
      v-model:user-config="formUserConfigData"
      v-model:func-config="formFuncConfigData"
      :action="importExportAction"
    />

    <template #action>
      <div class="app-modal-footer">
        <n-button type="primary" size="large" @click="handleSave">
          <template #icon>
            <n-icon><SaveOutlined /></n-icon>
          </template>
          {{ t('common.save') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
:deep(.n-scrollbar-content) {
  padding: 5px !important;
}
:deep(.n-menu-item) {
  margin-top: 1px;
  height: 36px;
}
:deep(.n-menu-item-group-title) {
  padding-left: 24px !important;
  height: 30px !important;
}
:deep(.n-menu-item-content) {
  padding-left: 36px !important;
}
:deep(.n-layout-content>.n-layout-scroll-container) {
  padding: 14px 24px !important;
}
:deep(.n-tabs-pane-wrapper) {
  height: 100%;
  .n-tab-pane {
    height: 100%;
    padding: 12px 0;
  }
}

.items-container {
  max-width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>