const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const {
    Google,
    Facebook,
    Instagram,
    Local
} = require(__dirname + '/controllers/user')
const Movies = require('./controllers/movie');
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

passport.use(Local.createStrategy());

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/watch",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
        Google.findOrCreate({
            googleId: profile.id,
            username: profile.displayName,
            picture: profile._json.picture
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/watch",
        // profileFields: ['id', 'displayName', 'photos', 'email', ]
        
    },
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile)
        let profilePic ='';
        // profile.photos.map((piclink)=>{
        //     console.log(piclink.value);
        //  profilePic = piclink.value;

        // })
        const picture = `https://graph.facebook.com/${profile.id}/picture?width=200&height=200&access_token=${accessToken}`
        // console.log(picture)
        Facebook.findOrCreate({
            username: profile.displayName,
            facebookId: profile.id,
            // picture: picture
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new InstagramStrategy({
        clientID: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
        callbackURL: "https://localhost:3000/auth/instagram/watch",
        scope: ["user_profile"]

    },
    function (accessToken, refreshToken, profile, done) {
        console.log(profile)
        Instagram.findOrCreate({
            instagramId: profile.id
        }, function (err, user) {
            return done(err, user);
        });
    }
));

function SessionConstructor(userId, userGroup, details) {
    this.userId = userId;
    this.userGroup = userGroup;
    this.details = details;
}

passport.serializeUser(function (userObject, done) {
    // userObject could be a Model1 or a Model2... or Model3, Model4, etc.
    let userGroup = "Local";
    let userPrototype = Object.getPrototypeOf(userObject);

    if (userPrototype === Local.prototype) {
        userGroup = "Local";
    } else if (userPrototype === Google.prototype) {
        userGroup = "Google";
    } else if (userPrototype === Facebook.prototype) {
        userGroup = "Facebook";
    } else if (userPrototype === Instagram.prototype) {
        userGroup = "Instagram";
    }

    let sessionConstructor = new SessionConstructor(userObject.id, userGroup, '');
    done(null, sessionConstructor);
});

passport.deserializeUser(function (sessionConstructor, done) {

    if (sessionConstructor.userGroup === "Local") {

        Local.findById({
                _id: sessionConstructor.userId
            },
            (err, user) => {
                done(err, user)
            })
    } else if (sessionConstructor.userGroup === "Google") {

        Google.findById({
                _id: sessionConstructor.userId
            },
            (err, user) => {
                done(err, user)
            })
    } else if (sessionConstructor.userGroup === "Facebook") {

        Facebook.findById({
                _id: sessionConstructor.userId
            },
            (err, user) => {
                done(err, user)
            })
    } else if (sessionConstructor.userGroup === "Instagram") {

        Instagram.findById({
                _id: sessionConstructor.userId
            },
            (err, user) => {
                done(err, user)
            })
    }

});

let emailErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That email is taken.'
let usernameErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That username is taken.'
let passErrorMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Invalid password, Try again'

app
    .route('/')
    .get((req, res) => {
        res.send('<a href="/login"> Login </a>')
    })


app.get('/watch', (req, res) => {
    if (req.isAuthenticated()) {

        function searchDB(db) {
            db.findById(req.user.id, (err, result) => {
                if (err)
                    return console.log(err)
                else {
                    if (result) {
                        Movies.find({}, (err, found) => {
                            if (err)
                                return console.log(err)
                            else {
                                // console.log(result.picture);
                                res.render('index', {
                                    movie: found,
                                    username: result.username,
                                    userpicture: result.picture
                                });
                            }
                        })
                    }
                }
            })
        }
    

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
                                    userpicture: '/images/icons8-user-48.pngicons8-user-48.png'
                                });
                            }
                        })
                    }
                }
            })
        } 
        
        else if (req.session.passport.user.userGroup === 'Google') {
            searchDB(Google)
        }
        else if (req.session.passport.user.userGroup === 'Facebook') {
            // console.log(req.session.passport)
            searchDB(Facebook)
        }
        else if (req.session.passport.user.userGroup === 'Instagram') {
            searchDB(Instagram)
        }










        //     Google.findById(req.user.id, (err, result) => {
        //         if (err)
        //             return console.log(err)
        //         else {
        //             if (result) {
        //                 Movies.find({}, (err, found) => {
        //                     if (err)
        //                         return console.log(err)
        //                     else {
        //                         // console.log(result.picture);
        //                         res.render('index', {
        //                             movie: found,
        //                             username: result.username,
        //                             userpicture: result.picture
        //                         });
        //                     }
        //                 })
        //             }
        //         }
        //     })
        // } else if (req.session.passport.user.userGroup === 'Facebook') {
        //     Facebook.findById(req.user.id, (err, result) => {
        //         if (err)
        //             return console.log(err)
        //         else {
        //             if (result) {
        //                 Movies.find({}, (err, found) => {
        //                     if (err)
        //                         return console.log(err)
        //                     else {
        //                         res.render('index', {
        //                             movie: found,
        //                             username: result.username,
        //                             userpicture: result.picture
        //                         });
        //                     }
        //                 })
        //             }
        //         }
        //     })
        // } else if (req.session.passport.user.userGroup === 'Instagram') {
        //     Instagram.findById(req.user.id, (err, result) => {
        //         if (err)
        //             return console.log(err)
        //         else {
        //             if (result) {
        //                 Movies.find({}, (err, found) => {
        //                     if (err)
        //                         return console.log(err)
        //                     else {
        //                         res.render('index', {
        //                             movie: found,
        //                             username: result.username,
        //                             userpicture: result.picture
        //                         });
        //                     }
        //                 })
        //             }
        //         }
        //     })
        // }
    } else {
        res.redirect('/login')
    }
})

app.post('/', (req, res) => {

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
    .get(passport.authenticate('facebook', {scope: ['public_profile']}));

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
                console.log('user exists')
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
                        console.log('user exists')
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



app.get("/video", function (req, res) {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const videoPath = __dirname + "/samples/spiderman-no-way-home.mkv";
    const videoSize = fs.statSync(__dirname + "/samples/spiderman-no-way-home.mkv").size;
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
});

app
    .route('/watch/featured/:postId')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            if (req.session.passport.user.userGroup === 'Google') {
                Google.findById(req.user.id, (err, result) => {
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
                                            console.log(result.picture)
                                            res.render('stream', {
                                                username: result.username,
                                                userpicture: result.picture,
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
            } else if (req.session.passport.user.userGroup === 'Facebook') {
                Facebook.findById(req.user.id, (err, result) => {
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
                                                userpicture: '/images/profile.jpg',
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
            } else if (req.session.passport.user.userGroup === 'Instagram') {
                Instagram.findById(req.user.id, (err, result) => {
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
                                                userpicture: result.picture,
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
            } else {
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
                                                userpicture: '/images/profile.jpg',
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
            }
        } else {
            res.redirect('/login')
        }
    })



app.route('/settings')
    .get((req, res) => {
        res.render('settings')
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