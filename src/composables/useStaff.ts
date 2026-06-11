import type { DonateInfo, StaffMember } from "@/types/staff"

const useStaff = () => {
  const t = inject<(message: string, args?: any) => string>('t')!

  const createStaffMember = (
    name: string,
    avatar_url: string,
    desc: string,
    introductions: string[],
    pages: { name: string; url: string }[],
    donate_info?: DonateInfo,
  ) : StaffMember => {
    return {
      name,
      avatar_url,
      desc,
      introductions,
      pages,
      donate_info,
    }
  }

  const staffMembers = computed(() => {
    return {
      infsein: createStaffMember(
        "InfSein",
        "./image/staff/infsein.jpg",
        t('about_app.staff.jobs.infsein'),
        ["我问遍了整个猫区，他们都说我是最帅的肥"],
        [{ name: "Github", url: "https://github.com/InfSein" }],
        {
          self: true,
          donate_desc: t('donate_us.final_confirm.desc.desc_3'),
          donate_ways: [
            { type: 'afd', data_type: 'url', data: 'https://afdian.com/a/infseins' },
            // { type: 'alipay', data_type: 'qrcode', data: 'https://qr.alipay.com/2m614685fmq0ypfw2wipoff' },
            { type: 'wechat_admire', data_type: 'img', data: './image/donate-img/infsein.wechat_admire.png' },
          ]
        },
      ),
      nbb: createStaffMember(
        "N.B.B",
        "https://avatars.githubusercontent.com/u/7787811?v=4",
        t('about_app.staff.jobs.nbb'),
        ["画饼砖家"],
        [{ name: "nbbjack.com", url: "https://nbbjack.com/" }],
        {
          donate_desc: t('donate_us.final_confirm.desc.desc_4'),
          donate_ways: [
            { type: 'afd', data_type: 'url', data: 'https://afdian.com/a/nbb-box' },
          ]
        },
      ),
      yakita: createStaffMember(
        "夜北Yakita",
        "https://avatars.githubusercontent.com/u/95864377?v=4",
        t('about_app.staff.jobs.yakita'),
        ["简直是世间精品库啵"],
        [
          { name: "BiliLive", url: "https://b23.tv/IwuuPBI" },
          { name: "Weibo", url: "https://weibo.com/n/%E5%A4%9C%E5%8C%97yakita" }
        ]
      ),
      kimuchi: createStaffMember(
        "Kim",
        "https://avatars.githubusercontent.com/u/44747407?v=4",
        t('about_app.staff.jobs.kim'),
        [],
        [{ name: "Github", url: "https://github.com/kimuchidev" }]
      ),
      wcy: createStaffMember(
        "joj",
        "https://avatars.githubusercontent.com/u/30862125?v=4",
        t('about_app.staff.jobs.wcy'),
        ["在线求职"],
        [{ name: "Github", url: "https://github.com/wanchenyang521" }]
      ),
      etnatker: createStaffMember(
        "etnAtker",
        "https://avatars.githubusercontent.com/u/20952240?v=4",
        t('about_app.staff.jobs.etnatker'),
        [],
        [{ name: "Github", url: "https://github.com/etnAtker" }]
      ),
    }
  })

  return {
    staffMembers
  }
}

export default useStaff
