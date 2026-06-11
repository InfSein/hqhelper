import PackageJson from '../../package.json'

class AppStatus {
  static get Version() {
    return PackageJson.version
  }
  static get SupportedGameVersion() {
    return {
      CN: PackageJson.gamever.cn,
      GLOBAL: PackageJson.gamever.global,
    }
  }
}

export default AppStatus