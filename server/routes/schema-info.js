require('../typedefs');
const router = require('express').Router();
const mustHaveConnectionAccess = require('../middleware/must-have-connection-access.js');
const ConnectionClient = require('../lib/connection-client');
const wrap = require('../lib/wrap');

/**
 * @param {import('express').Request & Req} req
 * @param {*} res
 */
async function getSchemaInfo(req, res) {
  const { models, user } = req;
  const { connectionId } = req.params;
  const reload = req.query.reload === 'true';

  const conn = await models.connections.findOneById(connectionId);

  if (!conn) {
    return res.utils.getNotFound();
  }

  const connectionClient = new ConnectionClient(conn, user);
  const schemaCacheId = connectionClient.getSchemaCacheId();

  let schemaInfo = await models.schemaInfo.getSchemaInfo(schemaCacheId);

  if (schemaInfo && !reload) {
    return res.utils.data(schemaInfo);
  }

  schemaInfo = await connectionClient.getSchema();
  if (Object.keys(schemaInfo).length) {
    await models.schemaInfo.saveSchemaInfo(schemaCacheId, schemaInfo);
  }
  return res.utils.data(schemaInfo);
}

router.get(
  '/api/schema-info/:connectionId',
  mustHaveConnectionAccess,
  wrap(getSchemaInfo)
);

module.exports = router;
