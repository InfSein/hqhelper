import PackageJson from '../../package.json'

class AppStatus {
  static get Version() {
    return PackageJson.version
  }
  static get IsDev() {
    return import.meta.env.DEV
  }
  static get IsBeta() {
    return import.meta.env.DEV
      || location.origin.includes('beta.hqhelper')
      || PackageJson.beta
  }
  static get SupportedGameVersion() {
    return {
      CN: PackageJson.gamever.cn,
      GLOBAL: PackageJson.gamever.global,
    }
  }
}

export default AppStatus