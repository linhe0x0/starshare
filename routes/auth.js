exports.user = function(req, res) {
    var user = req.session.user;

    res.json({
        status: 0,
        statusInfo: 'OK',
        data: user
    });
};
