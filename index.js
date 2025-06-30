async function factory (pkgName) {
  const me = this

  return class SumbaGeonames extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'geonames'
      this.dependencies = ['dobo']
      this.config = {
      }
    }
  }
}

export default factory
