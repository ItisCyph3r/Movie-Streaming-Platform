const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const nodemailer = require('nodemailer');
const {
    Google,
    Facebook,
    Instagram,
    Local
} = require(__dirname + '/controllers/user')
const Movies = require(__dirname + '/controllers/movie');
const Constructor = require(__dirname + '/controllers/pageConstructor');
const Strategies = require(__dirname + '/controllers/strategies');
require('dotenv').config()
const app = express();
const port = 3000;
const host = '0.0.0.0'
const https = require('https');
const {
    response
} = require('express');

let emailErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That email is taken.'
let usernameErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That username is taken.'
let passErrorMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Invalid password, Try again'
let timeOutMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Something went wrong!!! Please try again after sometime.'
let successMsg = '<i class="fa-solid fa-circle-check"></i> Your password has been changed successfully.'

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

Strategies.passport()

app
    .route('/')
    .get((req, res) => {
        res.send('<a href="/login"> Login </a>')
    })
    .post((req, res) => {

    })



app.get('/watch', (req, res) => {
    if (req.isAuthenticated()) {
        if (req.session.passport.user.userGroup === 'Local') {
            Constructor.searchDB(Local, req, res)
        } else if (req.session.passport.user.userGroup === 'Google') {
            Constructor.searchDB(Google, req, res)
        } else if (req.session.passport.user.userGroup === 'Facebook') {
            Constructor.searchDB(Facebook, req, res)
        } else if (req.session.passport.user.userGroup === 'Instagram') {
            Constructor.searchDB(Instagram, req, res)
        }
    } else {
        res.redirect('/login')
    }
})

app
    .route('/login')
    .get((req, res) => {
        res.render('login', {
            'error': ''
        });
    })
    .post((req, res, next) => {
        // console.log(req.body.username)
        // console.log(req.body.password)

        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return console.log(err)
            }

            if (!user) {
                return res.render('login', {
                    'error': passErrorMsg
                })
            }
            req.login(user, (err) => {
                if (err) {
                    return next(err)
                }
                return res.redirect('/watch')
            })
        })(req, res, next);
    })

app
    .route('/auth/google')
    .get(passport.authenticate('google', {
        scope: ['profile']
    }));

app.get('/auth/google/watch',
    passport.authenticate('google', {
        failureRedirect: '/login',
        failureMessage: true
    }),
    function (req, res) {
        res.redirect('/watch');
    });

app
    .route('/auth/facebook')
    .get(passport.authenticate('facebook', {
        scope: ['public_profile']
    }));

app
    .route('/auth/facebook/watch')
    .get(passport.authenticate('facebook', {
            failureRedirect: '/login',
            failureMessage: true
        }),
        function (req, res) {
            res.redirect('/watch');
        });

app
    .route('/auth/instagram')
    .get(passport.authenticate('instagram'));

app
    .route('/auth/instagram/watch')
    .get(passport.authenticate('instagram', {
            failureRedirect: '/login'
        }),
        function (req, res) {
            // Successful authentication, redirect home.
            res.redirect('/watch');
        });

app
    .route('/signup')
    .get((req, res) => {
        res.render('signup', {
            'error': '',
            'pass_error': '',
            'usernameErr': ''
        });
    })
    .post((req, res) => {
        Local.find({
            username: req.body.username
        }, (err, docs) => {
            if (docs.length) {
                res.render('signup', {
                    'error': emailErr,
                    'pass_error': '',
                    'usernameErr': ''
                })
            } else {
                Local.find({
                    displayname: req.body.displayname
                }, async (err, docs) => {
                    if (docs.length) {
                        res.render('signup', {
                            'error': '',
                            'usernameErr': usernameErr,
                            'pass_error': ''
                        })
                    } else {
                        // const sendMail = (email, uniqueString) => {
                        //     var Transport = nodemailer.createTransport({
                        //         service: 'Gmail',
                        //         auth: {
                        //             user: process.env.EMAIL,
                        //             pass: process.env.PASS
                        //         }
                        //     });
                        //     const userkey = verificationCode(6)
                        //     var mailOptions;
                        //     let sender = 'Zapnode';
                        //     mailOptions = {
                        //         from: sender,
                        //         to: email,
                        //         subject: 'Email Confirmation',
                        //         html: `Your verification code is ${uniqueString}`
                        //         // html: `Press <a href= "http://localhost:3000/verify/${uniqueString}"> here </a> to verify your email. Thanks`
                        //     };

                        //     Transport.sendMail(mailOptions, (err, response) => {
                        //         if (err) return console.log(err)
                        //         else return console.log(`${response} and Message Sent`)
                        //     });

                        // }


                        // sendMail(req.body.username, code)

                        // console.log(userkey)
                        const sendMail = (email, uniqueString) => {
                            const mailgun = require("mailgun-js");
                            const DOMAIN = 'https://api.mailgun.net/v3/sandbox39e2e6cdd0354240be28ee24209e8779.mailgun.org';
                            const mg = mailgun({
                                apiKey: '397950ce67073ef4b67e056fe8315c7f-5e7fba0f-2495afbb',
                                domain: DOMAIN
                            });
                            const data = {
                                from: 'Zapnode',
                                to: email,
                                subject: 'VERIFICATION CODE',
                                text: `Your verification code is ${uniqueString}`
                            };
                            mg.messages().send(data, function (error, body) {
                                if (error) return console.log(error)
                                else return console.log(body)
                            });

                        }
                        sendMail(req.body.username, code)
                        Local.register({
                            username: req.body.username,
                            displayname: req.body.displayname,
                            isValid: false,
                            uniqueString: code
                        }, req.body.password, function (err, user) {
                            if (err) {
                                console.log(err)
                                res.redirect('/signup')
                            } else {
                                console.log(code)
                                res.redirect('/verify')
                            }
                        })
                    }
                });
            }
        })
    })

