var _ = require('lodash'),
    env = process.env.NODE_ENV || 'development',

    defaults = {
        // This can be used for rendering absolute urls in templates
        baseurl: 'http://sampleapp.service.stayzilla.com',

        'mysql.db.host': 'localhost',
        'mysql.db.name': 'test',
        'mysql.db.user': 'root',
        'mysql.db.password': '',

        // mysql socket path. When used, host and port are ignored
        'mysql.sock': null,

        // Simultaneous connection limit for mysql pool
        'mysql.pool.connlimit': 5,

        'newrelic.licensekey': null,

        'mongo.url': 'mongodb://localhost:27017/push_engage',

        // Which port will this application run on
        port: 8080
    };

module.exports  = _.extend(defaults, require('./' + env));
