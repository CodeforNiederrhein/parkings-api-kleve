const fetch = require('node-fetch')
const parser = require('xml2json')
const _ = require('lodash')
const moment = require('moment')

const translations = new Map([
  ['zeitstempel', 'timestamp'],
  ['parkhaus', 'parkings'],
  ['gesamt', 'total'],
  ['aktuell', 'current'],
  ['Offen', 'open'],
  ['Stoerung', 'failure']
])

const getNewKey = (value, key) => {
  const newKey = key.toLowerCase()
  return translations.get(newKey) || newKey
}

const attribution = {
  data_source: 'https://www.kleve.de/parkleitsystem/pls.xml',
  publisher: 'Stadt Kleve',
  licence: 'Datenlizenz Deutschland – Zero – Version 2.0',
  info: 'https://www.offenesdatenportal.de/dataset/parkleitsystem-stadt-kleve/resource/d900652f-5104-457a-8dcd-696fb1441b62'
}

module.exports = async (req, res) => {
  const response = await fetch('https://www.kleve.de/parkleitsystem/pls.xml')
  const xml = await response.text()
  const json = _.mapKeys(parser.toJson(xml, {object: true}).Daten, getNewKey)
  const final = {}
  final.timestamp = moment(json.timestamp, 'DD.MM.YYYY HH:mm:SS').toISOString()
  final.parkings = json.parkings
    .map(item => _.mapKeys(item, getNewKey))
    .map(item => {
      const state = translations.get(item.status) || item.status
      delete item.status
      item.state = state
      return item
    })
  return Object.assign({}, final, attribution)
}
