const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
// const FacebookStrategy = require('passport-facebook').Strategy;
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const InstagramStrategy = require('passport-instagram').Strategy;
const {Google, Facebook, Instagram, Local} = require(__dirname + '/controllers/user')
const Movies = require(__dirname + '/controllers/movie');
const Constructor = require(__dirname + '/controllers/pageConstructor');
const Strategies = require(__dirname + '/controllers/strategies');
require('dotenv').config()
const app = express();
const port = 3000;
const host = '0.0.0.0'


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
            Local.findById(req.user.id, (err, result) => {
                // console.log(result);
                if (err)
                    return console.log(err)
                else {
                    if (result) {
                        Movies.find({}, (err, found) => {
                            if (err)
                                return console.log(err)
                            else {
                                // console.log(result.picture)
                                res.render('index', {
                                    movie: found,
                                    username: result.displayname,
                                    userpicture: '/images/icons8-user-48.png'
                                });
                            }
                        })
                    }
                }
            })
        } else if (req.session.passport.user.userGroup === 'Google') {
            Constructor.searchDB(Google, req, res)
        } else if (req.session.passport.user.userGroup === 'Facebook') {
            Constructor.searchDB(Facebook, req, res)
        } else if (req.session.passport.user.userGroup === 'Instagram') {
            searchDB(Instagram, req, res)
        }
    } else {
        res.redirect('/login')
    }
})

let emailErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That email is taken.'
let usernameErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That username is taken.'
let passErrorMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Invalid password, Try again'
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
                        Local.register({
                            username: req.body.username,
                            displayname: req.body.displayname
                        }, req.body.password, function (err, user) {
                            if (err) {
                                console.log(err)
                                res.redirect('/signup')
                            } else {
                                setTimeout(() => {
                                    res.redirect('/login')
                                }, 5000)
                            }
                        })
                    }
                });
            }
        })
    })



app.get("/video/:videoid", function (req, res) {
            const range = req.headers.range;
            if (!range) {
                res.status(400).send("Requires Range header");
            }
            // console.log(req.params.videoid)
            // 
            Movies.find({
                    name: req.params.videoid
                }, (err, found) => {
                    if (err)
                        return console.log(err)
                    else {
                        found.forEach(element => {
                            // console.log(req.params.videoid)
                            // console.log(element.name);
                            if (req.params.videoid === element.name) {
                                const videoPath = __dirname + '/samples/' + element.name + '.mp4';
                                const videoSize = fs.statSync(__dirname + '/samples/' + element.name + '.mp4').size;
                                const CHUNK_SIZE = 10 ** 6;
                                const start = Number(range.replace(/\D/g, ""));
                                const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
                                const contentLength = end - start + 1;
                                const headers = {
                                    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                                    "Accept-Ranges": "bytes",
                                    "Content-Length": contentLength,
                                    "Content-Type": "video/mp4",
                                };
                                res.writeHead(206, headers);
                                const videoStream = fs.createReadStream(videoPath, {
                                    start,
                                    end
                                });
                                    videoStream.pipe(res);
                            }
                            else {
                                console.log('error');
                            }
                        })
                    }
                }
            )
        }
    )

            

        app
        .route('/watch/featured/:postId')
        .get((req, res) => {
            if (req.isAuthenticated()) {
                if (req.session.passport.user.userGroup === 'Local') {
                    Local.findById(req.user.id, (err, result) => {
                        // console.log(result);
                        if (err)
                            return console.log(err)
                        else {
                            if (result) {
                                Movies.find({}, (err, found) => {
                                    if (err)
                                        return console.log(err)
                                    else {

                                        found.forEach(element => {
                                            if (req.params.postId === element.name) {
                                                res.render('stream', {
                                                    username: result.displayname,
                                                    userpicture: '/images/icons8-user-48.png',
                                                    title: element.name,
                                                    description: element.description,
                                                    image: element.posterImage
                                                })
                                            }
                                        });
                                    }
                                })

                            }
                        }
                    })
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
                    Local.findById(req.user.id, (err, result) => {
                        if (err)
                            return console.log(err)
                        else {
                            res.render('settings', {
                                username: result.displayname,
                                userpicture: '/images/icons8-user-48.png'
                            })
                        }
                    })
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