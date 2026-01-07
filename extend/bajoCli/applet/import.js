import headers from '../../lib/headers.js'
import converterFn from '../../lib/converter-fn.js'

const model = 'GeonamesPlace'
const smallStop = 10000
const progressEvery = 200
let counter = 1
let lastTime

function makeProgress (state) {
  const { secToHms } = this.app.lib.aneka
  const { formatInteger } = this.app.bajoExtra
  return async function ({ batchNo, data, batchStart } = {}) {
    if (!lastTime) lastTime = Date.now()
    if (counter % smallStop === 0) {
      process.stdout.write(`> ${formatInteger(counter)} | ${secToHms(Date.now() - lastTime, true)} <`)
      lastTime = undefined
    } else if (counter % progressEvery === 0) {
      process.stdout.write('-')
    }
    counter++
  }
}

async function importGeonames (path, ...args) {
  const { importPkg } = this.app.bajo
  const { fs } = this.app.lib
  const { importFrom, countFileLines, formatInteger } = this.app.bajoExtra
  if (!this.app.dobo) this.print.fatal('Dobo isn\'t loaded')
  const confirm = await importPkg('bajoCli:@inquirer/confirm')
  const fname = args[0]

  if (!fname) this.print.fatal('No geonames file provided!')
  if (!fs.existsSync(fname)) this.print.fatal('Given geonames file not found!')
  const answer = await confirm({
    message: this.t('You\'re about to DELETE ALL geonames rows and importing ALL NEW records from file. Are you really sure?'),
    default: false
  })
  if (!answer) this.print.fatal('Aborted!')
  await this.app.dobo.start()
  const lines = await countFileLines(fname)
  this.print.info('Importing %s lines...', formatInteger(lines))
  const progressFn = makeProgress.call(this)
  const opts = { batch: 1, progressFn, fileType: 'csv', converterFn, useHeader: headers }
  opts.createOpts = { noCheckUnique: true, noValidation: true, noHook: true, noFeatureHook: true, noResult: true, noSanitize: true }
  const result = await importFrom(fname, model, opts, { delimiter: '\t' })
  process.stdout.write('\n')
  this.print.succeed('%s records successfully imported from \'%s\'', formatInteger(result.count), fname)
}

export default importGeonames
