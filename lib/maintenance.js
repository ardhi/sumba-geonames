const url = 'https://download.geonames.org/export/dump/{type}-{date}.txt'
const modelName = 'GeonamesPlace'

async function maintenance ({ type = 'modifications', headers, converterFn, date } = {}) {
  const { importPkg, getConfig } = this.app.bajo
  const { fs, dayjs } = this.app.lib
  const { generateId } = this.app.lib.aneka
  const { download } = this.app.bajoExtra
  const { import: importFrom } = this.app.doboExtra
  if (!this.app.dobo) this.print.fatal('Dobo isn\'t loaded')
  const confirm = await importPkg('bajoCli:@inquirer/confirm')
  const config = getConfig()
  if (config.prompt !== false) {
    const answer = await confirm({
      message: this.t('You\'re about to apply geonames data %s. Are you sure?', type),
      default: false
    })
    if (!answer) this.print.fatal('Aborted!')
  }
  if (!date) date = dayjs().subtract(1, 'day').toDate()
  const dt = dayjs(date)
  if (!dt.isValid()) this.print.fatal('Invalid date \'%s\'', date)
  date = dt.format('YYYY-MM-DD')
  const fileName = `${generateId()}.tsv`
  const downloadText = `Downloading ${type} file...`
  const spin = this.print.spinner({ showCounter: true }).start(downloadText)
  let dest
  try {
    dest = await download(url.replace('{type}', type).replace('{date}', date), undefined, { spin, spinText: downloadText, fileName })
  } catch (err) {
    spin.fatal('Error: %s', err.message)
  }
  const model = this.app.dobo.getModel(modelName)

  await this.app.dobo.start()
  const data = await importFrom(dest, false, { converterFn, useHeader: headers })
  fs.removeSync(dest)
  for (const i in data) {
    const d = data[i]
    const item = await model.findOneRecord({ query: { geonamesId: parseInt(d.geonamesId) } }, { noHook: true, noCache: true })
    try {
      if (type === 'modifications') {
        spin.setText('Create/update %s of %s records, ID: %s, name: %s', parseInt(i) + 1, data.length, d.geonamesId, d.name)
        if (item) await model.updateRecord(item.id, d, { noHook: true, noResult: true })
        else await model.createRecord(d, { noHook: true, noResult: true })
      } else {
        spin.setText('Removing %s of %s records, ID: %s, reason: %s', parseInt(i) + 1, data.length, d.geonamesId, d.reason)
        if (item) await model.removeRecord(item.id, { noHook: true, noResult: true })
      }
    } catch (err) {
      this.print.fail(err.message)
    }
  }
  spin.succeed('%s records processed', data.length)
}

export default maintenance
