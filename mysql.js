// MySQL connection pool
var mysql = require('mysql'),
    cfg = require('./cfg'),
    logger = require('./logger'),
    ctr = 0,
    connTimeout = 1000,

    pool = mysql.createPool({
        connectionLimit: cfg['mysql.pool.connlimit'],
        host: cfg['mysql.db.host'],
        user: cfg['mysql.db.user'],
        password: cfg['mysql.db.password'],
        database: cfg['mysql.db.name'],
        socketPath: cfg['mysql.sock']
    }),

    // To keep a track of opened connections and their Ids, we should track all connection requests
    getConn = pool.getConnection.bind(pool);

pool.getConnection = function (cb) {
    // Record this stack point, in case not released
    var thisConnErr = new Error();

    // Get a connection the standard way
    getConn(function (err, conn) {
        var release;
        if (err) {
            return cb(err);
        }

        conn.szStack = thisConnErr;
        conn.szWarned = false;
        conn.szInitTime = new Date();

        clearTimeout(conn.szTimer);
        conn.szTimer = setTimeout(function () {
            conn.szWarned = true;
            logger.warn('mysql-pool', 'Conn', conn.szId, 'not released after', connTimeout, 'ms', conn.szStack.stack);
        }, connTimeout);

        if (!conn.szId) {
            conn.szId = ++ctr;

            release = conn.release.bind(conn);
            conn.release = function () {
                clearTimeout(conn.szTimer);
                if (conn.szWarned) {
                    logger.info('mysql-pool', 'Conn', conn.szId, 'was finally released after', new Date() - conn.szInitTime, 'ms');
                }
                release();
            };
        }

        cb(null, conn);
    });
};

module.exports = pool;