function randString() {
    const len = 8;
    let randStr = '';
    for (let i = 0; i < len; i++) {
        const ch = Math.floor((Math.random() * 10) + 1)
        randStr += ch
    }
    return randStr
}
let code = verificationCode(6)
console.log(code)

function verificationCode(count) {
    var chars = 'acdefhiklmnoqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    var result = '';
    for (var i = 0; i < count; i++) {
        var x = Math.floor(Math.random() * chars.length);
        result += chars[x];
    }
    return result;
}

console.log(verificationCode(6))
app
    .route('/verify')
    .get((req, res) => {
        res.render('verify', {})
    })
    .post((req, res) => {
        if (req.body.verification === code) {
            res.redirect('/login')
        } else {
            res.redirect('/signup')
        }
    })
app
    .route('/verify/:uniqueString')
    .get((req, res) => {
        const uniqueString = req.params.uniqueString
        // console.log(uniqueString)

    })


app.get("/video/:videoid", function (req, res) {
    Movies.find({name: req.params.videoid}, (err, found) => {
        if (err) return console.log(err)
        else return found.forEach(element => {
            if (req.params.videoid === element.name) {
                console.log(element.name)
                const url = `${process.env.S3BUCKET}/${element.name}.mp4`
                https.get(url, (stream) => {
                    if(err) return console.log(err)
                    else return stream.pipe(res);
                });
            }
            else {
                res.redirect('/watch');
            }
        })
    })
})


app
    .route('/watch/featured/:postId')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            if (req.session.passport.user.userGroup === 'Local') {
                Constructor.searchDBStream(Local, req, res)
            } else if (req.session.passport.user.userGroup === 'Google') {
                Constructor.searchDBStream(Google, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBStream(Facebook, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBStream(Instagram, req, res)
            }
        } else {
            res.redirect('/login')
        }
    })



app.route('/settings')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            if (req.session.passport.user.userGroup === 'Local') {
                Constructor.searchDBSettings(Local, req, res)
            } else if (req.session.passport.user.userGroup === 'Google') {
                Constructor.searchDBSettings(Google, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBSettings(Facebook, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBSettings(Instagram, req, res)
            }
        } else {
            res.redirect('/login')
        }
    })
    .post((req, res) => {
        if (req.isAuthenticated()) {
            if (req.session.passport.user.userGroup === 'Local') {
                Local.findOne({
                    _id: req.user.id
                }, (err, user) => {

                    // Check if error connecting
                    if (err) {
                        res.json({
                            success: false,
                            message: err
                        });
                    } // Return error
                    else {
                        // Check if user was found in database
                        if (!user) {
                            res.json({
                                success: false,
                                message: 'User not found'
                            });
                        } // Return error, user was not found in db
                        else {
                            user.changePassword(req.body.password, req.body.newpassword, function (err) {
                                if (err) {
                                    if (err.name === 'IncorrectPasswordError') {
                                        Constructor.searchDBSettings(Local, req, res, passErrorMsg, '', '')
                                    } else {
                                        Constructor.searchDBSettings(Local, req, res, '', timeOutMsg, '')
                                    }
                                } else {
                                    Constructor.searchDBSettings(Local, req, res, '', '', successMsg)
                                }
                            })
                        }
                    }
                })
            } else if (req.session.passport.user.userGroup === 'Google') {
                Constructor.searchDBSettings(Google, req, res, '', timeOutMsg, '')
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBSettings(Facebook, req, res, '', timeOutMsg, '')
            } else if (req.session.passport.user.userGroup === 'Instagram') {
                Constructor.searchDBSettings(Instagram, req, res, '', timeOutMsg, '')
            }

            console.log(req.body.password);
            console.log(req.body.newpassword);
            console.log(req.body.repassword);
        } else {
            res.redirect('/login')
        }
    })





app
    .route('/logout')
    .get((req, res) => {
        req.logout();
        res.redirect('/login');
    })
    .post((req, res) => {

    })

app.listen(process.env.YOUR_PORT || process.env.PORT || port, host, () => {
    console.log('Listening to server on port ' + port)
})