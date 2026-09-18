export interface StaffMember {
  name: string
  avatar_url: string
  desc: string
  introductions: string[]
  pages: {
    name: string
    url: string
  }[]
  donate_info?: DonateInfo
}
export interface DonateInfo {
  self?: boolean
  donate_desc: string
  donate_ways: DonateWay[]
}
export interface DonateWay {
  type: "qq" | "afd" | "alipay" | "wechat_admire"
  data_type: "url" | "qrcode" | "img"
  data: string
}