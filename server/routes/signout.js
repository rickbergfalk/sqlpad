const router = require('express').Router();
const appLog = require('../lib/app-log');

// Clear out session regardless of auth strategy
router.get('/api/signout', function(req, res) {
  if (!req.session) {
    return res.data('signout', {});
  }
  req.session.destroy(function(err) {
    if (err) {
      appLog.error(err);
    }
    res.data('signout', {});
  });
});

module.exports = router;
