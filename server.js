var cookieParser = require('cookie-parser'),
    onResponse = require('on-response'),
    express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    logger = require('./logger'),
    app = express(),
    ctr = 0;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Create a logger for this request. This will help to display request
// information in logs
app.use(function (req, res, next) {
    req.req_id = ++ctr;

    req.logger = logger.child({
        req_id: req.req_id,
        url: req.url,
        method: req.method,
        cookies: req.cookies
    });

    next();
});

// Log all requests once the response is sent. Style of logging mimics nginx
app.use(function (req, res, next) {
    onResponse(req, res, function () {
        // Default logger level is 'debug'
        var level = 'debug';

        // If response status is 40X, logger level becomes 'warn'
        if (res.statusCode >= 400 && res.statusCode < 500) {
            level = 'warn';
        }

        // If response status is 50X, logger level becomes 'error'
        if (res.statusCode >= 500) {
            level = 'error';
        }

        req.logger[level](
            '%s - %s [%s] "%s %s HTTP/%s" %s %s "%s" "%s"',
            morgan['remote-addr'](req, res),
            morgan['remote-user'](req, res),
            morgan.date(req, res, 'clf'),
            morgan.method(req, res),
            morgan.url(req, res),
            morgan['http-version'](req, res),
            morgan.status(req, res),
            morgan.res(req, res, 'content-length'),
            morgan.referrer(req, res),
            morgan['user-agent'](req, res)
        );
    });

    next();
});

// Routes go here
app.use('/', require('./routes/push_engage'));

// Error handler
app.use(function (err, req, res, next) {
    var defaultMsgs, status;

    // This if condition is to escape jshint's unused argument error
    // Express needs a function with 4 args for error handling, but the
    // 4th arg is never used
    if (!err) {
        next();
    }

    defaultMsgs = {
        400: 'Bad data',
        401: 'Need authentication',
        403: 'Forbidden'
    };
    status = err.status || 500;

    req.logger.warn(err);
    res.status(status);
    res.jsonp({
        error: err.customMsg || defaultMsgs[status] || 'Unknown server error'
    });
});

// 404 handler
app.use(function (req, res) {
    res.status(404);
    res.jsonp({
        error: res.msg404 || 'Resource not found'
    });
});

module.exports = app;
