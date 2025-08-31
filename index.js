async function factory (pkgName) {
  const me = this

  class SumbaGeonames extends this.app.pluginClass.base {
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
