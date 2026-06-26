import { computed } from "vue"
import { getImgCdnUrl } from '@/tools/game'
import { useStore } from "@/store"

interface UserSpecialTitle {
  key: "dev" | "staff" | "vip"
  tag: string
  tagColor: string
  desc: string
}

const useCloud = () => {
  const store = useStore()
  const t = inject<(message: string, args?: any) => string>('t')!

  const avatarUrl = computed(() => {
    if (store.cloudConfig.nbb_account_avatar_vip) {
      return store.cloudConfig.nbb_account_avatar_vip
    } else if (store.cloudConfig.nbb_account_avatar) {
      return getImgCdnUrl(store.cloudConfig.nbb_account_avatar)
    } else {
      return './image/game-job/companion/none.png'
    }
  })
  const userId = computed(() => {
    return store.cloudConfig.nbb_account_uid
  })
  const userNickName = computed(() => {
    return store.cloudConfig.nbb_account_nickname || t('cloud.text.not_logged_in')
  })
  const userLoggedIn = computed(() => !!store.cloudConfig.nbb_account_token)
  const userTitle = computed(() => {
    if (!userLoggedIn.value) return '-'
    return store.cloudConfig.nbb_account_title || '-'
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
    if (store.mainCache.sponsor_nbbids.includes(userId.value)) {
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