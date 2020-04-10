const router = require('express').Router();
const makeEmail = require('../lib/email');
const mustBeAdmin = require('../middleware/must-be-admin.js');
const mustBeAuthenticated = require('../middleware/must-be-authenticated.js');
const wrap = require('../lib/wrap');

router.get(
  '/api/users',
  mustBeAuthenticated,
  wrap(async function(req, res) {
    const { models } = req;
    const users = await models.users.findAll();
    return res.data(users);
  })
);

// create/whitelist/invite user
router.post(
  '/api/users',
  mustBeAdmin,
  wrap(async function(req, res) {
    const { models, appLog } = req;

    let user = await models.users.findOneByEmail(req.body.email);
    if (user) {
      return res.errors('user already exists', 400);
    }

    // Only accept certain fields
    user = await models.users.create({
      email: req.body.email.toLowerCase(),
      role: req.body.role,
      name: req.body.name,
      data: req.body.data
    });

    const email = makeEmail(req.config);

    if (req.config.smtpConfigured()) {
      email.sendInvite(req.body.email).catch(error => appLog.error(error));
    }
    return res.data(user);
  })
);

router.put(
  '/api/users/:_id',
  mustBeAdmin,
  wrap(async function(req, res) {
    const { params, body, user, models } = req;
    if (user._id === params._id && user.role === 'admin' && body.role != null) {
      return res.errors("You can't unadmin yourself", 400);
    }

    const updateUser = await models.users.findOneById(params._id);
    if (!updateUser) {
      return res.errors('user not found', 400);
    }

    // this route could handle potentially different kinds of updates
    // only update user properties that are explicitly allowed to be updated and present
    if (body.role != null) {
      updateUser.role = body.role;
    }
    if (body.passwordResetId != null) {
      updateUser.passwordResetId = body.passwordResetId;
    }
    if (body.name) {
      updateUser.name = body.name;
    }
    if (body.email) {
      updateUser.email = body.email.toLowerCase();
    }
    if (body.data) {
      updateUser.data = body.data;
    }

    const updatedUser = await models.users.update(updateUser);
    return res.data(updatedUser);
  })
);

router.delete(
  '/api/users/:_id',
  mustBeAdmin,
  wrap(async function(req, res) {
    const { models } = req;
    if (req.user._id === req.params._id) {
      return res.errors("You can't delete yourself", 400);
    }
    await models.users.removeById(req.params._id);
    return res.data(null);
  })
);

module.exports = router;
