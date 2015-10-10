var mongoose = require('mongoose');

var mongodb_url = global.config.mongodb.host + '/' + global.config.mongodb.name;

mongoose.connect('mongodb://' + mongodb_url);

var UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    accessToken: String,
    github: {
        url: String,
        starred_url: String
    },
    repos: [{
        id: String,
        tags: [String],
        notes: String
    }],
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
});

UserSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
        this.meta.updateAt = Date.now();
    }

    next();
});

UserSchema.statics.findByUsername = function(username, callback) {
    this.findOne({username: username}, function(err, user) {
        if (err) {
            return callback(err);
        }
    
        return callback(null, user);
    });
}

module.exports = UserSchema;
