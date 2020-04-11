require('../typedefs');
const router = require('express').Router();
const mustBeAdmin = require('../middleware/must-be-admin.js');
const mustBeAuthenticated = require('../middleware/must-be-authenticated.js');
const wrap = require('../lib/wrap');

/**
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function listConnectionClients(req, res) {
  const { models } = req;

  const connectionClients = models.connectionClients
    .findAll()
    .map(connectionClient => {
      return {
        id: connectionClient.id,
        name: connectionClient.connection.name,
        connectedAt: connectionClient.connectedAt,
        lastKeepAliveAt: connectionClient.lastKeepAliveAt
      };
    });

  return res.data(connectionClients);
}

router.get('/api/connection-clients', mustBeAdmin, wrap(listConnectionClients));

/**
 * Get a connection client by id
 * If connection client does is not found it means it was probably disconnected, or never existed
 * (May want to build out a historical reference of connection clients to be able to tell the difference)
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function getConnectionClient(req, res) {
  const { models, params, user } = req;

  const connectionClient = models.connectionClients.getOneById(
    params.connectionClientId
  );

  if (!connectionClient) {
    return res.data(null);
  }

  // Only the owner of the connection or admin can get the client
  const allowed =
    connectionClient.user._id === user._id || user.role === 'admin';

  if (!allowed) {
    return res.errors('Forbidden', 403);
  }

  return res.data({
    id: connectionClient.id,
    name: connectionClient.connection.name,
    connectedAt: connectionClient.connectedAt,
    lastKeepAliveAt: connectionClient.lastKeepAliveAt
  });
}

router.get(
  '/api/connection-clients/:connectionClientId',
  mustBeAuthenticated,
  wrap(getConnectionClient)
);

/**
 * Creates and connects a connectionClient
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function createConnectionClient(req, res) {
  const { models, body, user } = req;

  const { connectionId } = body;
  if (!connectionId) {
    return res.errors('connectionId required', 400);
  }

  const connection = await models.connections.findOneById(connectionId);
  if (!connection) {
    return res.errors('Connection not found', 404);
  }

  const connectionClient = await models.connectionClients.createNew(
    connection,
    user
  );

  return res.data({
    id: connectionClient.id,
    name: connectionClient.connection.name,
    connectedAt: connectionClient.connectedAt,
    lastKeepAliveAt: connectionClient.lastKeepAliveAt
  });
}

router.post(
  '/api/connection-clients',
  mustBeAuthenticated,
  wrap(createConnectionClient)
);

/**
 * Creates and connects a connectionClient
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function keepAliveConnectionClient(req, res) {
  const { models, params, user } = req;

  const connectionClient = models.connectionClients.getOneById(
    params.connectionClientId
  );

  // If no connection client it was already closed
  // This is effectively a no-op
  if (!connectionClient) {
    return res.data(null);
  }

  // Only the owner of the connection client can keep client alive
  const allowed = connectionClient.user._id === user._id;

  if (!allowed) {
    return res.errors('Forbidden', 403);
  }

  const keptAlive = connectionClient.keepAlive();
  if (!keptAlive) {
    // remove from in-memory store and respond with nothing
    // disconnect here is not necessary, but should be safe
    await models.connectionClients.disconnectForId(params.connectionClientId);
    return res.data(null);
  }

  return res.data({
    id: connectionClient.id,
    name: connectionClient.connection.name,
    connectedAt: connectionClient.connectedAt,
    lastKeepAliveAt: connectionClient.lastKeepAliveAt
  });
}

router.put(
  '/api/connection-clients/:connectionClientId',
  mustBeAuthenticated,
  wrap(keepAliveConnectionClient)
);

/**
 * Creates and connects a connectionClient
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function disconnectConnectionClient(req, res) {
  const { models, params, user } = req;
  const { connectionClientId } = params;

  const connectionClient = models.connectionClients.getOneById(
    params.connectionClientId
  );

  // Only the owner of the connection or admin can disconnect the client
  const allowed =
    connectionClient.user._id === user._id || user.role === 'admin';

  if (!allowed) {
    return res.errors('Forbidden', 403);
  }

  await models.connectionClients.disconnectForId(connectionClientId);
  return res.data(null);
}

router.delete(
  '/api/connection-clients/:connectionClientId',
  mustBeAuthenticated,
  wrap(disconnectConnectionClient)
);

module.exports = router;
