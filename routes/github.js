var request = require('request');
var underscore = require('underscore');
var UserModel = require('../models/user');

exports.getStars = function(req, res) {
    var page = req.query.page;
    var per_page = req.query.per_page;

    var options = {
        url: req.session.user._json.starred_url.split('{')[0],
        headers: {
            'User-Agent': req.headers['user-agent']
        },
        qs: {
            'client_id': global.config.auth.client_id,
            'client_secret': global.config.auth.client_secret,
            'access_token': req.session.user.access_token,
            'page': page,
            'per_page': per_page
        }
    }

    request(options, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            var data = JSON.parse(body);
            return res.json({
                status: 0,
                statusInfo: 'OK',
                data: data
            });
        } else {
            return res.json({
                status: 1,
                statusInfo: "请求Github Stars 数据失败, 请稍后刷新页面重新尝试"
            });
        }
    });
};

exports.readme = function(req, res) {
    var owner = req.query.owner;
    var repo = req.query.repo;

    var options = {
        url: 'https://api.github.com/repos/' + owner + '/' + repo + '/readme',
        headers: {
            'User-Agent': req.headers['user-agent'],
        },
        qs: {
            'client_id': global.config.auth.client_id,
            'client_secret': global.config.auth.client_secret,
            'access_token': req.session.user.access_token
        }
    }

    request(options, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            var data = JSON.parse(body);
            return res.json({
                status: 0,
                statusInfo: 'OK',
                data: data
            });
        } else {
            return res.json({
                status: 1,
                statusInfo: "请求Github Repos 数据失败, 请稍后刷新页面重新尝试"
            });
        }
    });
};

exports.renderMarkdown = function(req, res) {
    var text = req.body.text;

    var options = {
        uri: 'https://api.github.com/markdown',
        headers: {
            'User-Agent': req.headers['user-agent'],
            'client_id': global.config.auth.client_id,
            'client_secret': global.config.auth.client_secret,
            'access_token': req.session.user.access_token
        },
        json: {
            text: text
        }
    };

    request.post(options, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            return res.json({
                status: 0,
                statusInfo: 'OK',
                data: body
            })
        } else {
            return res.json({
                status: 1,
                statusInfo: '请求渲染 Markdown 出错. 请稍后刷新页面重新尝试'
            });
        }
    });
};

exports.callback = function(req, res) {
    req.session.user = req.user.profile;
    req.session.user['access_token'] = req.user.accessToken;

    var userData = {
        username: req.user.profile.username,
        email: req.user.profile._json.email,
        accessToken: req.user.accessToken,
        github: {
            url: req.user.profile._json.url,
            starred_url: req.user.profile._json.starred_url.split('{')[0]
        },
        stars: []
    }
    
    UserModel.findOne({username: req.user.profile.username}, function(err, user) {
        if (err) {
            req.flash.error = err;
            req.user = null;
            res.session.user = null;
            return res.redirect('/');
        }


        if (!user) {    // 新用户
            var newUser = new UserModel(userData);

            newUser.save(function(err) {
                if (err) {
                    req.flash.error = err;
                    req.user = null;
                    res.session.user = null;
                    return res.redirect('/');
                }
            });
            // console.log('新用户%s登陆', newUser.username);
        } else {
            var _user = underscore.extend(user, userData);

            _user.save(function(err) {
                if (err) {
                    req.flash.error = err;
                    req.user = null;
                    res.session.user = null;
                    return res.redirect('/');
                }
            });

            // console.log('老用户%s登陆', user.username);
        }
    });

    res.redirect('/');
};
