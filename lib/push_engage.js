var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient(),
    cfg = require('../cfg'),
    gcm = require('node-gcm'),
    async = require('async'),
    url = cfg['mongo.url'];

function store(object, cb) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            cb(err);
        } else {
            // Get the documents collection
            var collection = db.collection('subscriber');

            // Insert some users
            collection.insertOne(object, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, result);
                }
                //Close connection
                db.close();
            });
        }
    });
}

function push(notification, cb) {
    var findObject = parseCriteria(notification.notification_criteria);
    MongoClient.connect(url, function (err, db) {
        if (err) {
            cb(err);
        } else {
            // Get the documents collection
            var collection = db.collection('subscriber');

            collection.find(findObject, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    async.each(result, function (obj) {

                    });
                }
                //Close connection
                db.close();
            });
        }
    });
}

function getNotifications() {

}

function parseCriteria(criteria) {
    var find = {
        "$or": [],
        "$and": []
    },
        obj = {};

    for (var i = 0; i < criteria.length; i++) {
        if (criteria[i]['condition'] === '=') {
            obj[criteria[i]['parameter']] = criteria[i]['value'];
        } else {
            if (criteria[i]['condition'] === '>') {
                obj[criteria[i]['parameter']] = {"$gt": criteria[i]['value']};
            }
            else if (criteria[i]['condition'] === '<') {
                obj[criteria[i]['parameter']] = {"$lt": criteria[i]['value']};
            }
        }
        if (criteria[i]['conjunction'] === 'and') {
            find["$and"].push(obj);
        } else {
            find["$or"].push(obj);
        }
    }

    return find;
}

module.exports = {
    push: push,
    parseCriteria: parseCriteria,
    store: store,
    getNotifications: getNotifications
};
