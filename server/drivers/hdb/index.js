const hdb = require('hdb')
const { formatSchemaQueryResults } = require('../utils')

const id = 'hdb'
const name = 'SAP HANA'

function getSchemaSql(schema) {
  const whereSql = schema ? `WHERE tables.SCHEMA_NAME = '${schema}'` : ''
  return `
    SELECT 
      columns.SCHEMA_NAME as table_schema, 
      columns.TABLE_NAME as table_name, 
      columns.COLUMN_NAME as column_name, 
      columns.DATA_TYPE_NAME as data_type
    FROM 
      SYS.TABLES tables
      JOIN SYS.COLUMNS columns ON tables.SCHEMA_NAME = columns.SCHEMA_NAME AND tables.TABLE_NAME = columns.TABLE_NAME
    ${whereSql}
    ORDER BY 
     columns.POSITION
  `
}

/**
 * Run query for connection
 * Should return { rows, incomplete }
 * @param {string} query
 * @param {object} connection
 */
function runQuery(query, connection) {
  // TODO implement maxRows support
  let incomplete = false

  return new Promise((resolve, reject) => {
    const client = hdb.createClient({
      host: connection.host,
      port: connection.hanaport,
      database: connection.hanadatabase,
      user: connection.username,
      password: connection.password,
      schema: connection.hanaSchema
    })
    client.on('error', err => {
      console.error('Network connection error', err)
      return reject(err)
    })
    client.connect(err => {
      if (err) {
        console.error('Connect error', err)
        return reject(err)
      }
      return client.exec(query, (err, result) => {
        let rows = []

        // Result could be anything
        // Sometimes its array of rows, other times a number (like rows inserted?)
        // Also could be null
        if (Array.isArray(result)) {
          rows = result
        } else {
          rows = [{ result: result }]
        }

        client.disconnect()
        if (err) {
          return reject(err)
        }
        return resolve({ rows: rows, incomplete })
      })
    })
  })
}

/**
 * Test connectivity of connection
 * @param {*} connection
 */
function testConnection(connection) {
  const query = 'select * from DUMMY'
  return runQuery(query, connection)
}

/**
 * Get schema for connection
 * @param {*} connection
 */
function getSchema(connection) {
  const schemaSql = getSchemaSql(connection.hanaSchema)
  return runQuery(schemaSql, connection).then(queryResult =>
    formatSchemaQueryResults(queryResult)
  )
}

const fields = [
  {
    key: 'host',
    formType: 'TEXT',
    label: 'Host/Server/IP Address'
  },
  {
    key: 'hanaport',
    formType: 'TEXT',
    label: 'Port (e.g. 39015)'
  },
  {
    key: 'username',
    formType: 'TEXT',
    label: 'Database Username'
  },
  {
    key: 'password',
    formType: 'PASSWORD',
    label: 'Database Password'
  },
  {
    key: 'hanadatabase',
    formType: 'TEXT',
    label: 'Tenant'
  },
  {
    key: 'hanaSchema',
    formType: 'TEXT',
    label: 'Schema (optional)'
  }
]

module.exports = {
  id,
  name,
  fields,
  getSchema,
  runQuery,
  testConnection
}
