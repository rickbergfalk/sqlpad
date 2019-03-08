const passport = require('passport')
const router = require('express').Router()
const { baseUrl } = require('../lib/config').getPreDbConfig()

router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
)

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: baseUrl + '/',
    failureRedirect: baseUrl + '/signin'
  })
)

module.exports = router
