const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const {Google, Facebook, Instagram, Local} = require(__dirname + '/controllers/user')
const Movies = require(__dirname + '/controllers/movie');
const Constructor = require(__dirname + '/controllers/pageConstructor');
const Strategies = require(__dirname + '/controllers/strategies');
require('dotenv').config()
const app = express();
const port = 3000;
const host = '0.0.0.0'
const https = require('https');
const {Auth} = require('two-step-auth');


let emailErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That email is taken.'
let usernameErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That username is taken.'
let passErrorMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Invalid password, Try again'
let timeOutMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Something went wrong!!! Please try again after sometime.'
let successMsg = '<i class="fa-solid fa-circle-check"></i> Your password has been changed successfully.'
let verifyErrorMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Invalid validation code'
let verifyAcct = '<i class="fa-solid fa-circle-check"></i> This account is verified'
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
                        async function login() {
                            const response = await Auth(req.body.username, "Zapnode");
                            // console.log(response);
                            // console.log(response.mail);
                            // console.log(response.OTP);
                            // console.log(response.success);
                            let {
                                OTP
                            } = await response;
                            Local.register({
                                username: req.body.username,
                                displayname: req.body.displayname,
                                isValid: false,
                                uniqueString: code,
                                OTP: OTP,
                            }, req.body.password, function (err, user) {
                                if (err) {
                                    console.log(err)
                                    res.redirect('/signup')
                                } else {
                                    // console.log(code)
                                    res.redirect(`/verify/${code}`)
                                }
                            })
                        }
                        login()
                    }
                });
            }
        })
    })



// console.log(code)

function verificationCode(count) {
    var chars = 'acdefhiklmnoqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    var result = '';
    for (var i = 0; i < count; i++) {
        var x = Math.floor(Math.random() * chars.length);
        result += chars[x];
    }
    return result;
}

function uuid() {
    const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    const xAndYOnly = /[xy]/g;

    return template.replace(xAndYOnly, (character) => {
        const randomNo = Math.floor(Math.random() * 16);
        const newValue = character === 'x' ? randomNo : (randomNo & 0x3) | 0x8;

        return newValue.toString(16);
    });
}
// console.log(uuid())
// let code = verificationCode(32)
let code = uuid()

app
    .route('/generateToken/:uniqueString')
    .get((req, res) => {

        Local.findOne({
            uniqueString: req.params.uniqueString
        }, (err, doc) => {
            if (doc.isValid === true) {
                res.redirect(`/verify/${req.params.uniqueString}`)
            } else {
                async function OTPgenerator() {
                    const response = await Auth(doc.username, "Zapnode");

                    Local.updateOne({
                        uniqueString: req.params.uniqueString
                    }, {
                        OTP: response.OTP
                    }, {
                        upsert: true
                    }, (err, body) => {
                        if (err) return console.log(err)
                        else {
                            // console.log(body)
                            res.redirect(`/verify/${req.params.uniqueString}`)
                        }
                    })
                }
                OTPgenerator()
            }

        })


    })

app
    .route('/verify/:uniqueString')
    .get((req, res) => {
        Local.findOne({
            uniqueString: req.params.uniqueString
        }, (err, doc) => {
            res.render('verify', {
                verify: '',
                url: doc.uniqueString,
                verifySuccess: '',
                verifyError: '',
                verifyTimeout: ''
            })
        })

    })
    .post((req, res) => {
        Local.findOne({
            uniqueString: req.params.uniqueString
        }, (err, doc) => {
            if (err) return console.log(err)
            if (doc) {

                if (doc.isValid === true) {

                    res.render('verify', {
                        verify: verifyAcct,
                        url: doc.uniqueString,
                        verifySuccess: '',
                        verifyError: '',
                        verifyTimeout: ''
                    })
                } else {

                    if (doc.OTP === parseInt(req.body.one.join(''))) {
                        Local.updateOne({
                            uniqueString: req.params.uniqueString
                        }, {
                            isValid: true
                        }, {
                            upsert: true
                        }, (err, body) => {
                            if (err) return console.log(err)
                            else {

                                res.render('verify', {
                                    verify: '',
                                    url: doc.uniqueString,
                                    verifySuccess: verifySuccessMsg,
                                    verifyError: '',
                                    verifyTimeout: ''
                                })
                            }
                        });
                    } else {

                        res.render('verify', {
                            verify: '',
                            url: doc.uniqueString,
                            verifySuccess: '',
                            verifyError: verifyErrorMsg,
                            verifyTimeout: ''
                        })
                    }
                }
            } else {

                res.render('verify', {
                    verify: '',
                    url: doc.uniqueString,
                    verifySuccess: '',
                    verifyError: '',
                    verifyTimeout: timeOutMsg
                })
            }
        })
    })
