var express = require('express');
var router = express.Router();
var passport = require('passport');
var github = require('./github');
var site = require('./site');

router.get('/', site.index);

router.get('/auth/login', passport.authenticate('github'));
router.get('/auth/logout', site.logout);
router.get('/auth/callback', passport.authenticate('github', {
    failureRedirect: '/'
}), github.callback);

module.exports = router;
