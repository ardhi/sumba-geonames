const url = 'https://download.geonames.org/export/dump/{type}-{date}.txt'
const coll = 'GeonamesPlace'

async function maintenance ({ type = 'modifications', headers, converterFn, date } = {}) {
  const { fs, print, importPkg, dayjs, generateId, spinner, startPlugin, getConfig } = this.bajo.helper
  const { download } = this.bajoExtra.helper
  const { import: importFrom } = this.bajoDbx.helper
  if (!this.bajoDb) print.fatal('Bajo DB isn\'t loaded')
  const { getInfo, recordFindOne, recordRemove, recordUpdate, recordCreate } = this.bajoDb.helper
  const confirm = await importPkg('bajoCli:@inquirer/confirm')
  const config = getConfig()
  if (config.prompt !== false) {
    const answer = await confirm({
      message: print.__('You\'re about to apply geonames data %s. Are you sure?', type),
      default: false
    })
    if (!answer) print.fatal('Aborted!')
  }
  if (!date) date = dayjs().subtract(1, 'day').toDate()
  const dt = dayjs(date)
  if (!dt.isValid()) print.fatal('Invalid date \'%s\'', date)
  date = dt.format('YYYY-MM-DD')
  const fileName = `${generateId()}.tsv`
  const downloadText = `Downloading ${type} file...`
  const spin = spinner({ showCounter: true }).start(downloadText)
  let dest
  try {
    dest = await download(url.replace('{type}', type).replace('{date}', date), undefined, { spin, spinText: downloadText, fileName })
  } catch (err) {
    spin.fatal('Error: %s', err.message)
  }
  const { connection } = getInfo(coll)

  await startPlugin('bajoDb', connection.name)
  const data = await importFrom(dest, false, { converterFn, useHeader: headers })
  fs.unlinkSync(dest)
  for (const i in data) {
    const d = data[i]
    const item = await recordFindOne(coll, { query: { geonamesId: parseInt(d.geonamesId) } }, { noHook: true, noCache: true })
    try {
      if (type === 'modifications') {
        spin.setText('Create/update %s of %s records, ID: %s, name: %s', parseInt(i) + 1, data.length, d.geonamesId, d.name)
        if (item) await recordUpdate(coll, item.id, d, { noHook: true, noResult: true })
        else await recordCreate(coll, d, { noHook: true, noResult: true })
      } else {
        spin.setText('Removing %s of %s records, ID: %s, reason: %s', parseInt(i) + 1, data.length, d.geonamesId, d.reason)
        if (item) await recordRemove(coll, item.id, { noHook: true, noResult: true })
      }
    } catch (err) {
      print.fail(err.message)
    }
  }
  spin.succeed('%s records processed', data.length)
}

export default maintenance
