const logger = require('../lib/logger');
const _ = require('lodash');
const drivers = require('../drivers');
const makeCipher = require('../lib/makeCipher');
const config = require('../lib/config');
const getConfigFromFile = require('../lib/config/fromFile.js');

const [configFromFile] = getConfigFromFile() || {};

const { cipher, decipher } = makeCipher(config.get('passphrase'));

/**
 * Get connections from config.
 *
 * For environment variables:
 * connection env vars must follow the format:
 * SQLPAD_CONNECTIONS__<connectionId>__<connectionFieldName>
 *
 * <connectionId> can be any value to associate a grouping a fields to a connection instance
 * If supplying a connection that was previously defined in the nedb database,
 * this would map internally to connection._id object.
 *
 * <connectionFieldName> should be a field name identified in drivers.
 *
 * To define connections via envvars, `driver` field should be supplied.
 * _id field is not required, as it is defined in second env var fragment.
 *
 * Example: SQLPAD_CONNECTIONS__ab123__sqlserverEncrypt=""
 *
 * From file, resulting parsed configuration from file is expected to follow format `connections.<id>.<fieldname>`
 * {
 *   connections: {
 *     ab123: {
 *       sqlserverEncrypt: true
 *     }
 *   }
 * }
 *
 * @param {object} env
 * @returns {array<object>} arrayOfConnections
 */
function getConnectionsFromConfig(env = process.env) {
  // Create a map of connections from parsing environment variable
  const connectionsMapFromEnv = Object.keys(env)
    .filter(key => key.startsWith('SQLPAD_CONNECTIONS__'))
    .reduce((connectionsMap, envVar) => {
      // eslint-disable-next-line no-unused-vars
      const [prefix, id, field] = envVar.split('__');
      if (!connectionsMap[id]) {
        connectionsMap[id] = {};
      }
      connectionsMap[id][field] = env[envVar];
      return connectionsMap;
    }, {});

  // Get copy of connections from config file
  const { connections } = _.cloneDeep(configFromFile);

  // connections key from file matches format that is constructed from env
  // merge the 2 together then create an array out of them
  const connectionsMap = { ...connectionsMapFromEnv, ...connections };

  const connectionsFromConfig = [];
  Object.keys(connectionsMap).forEach(id => {
    try {
      let connection = connectionsMap[id];
      connection._id = id;
      connection = drivers.validateConnection(connection);
      connection.editable = false;
      connectionsFromConfig.push(connection);
    } catch (error) {
      logger.error(
        error,
        'Environment connection configuration failed for %s',
        id
      );
    }
  });
  return connectionsFromConfig;
}

function decipherConnection(connection) {
  if (connection.username) {
    connection.username = decipher(connection.username);
  }
  if (connection.password) {
    connection.password = decipher(connection.password);
  }
  return connection;
}

function makeConnections(nedb) {
  async function findAll() {
    let connectionsFromDb = await nedb.connections.find({});
    connectionsFromDb = connectionsFromDb.map(conn => {
      conn.editable = true;
      return decipherConnection(conn);
    });

    const allConnections = connectionsFromDb.concat(getConnectionsFromConfig());
    return _.sortBy(allConnections, c => c.name.toLowerCase());
  }

  async function findOneById(id) {
    const connection = await nedb.connections.findOne({ _id: id });
    if (connection) {
      connection.editable = true;
      return decipherConnection(connection);
    }

    // If connection was not found in db try env
    const connectionFromEnv = getConnectionsFromConfig().find(
      connection => connection._id === id
    );

    return connectionFromEnv;
  }

  async function removeOneById(id) {
    return nedb.connections.remove({ _id: id });
  }

  async function save(connection) {
    if (!connection) {
      throw new Error('connections.save() requires a connection');
    }

    connection.username = cipher(connection.username || '');
    connection.password = cipher(connection.password || '');

    if (!connection.createdDate) {
      connection.createdDate = new Date();
    }
    connection.modifiedDate = new Date();

    connection = drivers.validateConnection(connection);
    const { _id } = connection;

    if (_id) {
      await nedb.connections.update({ _id }, connection, {});
      return findOneById(_id);
    }
    const newDoc = await nedb.connections.insert(connection);
    return findOneById(newDoc._id);
  }

  return {
    findAll,
    findOneById,
    removeOneById,
    save,
    getConnectionsFromConfig
  };
}

module.exports = makeConnections;
