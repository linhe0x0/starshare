var express = require('express');
var router = express.Router();
var auth = require('./auth');
var github = require('./github');
var repo = require('./repo');

router.get('/auth/user', auth.user);

router.get('/github/getStars', github.getStars);
router.get('/github/repos/readme', github.readme);
router.post('/github/renderMarkdown', github.renderMarkdown);

router.get('/repo/getNotes', repo.getNotes);
router.post('/repo/updateNotes', repo.updateNotes);
router.get('/repo/getTags', repo.getTags);
router.post('/repo/updateTags', repo.updateTags);

module.exports = router;
