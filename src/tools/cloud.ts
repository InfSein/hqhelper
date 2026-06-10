import { computed, type Ref } from "vue"
import { getImgCdnUrl } from "./item"
import type { CloudConfigModel } from "@/models/config-cloud"
import type { MainCacheModel } from "@/types/config/cache-main"

interface UserSpecialTitle {
  key: "dev" | "staff" | "vip"
  tag: string
  tagColor: string
  desc: string
}

const useCloud = (
  cloudConfig: Ref<CloudConfigModel>,
  mainCache: Ref<MainCacheModel>,
  t: (message: string, args?: any) => string,
) => {
  const avatarUrl = computed(() => {
    if (cloudConfig.value.nbb_account_avatar_vip) {
      return cloudConfig.value.nbb_account_avatar_vip
    } else if (cloudConfig.value.nbb_account_avatar) {
      return getImgCdnUrl(cloudConfig.value.nbb_account_avatar)
    } else {
      return './image/game-job/companion/none.png'
    }
  })
  const userId = computed(() => {
    return cloudConfig.value.nbb_account_uid
  })
  const userNickName = computed(() => {
    return cloudConfig.value.nbb_account_nickname || t('cloud.text.not_logged_in')
  })
  const userLoggedIn = computed(() => !!cloudConfig.value.nbb_account_token)
  const userTitle = computed(() => {
    if (!userLoggedIn.value) return '-'
    return cloudConfig.value.nbb_account_title || '-'
  })

  const userSpecialTitle = computed(() : UserSpecialTitle | undefined => {
    if (!userLoggedIn.value) return undefined
    if (userId.value === 2956) {
      return {
        key: 'dev',
        tag: 'DEV',
        tagColor: 'var(--color-info)',
        desc: 'HqHelper的开发者'
      }
    }
    if (mainCache.value.sponsor_nbbids.includes(userId.value)) {
      return {
        key: 'vip',
        tag: 'VIP',
        tagColor: 'var(--color-error)',
        desc: 'HqHelper的赞助者'
      }
    }
    return undefined
  })

  return {
    avatarUrl,
    userId,
    userNickName,
    userLoggedIn,
    userTitle,
    userSpecialTitle,
  }
}

export default useCloud