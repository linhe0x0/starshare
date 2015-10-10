exports.index = function(req, res) {
    var user = req.session.user || {}; 

	if (!user.username) {
		return res.render('login', {});
	}
	
	res.render('index', {
		user: user
	});
};

exports.logout = function(req, res) {
    req.session.user = null;

    res.redirect('/');
};
