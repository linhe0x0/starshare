var UserModel = require('../models/user');

exports.getNotes = function(req, res) {
    var username = req.session.user.username;
    var id = req.query.id;

    UserModel.findByUsername(username, function(err, user) {
        if (err) {
            return res.json({
                status: 1,
                statusInfo: err
            });
        }

        var repos = user.repos;
        var note = '';

        for (var i = 0, len = repos.length; i < len; i++) {
            if (repos[i].id === id) {
                note = repos[i].notes || '';
                break;
            }
        }

        res.json({
            status: 0,
            statusInfo: 'OK',
            data: note
        });
    });
};

exports.updateNotes = function(req, res) {
    var username = req.session.username;
    var id = req.body.id + '';
    var notes = req.body.notes;

    UserModel.findByUsername(username, function(err, user) {
        if (err) {
            return res.json({
                status: 1,
                statusInfo: err
            });
        }

        var repos = user.repos;
        var unfind = true;

        for (var i = 0, len = repos.length; i < len; i++) {
            if (repos[i].id === id) {
                repos[i].notes = notes;
                unfind = false;
                break;
            }
        }

        if (unfind) {
            repos.push({
                id: id,
                notes: notes
            });
        }

        user.save(function(err) {
            if (err) {
                return res.json({
                    status: 1,
                    statusInfo: err
                });
            }

            return res.json({
                status: 0,
                statusInfo: 'OK'
            });
        });
    });
};

exports.getTags = function(req, res) {
    var username = req.session.user.username;

    UserModel.findByUsername(username, function(err, user) {
        if (err) {
            return res.json({
                status: 1,
                statusInfo: err
            });
        }

        return res.json({
            status: 0,
            statusInfo: '',
            data: user.repos
        });
    });
};

exports.updateTags = function(req, res) {
    var username = req.session.user.username;
    var id = req.body.id + '';
    var tags = req.body.tags;

    UserModel.findByUsername(username, function(err, user) {
        var repos = user.repos;
        var unfind = true;

        for (var i = 0, len = repos.length; i < len; i++) {
            if (repos[i].id === id) {
                repos[i].tags = tags;
                unfind = false;
                break;
            }
        }

        if (unfind) {
            repos.push({
                id: id,
                tags: tags
            });
        }

        user.save(function(err) {
            if (err) {
                return res.json({
                    status: 1,
                    statusInfo: err
                });
            }

            return res.json({
                status: 0,
                statusInfo: 'OK'
            });
        });
    });
};
