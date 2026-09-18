export const getImgCdnUrl = (iconID: number, isHq = false) => {
  const CDN_ICON = 'https://icon.nbbjack.com/'
  const hq = isHq ? 'hq/' : ''
  const icon = iconID.toString().padStart(6, '0')
  return `${CDN_ICON}${icon.substring(0, 3)}000/${hq}${icon}.png`
}
