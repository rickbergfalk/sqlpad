const router = require('express').Router()
const Connection = require('../models/Connection.js')
const sendError = require('../lib/sendError')

// TODO FIXME - This was meant to redirect user to appropriate page depending on state of setup
// I do not think it works anymore and should be revisited (this can be done client-side too)
router.get('/', function(req, res, next) {
  const { config } = req
  const BASE_URL = config.get('baseUrl')

  return Connection.findAll()
    .then(connections => {
      if (!req.user) {
        return res.redirect(BASE_URL + '/signin')
      }
      if (connections.length === 0 && req.user.role === 'admin') {
        return res.redirect(BASE_URL + '/connections')
      }
      return res.redirect(BASE_URL + '/queries')
    })
    .catch(error => sendError(res, error))
})

module.exports = router
