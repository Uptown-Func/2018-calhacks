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

/* stream logs to console */
consoleLogger.on('finshed', log => {
    console.log(log);
});

/* API Backbone: Express */
const express = require('express');
const app = express();
const port = process.env.port || 3000;

/* Mongoose to interact with MongoDB */
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/users', {useNewUrlParser: true}).then(() => {
    logger.info('DB connected');
}).catch(err => {
    logger.error(err);
});

const userModel = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    model: {
        type: Buffer
    },
    nextPrediction: {
        type: Number,
        get: v => Math.round(v),
        set: v => Math.round(v),
        alias: 'nextTime',
        min: 0,
        max: 23
    }
});

/* log all requests */
app.use((req, res, next) => {
    logger.info(`[${req.method}] ${req.originalUrl}`);
    next();
});

app.get('/api', (req, res) => {
    res.send('hello calhacks 2018');
});

app.get('/api/auth', (req, res) => {
    res.status(405).send('Wrong method');
});

app.post('/api/auth', (req, res) => {
    logger.verbose(req.params);
    res.send('hello there'); // this should return some entry in mongodb
});


/* Creating a new user */
app.post('/api/auth/new', (req, res) => {

});

app.patch('/api/user/data/:entry', (req, res) => {
    logger.verbose(`updating user field ${req.params.entry} to ${req.body}`);
});

app.listen(port, () => {
    logger.info(`Listening on ${port}`);
});
