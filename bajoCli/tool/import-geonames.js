const coll = 'GeonamesPlace'
const smallStop = 10000
const progressEvery = 200
let counter = 1
let lastTime

const headers = ['id', 'name', 'asciiName', 'altName', 'lat', 'lng',
  'fClass', 'fCode', 'country', 'countryAlt', 'admin1', 'admin2',
  'admin3', 'admin4', 'pop', 'elev', 'dem', 'tz', 'modDate']

function makeProgress (state) {
  const { secToHms } = this.bajo.helper
  return async function ({ batchNo, data, batchStart } = {}) {
    if (!lastTime) lastTime = Date.now()
    if (counter % smallStop === 0) {
      process.stdout.write(`[${counter}, ${secToHms(Date.now() - lastTime, true)}]`)
      lastTime = undefined
    } else if (counter % progressEvery === 0) {
      process.stdout.write('-')
    }
    counter++
  }
}

async function converterFn (rec) {
  for (const k of ['lat', 'lng']) {
    rec[k] = parseFloat(rec[k]) ?? null
  }
  for (const k of ['dem', 'elev', 'pop']) {
    rec[k] = parseInt(rec[k] === '' ? 0 : rec[k]) ?? null
  }
  for (const k of ['altName', 'tz', 'countryAlt']) {
    delete rec[k]
  }
  rec.country = (rec.country || '').toUpperCase()
  rec.id = parseInt(rec.id)
  return rec
}

async function importGeonames ({ path, args }) {
  const { print, importPkg, getConfig, importModule } = this.bajo.helper
  const { importFrom } = this.bajoExtra.helper
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
  const cfg = getConfig('bajoDb', { full: true })
  const start = await importModule(`${cfg.dir.pkg}/bajo/start.js`)
  const { connection } = await getInfo(coll)
  await start.call(this, connection.name)
  print.info('Importing...')
  const progressFn = makeProgress.call(this)
  const opts = { batch: 1, progressFn, fileType: 'csv', converterFn, useHeader: headers }
  opts.createOpts = { noCheckUnique: true, noValidation: true, noHook: true, noFeatureHook: true, noResult: true, noSanitize: true }
  const result = await importFrom(fname, coll, opts, { delimiter: '\t' })
  print.succeed('\n%d records successfully imported from \'%s\'', result.count, fname)
}

export default importGeonames
