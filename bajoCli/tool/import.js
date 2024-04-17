import headers from '../../lib/headers.js'
import converterFn from '../../lib/converter-fn.js'

const coll = 'GeonamesPlace'
const smallStop = 10000
const progressEvery = 200
let counter = 1
let lastTime

function makeProgress (state) {
  const { secToHms } = this.bajo.helper
  const { formatInteger } = this.bajoExtra.helper
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

async function importGeonames ({ path, args }) {
  const { print, importPkg, startPlugin } = this.bajo.helper
  const { importFrom, countFileLines, formatInteger } = this.bajoExtra.helper
  if (!this.bajoDb) print.fatal('Bajo DB isn\'t loaded')
  const { getInfo } = this.bajoDb.helper
  const fs = await importPkg('fs-extra')
  const confirm = await importPkg('bajoCli:@inquirer/confirm')
  const fname = args[0]

  if (!fname) print.fatal('No geonames file provided!')
  if (!fs.existsSync(fname)) print.fatal('Given geonames file not found!')
  const answer = await confirm({
    message: print.__('You\'re about to DELETE ALL geonames rows and importing ALL NEW records from file. Are you really sure?'),
    default: false
  })
  if (!answer) print.fatal('Aborted!')
  const { connection } = await getInfo(coll)
  await startPlugin('bajoDb', connection.name)
  const lines = await countFileLines(fname)
  print.info('Importing %s lines...', formatInteger(lines))
  const progressFn = makeProgress.call(this)
  const opts = { batch: 1, progressFn, fileType: 'csv', converterFn, useHeader: headers }
  opts.createOpts = { noCheckUnique: true, noValidation: true, noHook: true, noFeatureHook: true, noResult: true, noSanitize: true }
  const result = await importFrom(fname, coll, opts, { delimiter: '\t' })
  print.succeed('\n%s records successfully imported from \'%s\'', formatInteger(result.count), fname)
}

export default importGeonames
