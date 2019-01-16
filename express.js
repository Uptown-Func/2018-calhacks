/* advanced logging */
const winston = require('winston');
const consoleLogger = new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(info => `[${info.level}] ${info.timestamp} ${info.message}`)
    )
});

const logger = winston.createLogger({
    transports: [
        consoleLogger,
        new winston.transports.File({
            filename: 'test.log',
            level: 'error'
        })
    ]
});

/* API Backbone: Express */
const express = require('express');
const app = express();
const port = process.env.port || 3000;

const username = process.env.mongousername;
const password = process.env.mongopassword;
/* Mongoose to interact with MongoDB */
const mongoose = require('mongoose');
mongoose.connect(`mongodb+srv://${username}:${password}@2018-calhacks-jkqiz.gcp.mongodb.net/user?retryWrites=true`).then(() => {
    logger.info('DB connected');
}).catch(err => {
    logger.error(err);
});

/* the entry schema */
const entry = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true
    },
    productivity_times: {
        type: [Number],
        required: true
    },
    productivity_score: {
        type: Number,
        required: true
    },
    procrastination_times: {
        type: [Number],
        required: true
    },
    procrastination_score: {
        type: Number,
        required: true
    }
}, {
    id: false
});

const entryModel = mongoose.model('Entry', entry);

/* the user schema */
const user = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    model: {
        type: mongoose.Schema.Types.Mixed
    },
    nextPrediction: {
        type: Number,
        get: v => Math.round(v),
        set: v => Math.round(v),
        alias: 'nextTime',
        min: -1,
        max: 23
    },
    entries: {
        type: [entry]
    }
});

const userModel = mongoose.model('User', user);

/* log all requests */
app.use((req, res, next) => {
    logger.info(`[${req.method}] ${req.originalUrl}`);
    next();
});

/* enable body parsing */
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
const multer = require('multer');
const formData = multer();

/**
 * API
 */

app.get('/api', (req, res) => {
    res.send('hello calhacks 2018');
});

/**
 * Authentication endpoints
 */

app.get('/api/auth', (req, res) => {
    res.status(405).send('Wrong method');
});

app.post('/api/auth', (req, res) => {
    logger.verbose(req.params);
    res.send('hello there'); // this should return some entry in mongodb
});

/**
 * User endpoints
 */

app.get('/api/user', (req, res, next) => {
    let id = req.query.id;
    let name = req.query.name;
    logger.verbose(`${name} signed in with id: ${id}`);
    userModel.countDocuments({
        id: id
    }).exec().then(count => {
        logger.verbose(`Found ${count} documents with id ${id}`);
        if (count == 0) {
            userModel.create({
                id: id,
                name: name,
                model: false,
                nextPrediction: -1
            }).then(() => {
                logger.info(`Saved new model ${id}`);
            }).catch(err => {
                logger.error(err);
            });

            next();
        } else {
            // there's already an account!
            logger.verbose('Returning document...');
            userModel.findOne({
                id: id
            }).exec().then(doc => {
                res.send(doc);
            }).catch(err => {
                logger.error(err);
            });
        }
    }).catch(err => {
        logger.error(err);
    });
});

app.post('/api/user/addEntry', formData.none(), (req, res) => {
    let id = req.body.id;
    let body = req.body;

    userModel.countDocuments({
        id: id
    }).exec().then(count => {
        if (count == 0) {
            logger.info(`Attempted to request a document that doesn\'t exist: id ${id}`);
            res.status(404).send('User not found');
        } else {
            let model = new entryModel({
                timestamp: body.timestamp,
                productivity_times: body.productivity_times,
                productivity_score: body.productivity_score,
                procrastination_times: body.procrastination_times,
                procrastination_score: body.procrastination_score
            });

            let dateCheck = (new Date(body.timestamp)).toISOString();
            userModel.findOne({
                id: id
            }).then(doc => {
                let entries = doc.entries.toObject();
                let alreadyHasTimestamp = entries.some(elem => {
                    let time = (new Date(elem.timestamp)).toISOString();
                    logger.verbose(`Analyzing ${time} for repeated timestamp entry`);
                    return time == dateCheck;
                });

                if (alreadyHasTimestamp) {
                    logger.verbose('Repeated timestamp found, no-op');
                    res.status(409).send('Already exists');
                } else {
                    logger.verbose('Pushing new data entry');
                    userModel.updateOne(
                        { id: id },
                        { $push: { entries: model } }
                    ).then(() => {
                        res.status(200).send(model);
                    }).catch(err => {
                        logger.error(err);
                    });
                }
            }).catch(err => {
                logger.error(err);
            });
        }
    }).catch(err => {
        logger.error(err);
    });
});

app.post('/api/user/addEntryMany', formData.none(), (req, res) => {
    let body = req.body;

    body.forEach(body => {
        let id = body.id;
        userModel.countDocuments({
            id: id
        }).exec().then(count => {
            if (count == 0) {
                logger.info(`Attempted to request a document that doesn\'t exist: id ${id}`);
                res.status(404).send('User not found');
            } else {
                let model = new entryModel({
                    timestamp: body.timestamp,
                    productivity_times: body.productivity_times,
                    productivity_score: body.productivity_score,
                    procrastination_times: body.procrastination_times,
                    procrastination_score: body.procrastination_score
                });

                let dateCheck = (new Date(body.timestamp)).toISOString();
                userModel.findOne({
                    id: id
                }).then(doc => {
                    let entries = doc.entries.toObject();
                    let alreadyHasTimestamp = entries.some(elem => {
                        let time = (new Date(elem.timestamp)).toISOString();
                        logger.verbose(`Analyzing ${time} for repeated timestamp entry`);
                        return time == dateCheck;
                    });

                    if (alreadyHasTimestamp) {
                        logger.verbose('Repeated timestamp found, no-op');
                    } else {
                        logger.verbose('Pushing new data entry');
                        userModel.updateOne(
                            { id: id },
                            { $push: { entries: model } }
                        ).catch(err => {
                            logger.error(err);
                        });
                    }
                }).catch(err => {
                    logger.error(err);
                });
            }
        }).catch(err => {
            logger.error(err);
        });
    });
});

app.get('/user/login', (req, res) => {
    res.sendFile('./test.html', {
        root: __dirname
    });
});

app.listen(port, () => {
    logger.info(`Listening on ${port}`);
});
