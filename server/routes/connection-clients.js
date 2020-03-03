require('../typedefs');
const router = require('express').Router();
// const mustBeAdmin = require('../middleware/must-be-admin.js');
const mustBeAuthenticated = require('../middleware/must-be-authenticated.js');
const sendError = require('../lib/sendError');

// /**
//  * @param {import('express').Request & Req} req
//  * @param {*} res
//  */
// async function listConnectionClients(req, res) {
//   try {
//     // TODO
//     // get all connection clients
//     // strip sensitive info
//     // return list of connection clients
//     return res.json({
//       connectionClients: []
//     });
//   } catch (error) {
//     sendError(res, error, 'Problem querying connection database');
//   }
// }

// router.get('/api/connection-clients', mustBeAdmin, listConnectionClients);

/**
 * Get a connection client by id
 * If connection client does is not found it means it was probably disconnected, or never existed
 * (May want to build out a historical reference of connection clients to be able to tell the difference)
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function getConnectionClient(req, res) {
  const { models, params, user } = req;
  try {
    const connectionClient = models.connectionClients.getOneById(
      params.connectionClientId
    );

    if (!connectionClient) {
      return sendError(res, null, 'Connection disconnected');
    }

    // Only the owner of the connection or admin can get the client
    if (connectionClient.user._id !== user._id || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = {
      connectionClient: {
        id: connectionClient.id,
        name: connectionClient.connection.name,
        connectedAt: connectionClient.connectedAt
      }
    };

    return res.json(data);
  } catch (error) {
    sendError(res, error, 'Problem getting connection client');
  }
}

router.get(
  '/api/connection-clients/:connectionClientId',
  mustBeAuthenticated,
  getConnectionClient
);

/**
 * Creates and connects a connectionClient
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function createConnectionClient(req, res) {
  const { models, body, user } = req;
  try {
    const { connectionId } = body;
    if (!connectionId) {
      return sendError(res, null, 'connectionId required');
    }

    const connection = await models.connections.findOneById(connectionId);
    if (!connection) {
      return sendError(res, null, 'Connection not found');
    }

    const connectionClient = await models.connectionClients.createNew(
      connection,
      user
    );

    const data = {
      connectionClient: {
        id: connectionClient.id,
        name: connectionClient.connection.name,
        connectedAt: connectionClient.connectedAt
      }
    };

    return res.json(data);
  } catch (error) {
    sendError(res, error, 'Problem creating connection client');
  }
}

router.post(
  '/api/connection-clients',
  mustBeAuthenticated,
  createConnectionClient
);

// TODO how should keep-alive requests be handled? PUT? should there be a body?
// router.put(
//   '/api/connection-clients/:connectionClientId',
//   mustBeAdmin,
//   async function(req, res) {
//     res.json({});
//   }
// );

/**
 * Creates and connects a connectionClient
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function disconnectConnectionClient(req, res) {
  const { models, params } = req;
  const { connectionClientId } = params;
  try {
    await models.connectionClients.disconnectForId(connectionClientId);
    return res.json({});
  } catch (error) {
    sendError(res, error, 'Problem disconnecting connection client');
  }
}

router.delete(
  '/api/connection-clients/:connectionClientId',
  mustBeAuthenticated,
  disconnectConnectionClient
);

module.exports = router;
