const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');
const expressMongoDb = require('mongo-express-req');
const cloudinary = require('cloudinary').v2;

const getLinkList = require('./functions/link-list'); // My middleware | Builds links list for navbar
const formValidation = require('./functions/formValidation') // Custom form validator
const emails = require('./functions/emails') // Email related functions

const ops = require('./functions/ops')

require('dotenv').config()

// Object storage configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_KEY, 
  api_secret: process.env.CLOUD_SECRET
});

const mongoURL = `mongodb+srv://${process.env.MONGO_NAME}:${process.env.MONGO_KEY}@cluster0.xmwsg.mongodb.net/tfm?retryWrites=true&w=majority`

const routes = require('./routes/index');
const admin = require('./routes/admin');
const target = require('./routes/target');
const connect = require('./routes/posts');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({
  secret: 'max',
  saveUninitialized: false,
  resave: false,
  store: MongoStore.create({ mongoUrl: mongoURL }),  
}));
app.use(expressMongoDb(mongoURL, {useNewUrlParser: true, useUnifiedTopology: true}));

app.use(getLinkList(ops))
app.use(formValidation())
app.use(emails())

app.use('/', routes);
app.use('/admin', admin)
app.use('/target', target)
app.use('/connect', connect)

// --- Error Handeling
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(async function(err, req, res, next) {
        res.status(err.status || 500);
        let links = req.linkList
        if(req.originalUrl.toString().includes('target')) {
            console.log('Error in app...')
            res.render('appError', {
                pages: links,
                message: err.message,
                error: err
            });
        } else {
            console.log('Error out of app...')
            res.render('error', {
                pages: links,
                message: err.message,
                error: err
            });
        }
        console.log(err.message)
        console.log(req.originalUrl)
        console.log(err.stack)
    });
}

// production error handler
// no stacktraces leaked to user
app.use(async function(err, req, res, next) {
    let links = req.linkList
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        pages: links,
        error: {}
    });
});
  

// --- SERVER

const http = require('http')

const PORT = process.env.PORT || 6000

const server = http.createServer(app)

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`) })