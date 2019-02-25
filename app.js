const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
//const session = require('cookie-session');
var session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const app = express();
var brprouter = require('./routes');

var http = require('http').Server(app);
var io = require('socket.io')(http);
var passportSocketIo = require('passport.socketio');
var MongoStore = require('connect-mongo')(session);
// sessionStore and expressSesion are now saved distinctly
var sessionStore = new MongoStore({
    url: 'mongodb://localhost/passport_local_mongoose'
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(session({
    store: sessionStore,
    key: 'express.sid',
    secret: 'keyboard cat'
}));
app.use(express.static(path.join(__dirname, 'public')));
// Configure passport middleware
app.use(passport.initialize());
app.use(passport.session());
// Configure passport-local to use account model for authentication
const Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());
// Connect mongoose
mongoose.connect('mongodb://localhost/passport_local_mongoose', function(err) {
    if (err) {
        console.log('Could not connect to mongodb on localhost. Ensure that you have mongodb running on localhost and mongodb accepts connections on standard ports!');
    }
});
brprouter(app);
// Register routes
//app.use('/', require('./routes'));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
http.listen(9999, () => {
    console.dir('listen 3333');
});
//With Socket.io >= 1.0 
io.use(passportSocketIo.authorize({
    cookieParser: cookieParser, // the same middleware you registrer in express 
    key: 'express.sid', // the name of the cookie where express/connect stores its session_id 
    store: sessionStore,
    secret: 'keyboard cat', // we NEED to use a sessionstore. no memorystore please 
    success: onAuthorizeSuccess, // *optional* callback on success - read more below 
    fail: onAuthorizeFail, // *optional* callback on fail/error - read more below 
}));

function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io');
    // The accept-callback still allows us to decide whether to 
    // accept the connection or not. 
    accept(null, true);
    // OR 
    // If you use socket.io@1.X the callback looks different 
    accept();
}

function onAuthorizeFail(data, message, error, accept) {
    //if (error) throw new Error(message);
    console.log('failed connection to socket.io:', message);
    // We use this callback to log all of our failed connections. 
    accept(null, false);
    // OR 
    // If you use socket.io@1.X the callback looks different 
    // If you don't want to accept the connection 
    if (error) accept(new Error(message));
    // this error will be sent to the user as a special error-package 
    // see: http://socket.io/docs/client-api/#socket > error-object 
}
io.on('connection', function(socket) {
    try{
    socket.removeAllListeners();
    var user = socket.request.user;
    if (user.logged_in) {
        socket.join(user.username);
    }
    socket.on('chat message', async function(data) {
        if (user.logged_in) {
            if (user.money <= 0) {
                await io.to(user.username).emit('chat message', {
                    username: 'System',
                    msg: 'недостаточно денег',
                    to: user.username,
                });
                return;
            }
            //сохранение сообщения
            var userto;
            if (user.role == 'admin') {
                console.dir(1);
                userto = await Account.findOne({
                    username: data.to
                });
            } else {
                userto = await Account.findOne({
                    username: user.username
                });
            }
            userto.date = Date.now();
            userto.message.push({
                username: user.username,
                msg: data.msg
            });
            await userto.save();
            //оповещение
            if (user.role == 'admin') {
                ['admin', userto.username].forEach((userpicked) => {
                    io.to(userpicked).emit('chat message', {
                        to: userto.username,
                        username: user.username,
                        msg: data.msg
                    });
                });
            } else {
                ['admin', user.username].forEach((userpicked) => {
                    io.to(userpicked).emit('chat message', {
                        to: userto.username,
                        username: user.username,
                        msg: data.msg
                    });
                });
            }
        } else {
            io.emit('chat message', {
                username: 'System',
                msg: 'не зарегистрирован'
            });
        }
    });}
    catch(er){
        console.dir(123);
        console.dir(er);
    }
});