let verifySuccessMsg = '<i class="fa-solid fa-circle-check"></i> Email verification successfull'

app.get("/video/:videoid", function (req, res) {
    Movies.find({
        name: req.params.videoid
    }, (err, found) => {
        if (err) return console.log(err)
        else return found.forEach(element => {
            if (req.params.videoid === element.name) {
                // console.log(element.name)
                const url = `${process.env.S3BUCKET}/${element.name}.mp4`
                https.get(url, (stream) => {
                    if (err) return console.log(err)
                    else {

                        let fileLength = stream.headers['content-length'];
                        let contentType = stream.headers['content-type'];
                        // console.log(stream.headers['content-length']);
                        // console.log('====================================');
                        // console.log(stream.headers['content-type']);
                        // console.log('====================================');
                        // console.log(stream.headers)

                        // let chunkSize   = foundMetaFile['chunkSize'];
                        if (req.headers['range']) {
                            // Range request, partialle stream the file
                            // console.log('Range Reuqest');
                            var parts = req.headers['range'].replace(/\D/g, "");
                            var partialStart = parts[0];
                            var partialEnd = parts[1];

                            var start = parseInt(partialStart, 10);
                            var end = partialEnd ? parseInt(partialEnd, 10) : fileLength - 1;
                            var chunkSize = (end - start) + 1;

                            // console.log('Range ', start, '-', end);

                            res.writeHead(206, {
                                'Content-Range': 'bytes ' + start + '-' + end + '/' + fileLength,
                                'Accept-Ranges': 'bytes',
                                'Content-Length': chunkSize,
                                'Content-Type': contentType
                            });

                            stream.pipe(res);
                        } else {
                            res.redirect('/watch')
                        }
                    }
                });
            } else {
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


app.route('/favorites')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            if (req.session.passport.user.userGroup === 'Local') {
                Constructor.searchDBFavorites(Local, req, res)
            } else if (req.session.passport.user.userGroup === 'Google') {
                Constructor.searchDBFavorites(Google, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBFavorites(Facebook, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBFavorites(Instagram, req, res)
            }
        } else {
            res.redirect('/login')
        }
    })

app.route('/analytics')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            if (req.session.passport.user.userGroup === 'Local') {
                Constructor.searchDBAnalytics(Local, req, res)
            } else if (req.session.passport.user.userGroup === 'Google') {
                Constructor.searchDBAnalytics(Google, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBAnalytics(Facebook, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBAnalytics(Instagram, req, res)
            }
        } else {
            res.redirect('/login')
        }
    })

app.route('/reviews')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            if (req.session.passport.user.userGroup === 'Local') {
                Constructor.searchDBReviews(Local, req, res)
            } else if (req.session.passport.user.userGroup === 'Google') {
                Constructor.searchDBReviews(Google, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBReviews(Facebook, req, res)
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Constructor.searchDBReviews(Instagram, req, res)
            }
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

app.get('*', (req, res) => {
    res.render('404')
})

app.listen(process.env.YOUR_PORT || process.env.PORT || port, host, () => {
    console.log('Listening to server on port ' + port)
})