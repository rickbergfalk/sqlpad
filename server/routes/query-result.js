const runQuery = require('../lib/run-query.js')
const sanitize = require('sanitize-filename')
const moment = require('moment')
const router = require('express').Router()
const decipher = require('../lib/decipher.js')
const Connection = require('../models/Connection.js')
const Cache = require('../models/Cache.js')
const Query = require('../models/Query.js')
const mustBeAuthenticated = require('../middleware/must-be-authenticated.js')
const mustBeAuthenticatedOrChartLink = require('../middleware/must-be-authenticated-or-chart-link-noauth.js')
const sendError = require('../lib/sendError')

// This allows executing a query relying on the saved query text
// Instead of relying on an open endpoint that executes arbitrary sql
router.get(
  '/api/query-result/:_queryId',
  mustBeAuthenticatedOrChartLink,
  function(req, res) {
    return Query.findOneById(req.params._queryId)
      .then(query => {
        if (!query) {
          return sendError(res, null, 'Query not found (save query first)')
        }
        const data = {
          connectionId: query.connectionId,
          cacheKey: query._id,
          queryName: query.name,
          queryText: query.queryText,
          config: req.config
        }
        // NOTE: Sends actual error here since it might have info on why the query is bad
        return getQueryResult(data)
          .then(queryResult => res.send({ queryResult }))
          .catch(error => sendError(res, error))
      })
      .catch(error => sendError(res, error, 'Problem querying query database'))
  }
)

// Accepts raw inputs from client
// Used during query editing
router.post('/api/query-result', mustBeAuthenticated, function(req, res) {
  const data = {
    connectionId: req.body.connectionId,
    cacheKey: req.body.cacheKey,
    queryName: req.body.queryName,
    queryText: req.body.queryText,
    config: req.config
  }

  return getQueryResult(data)
    .then(queryResult => res.send({ queryResult }))
    .catch(error => sendError(res, error))
})

function getQueryResult(data) {
  return Connection.findOneById(data.connectionId)
    .then(connection => {
      if (!connection) {
        throw new Error('Please choose a connection')
      }
      connection.maxRows = Number(data.config.get('queryResultMaxRows'))
      connection.username = decipher(connection.username)
      connection.password = decipher(connection.password)
      data.connection = connection
      return Cache.findOneByCacheKey(data.cacheKey)
    })
    .then(cache => {
      if (!cache) {
        cache = new Cache({ cacheKey: data.cacheKey })
      }
      cache.queryName = sanitize(
        (data.queryName || 'SQLPad Query Results') +
          ' ' +
          moment().format('YYYY-MM-DD')
      )
      // Expire cache in 8 hours
      const now = new Date()
      cache.expiration = new Date(now.getTime() + 1000 * 60 * 60 * 8)
      return cache.save()
    })
    .then(newCache => {
      data.cache = newCache
      return new Promise((resolve, reject) => {
        runQuery(data.queryText, data.connection, function(err, queryResult) {
          if (err) {
            return reject(err)
          }
          data.queryResult = queryResult
          data.queryResult.cacheKey = data.cacheKey
          return resolve()
        })
      })
    })
    .then(() => {
      if (data.config.get('allowCsvDownload')) {
        const queryResult = data.queryResult
        const cache = data.cache
        return cache
          .writeXlsx(queryResult)
          .then(() => cache.writeCsv(queryResult))
      }
    })
    .then(() => {
      return data && data.queryResult ? data.queryResult : null
    })
}

module.exports = router
