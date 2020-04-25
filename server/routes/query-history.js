const router = require('express').Router();
const mustBeAuthenticated = require('../middleware/must-be-authenticated.js');
const urlFilterToNeDbFilter = require('../lib/url-filter-to-nedb-filter');
const wrap = require('../lib/wrap');

router.get(
  '/api/query-history',
  mustBeAuthenticated,
  wrap(async function(req, res) {
    const { models } = req;

    // Convert URL filter to NeDB compatible filter object
    const dbFilter = urlFilterToNeDbFilter(req.query.filter);
    const dbQueryHistory = await models.queryHistory.findByFilter(dbFilter);

    const rows = dbQueryHistory.map(q => {
      delete q.id;
      delete q.userId;
      delete q.connectionId;
      return q;
    });

    return res.utils.data(rows);
  })
);

router.get(
  '/api/query-history/:id',
  mustBeAuthenticated,
  wrap(async function(req, res) {
    const { models } = req;
    const queryHistoryItem = await models.queryHistory.findOneById(
      req.params.id
    );
    if (!queryHistoryItem) {
      return res.utils.notFound();
    }
    return res.utils.data(queryHistoryItem);
  })
);

module.exports = router;
