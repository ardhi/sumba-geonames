async function factory (pkgName) {
  const me = this

  class SumbaGeonames extends this.lib.Plugin {
    static alias = 'geonames'
    static dependencies = ['dobo']

    constructor () {
      super(pkgName, me.app)
      this.config = {
      }
    }
  }

  return SumbaGeonames
}

export default factory
