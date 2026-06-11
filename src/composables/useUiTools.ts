import { h, type Component, type Ref, type VNode } from "vue"
import { NIcon, NTooltip, type DropdownGroupOption, type DropdownOption, type SelectOption } from "naive-ui"

const useUiTools = () => {
  const isMobile = inject<Ref<boolean>>('isMobile')!

  const renderIcon = (icon: Component, props?: any) => {
    return () => {
      return h(NIcon, props, {
        default: () => h(icon)
      })
    }
  }

  const optionsRenderer = ({ node, option }: { node: VNode, option: DropdownOption | DropdownGroupOption | SelectOption }) => {
    if (option.customRenderer) {
      const func = option.customRenderer as (node: VNode, option: any) => VNode
      return func(node, option)
    } else if (option.description) {
      return h(
        NTooltip,
        {
          keepAliveOnHover: false,
          placement: 'right',
          style: {
            width: 'max-content',
            display: isMobile.value ? 'none' : 'inherit',
          }
        },
        {
          trigger: () => [node],
          default: () => option.description
        }
      )
    } else {
      return h(node)
    }
  }

  return {
    renderIcon,
    optionsRenderer,
  }
}

export default useUiTools