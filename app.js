require('newrelic');

var app = require('./server'),
    cfg = require('./cfg'),
    logger = require('./logger');

app.listen(cfg.port, function () {
    logger.info('Express app listening on port %d', cfg.port);
});
