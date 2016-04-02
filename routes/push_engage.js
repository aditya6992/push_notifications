var express = require('express'),
    router = express.Router(),
    push_engage = require('../lib/push_engage');

router.post('/subscribe', function (req, res) {
    var body = {
        subscriber_id: req.body.subscriber_id,
        browser_name: req.body.browser_name,
        browser_engine: req.body.browser_engine,
        browser_version: req.body.browser_version,
        user_agent: req.body.user_agent,
        platform: req.body.platform,
        language: req.body.language,
        total_scr_width_height: req.body.total_scr_width_height,
        available_scr_width_height: req.body.available_scr_width_height,
        colour_resolution: req.body.colour_resolution,
        host: req.body.host,
        device: req.body.device,
        device_model: req.body.device_model,
        device_manufacturer: req.body.device_manufacturer,
        custom_parameter_gender: req.body.custom_parameter_gender,
        custom_parameter_age: req.body.custom_parameter_age
    };

    for (var key in body) {
        if (body.hasOwnProperty(key)) {
            if(!body[key]) {
                return res.json({
                    success: false,
                    existing: false,
                    message: "missing " + key
                });
            }
        }
    }

    push_engage.store(body, function (error, response) {
        if (error) {
            return res.json({
                success: false,
                existing: false,
                message: error
            });
        }
        res.json({
            success: true,
            existing: false,
            message: ""
        });
    });
});

router.post('/notify', function (req, res) {
    var body = {
        notification_title: req.body.notification_title,
        notification_message: req.body.notification_message,
        notification_url: req.body.notification_url,
        notification_criteria: req.body.notification_criteria,
        site_id: req.body.site_id
    };

    for (var key in body) {
        if (body.hasOwnProperty(key)) {
            if(!body[key]) {
                return res.json({
                    success: false,
                    existing: false,
                    message: "missing " + key
                });
            }
        }
    }

    try {
        body.notification_criteria = JSON.parse(body.notification_criteria);
    } catch (e) {
        return res.json({
            success: false,
            existing: false,
            message: "json parse error: notification_criteria is not a valid json"
        });
    }

    push_engage.push(body, function (error, response) {
        if (error) {
            return res.json({
                success: false,
                existing: false,
                message: error
            });
        }
        res.json({
            success: true,
            existing: false,
            message: ""
        });
    });
});

router.get('/notifications/:subscriber_id', function (req, res) {
    push_engage.getNotifications(req.params.subscriber_id, function (error, response) {
        if (error) {
            return res.json({
                success: false,
                existing: false,
                message: error
            });
        }
        res.json(response);
    })
});



module.exports = router;
