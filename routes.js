const passport = require('passport');
const Account = require('./models/account');
const router = require('express').Router();
module.exports = function(app) {
    app.get('/', function(req, res) {
        res.render('index', {
            user: req.user
        });
    });
    app.get('/register', function(req, res) {
        res.render('register', {});
    });
    app.get('/chat', function(req, res) {
        if (req.user) {
            if (req.user.role != "admin") {
                res.render('chat', {
                    user: req.user
                });
            } else {
                res.render('chatadmin', {
                    user: req.user
                });
            }
        } else {
            res.redirect('/login');
        }
    });
    app.post('/register', function(req, res, next) {
        console.log('registering user');
        console.dir(req.body);
        Account.register(new Account({
            username: req.body.username
        }), req.body.password, function(err) {
            if (err) {
                console.log('error while user register!', err);
                return next(err);
            }
            console.log('user registered!');
            res.redirect('/');
        });
    });
    app.get('/login', function(req, res) {
        res.render('login', {
            user: req.user
        });
    });
    app.get('/money', function(req, res) {
        res.render('money', {
            user: req.user
        });
    });
    app.get('/addmoney', function(req, res) {
        Account.findOne({
            username: req.user.username
        }, (er, rez) => {
            rez.money += 5;
            rez.save((er, rez) => {
                res.json(rez);
            })
        });
    });
    app.get('/getallusers', function(req, res) {
        if (req.user) {
            if (req.user.role == "admin") {
                Account.find((er, rez) => {
                    res.json(rez);
                });
            } else {
                Account.findOne({
                    username: req.user.username
                }, (er, rez) => {
                    res.json([rez]);
                });
            }
        } else {
            res.json({
                error: "не авторизован"
            });
        }
    });
    app.post('/login', passport.authenticate('local'), function(req, res) {
        res.redirect('/');
    });
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
}