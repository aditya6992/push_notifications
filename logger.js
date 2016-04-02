var bunyan = require('bunyan'),
    appdata = require('./package.json'),

    logger = bunyan.createLogger({
        name: appdata.name,

        streams: [
            {
                type: 'rotating-file',
                path: appdata.name + '.log',
                period: '1d',
                level: 'info',
                count: 10
            },
            {
                level: 'trace',
                stream: process.stdout
            }
        ],

        serializers: bunyan.stdSerializers
    });

module.exports = logger;
