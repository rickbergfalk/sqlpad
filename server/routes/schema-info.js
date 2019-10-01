const router = require('express').Router();
const connections = require('../models/connections');
const schemaInfoUtil = require('../models/schemaInfo.js');
const driver = require('../drivers');
const mustBeAuthenticated = require('../middleware/must-be-authenticated.js');
const sendError = require('../lib/sendError');

router.get(
  '/api/schema-info/:connectionId',
  mustBeAuthenticated,
  async function(req, res) {
    const { connectionId } = req.params;
    const reload = req.query.reload === 'true';

    try {
      let conn = await connections.findOneById(connectionId);

      if (!conn) {
        throw new Error('Connection not found');
      }

      let schemaInfo = await schemaInfoUtil.getSchemaInfo(connectionId);

      if (schemaInfo && !reload) {
        return res.json({ schemaInfo });
      }

      schemaInfo = await driver.getSchema(conn);
      if (Object.keys(schemaInfo).length) {
        await schemaInfoUtil.saveSchemaInfo(connectionId, schemaInfo);
      }
      return res.json({ schemaInfo });
    } catch (error) {
      if (error.message === 'Connection not found') {
        return sendError(res, error);
      }
      sendError(res, error, 'Problem getting schema info');
    }
  }
);

module.exports = router;
