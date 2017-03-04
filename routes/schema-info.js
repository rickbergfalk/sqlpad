var runQuery = require('../lib/run-query.js')
var _ = require('lodash')
var fs = require('fs')
var path = require('path')
var router = require('express').Router()
var config = require('../lib/config.js')
var Connection = require('../models/Connection.js')
var Cache = require('../models/Cache.js')
var decipher = require('../lib/decipher.js')
var mustBeAuthenticated = require('../middleware/must-be-authenticated.js')

var sqldir = path.join(__dirname, '/../resources/')

var sqlSchemaPostgres = fs.readFileSync(sqldir + '/schema-postgres.sql', {encoding: 'utf8'})
var sqlSchemaVertica = fs.readFileSync(sqldir + '/schema-vertica.sql', {encoding: 'utf8'})
var sqlSchemaCrate = fs.readFileSync(sqldir + '/schema-crate.sql', {encoding: 'utf8'})
var sqlSchemaStandard = fs.readFileSync(sqldir + '/schema-standard.sql', {encoding: 'utf8'})
var sqlSchemaRestApi = fs.readFileSync(sqldir + '/schema-restapi.sql', {encoding: 'utf8'})

router.get('/api/schema-info/:connectionId', mustBeAuthenticated,
  function initLocals (req, res, next) {
    res.locals.reload = req.query.reload === 'true'
    res.locals.tree = {}
    res.locals.cacheKey
    res.locals.connection
    res.locals.SHOW_SCHEMA_COPY_BUTTON = config.get('showSchemaCopyButton')
    res.locals.connectionId = req.params.connectionId
    next()
  },

  function getConnection (req, res, next) {
    Connection.findOneById(res.locals.connectionId, function (err, conn) {
      if (err) {
        console.error(err)
        return res.json({
          error: 'Problem querying connection database'
        })
      }
      if (!conn) {
        return res.json({
          error: 'Connection not found'
        })
      }
      res.locals.connection = conn
      res.locals.cacheKey = 'schemaCache:' + res.locals.connectionId
      next()
    })
  },

  function getCache (req, res, next) {
    Cache.findOneByCacheKey(res.locals.cacheKey, function (err, cache) {
      if (err) {
        console.error(err)
        return res.json({
          error: 'Problem querying cache database'
        })
      }
      if (!cache || res.locals.reload) {
        if (!cache) cache = new Cache({cacheKey: res.locals.cacheKey})
        res.locals.cache = cache

        var connection = res.locals.connection

        connection.username = decipher(connection.username)
        connection.password = decipher(connection.password)
        connection.maxRows = typeof Number.MAX_SAFE_INTEGER === undefined ? 9007199254740991 : Number.MAX_SAFE_INTEGER

        var tableAndColumnSql = ''
        if (connection.driver === 'vertica') {
          tableAndColumnSql = sqlSchemaVertica
        } else if (connection.driver === 'crate') {
          tableAndColumnSql = sqlSchemaCrate
        } else if (connection.driver === 'postgres') {
          tableAndColumnSql = sqlSchemaPostgres
        } else if (connection.driver === 'restapi') {
          tableAndColumnSql = sqlSchemaRestApi
        } else {
          tableAndColumnSql = sqlSchemaStandard
        }

        runQuery(tableAndColumnSql, connection, function (err, queryResult) {
          if (err) {
            console.error(err)
            return res.json({
              error: 'Problem running schema info query'
            })
          }
          var bySchema = _.groupBy(queryResult.rows, 'table_schema')
          for (var schema in bySchema) {
            if (bySchema.hasOwnProperty(schema)) {
              res.locals.tree[schema] = {}
              var byTableName = _.groupBy(bySchema[schema], 'table_name')
              for (var tableName in byTableName) {
                if (byTableName.hasOwnProperty(tableName)) {
                  res.locals.tree[schema][tableName] = byTableName[tableName]
                }
              }
            }
          }
          /*
          So at this point, tree should look like this:
          tree: {
              "table": {
                  "dbo": {
                      "tablename": [
                          {
                              column_name: "the column name",
                              data_type: "string",
                              is_nullable: "no"
                          }
                      ]
                  }
              }
          }
          */
          next()
        })
      } else {
        return res.json({
          schemaInfo: JSON.parse(cache.schema)
        })
      }
    })
  },

  function updateCacheAndRender (req, res, next) {
    if (!_.isEmpty(res.locals.tree)) {
      var cache = res.locals.cache
      cache.schema = JSON.stringify(res.locals.tree)
      cache.save(function (err, newCache) {
        if (err) {
          console.error(err)
          return res.json({
            error: 'Problem saving cache'
          })
        }
        return res.json({
          schemaInfo: res.locals.tree
        })
      })
    } else {
      res.json({
        schemaInfo: res.locals.tree
      })
    }
  }
)

module.exports = router
