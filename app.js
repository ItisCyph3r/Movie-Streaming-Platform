const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const {Google, GitHub, Local} = require(__dirname + '/controllers/user')
const Movies = require('./controllers/movie');
const app = express();
const port = 3000;

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

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    Local.findById(id, (err, user) => {
        done(err, user)
    })
});

let emailErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That email is taken.'
let usernameErr = '&nbsp <i class="fa-solid fa-triangle-exclamation"></i> That username is taken.'
let passErrorMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Invalid password, Try again'

app.get('/watch', (req, res) => {
    if (req.isAuthenticated()) {
        Movies.find({}, (err, found) => {
            if (err)
                return console.log(err)
            else{
                // console.log(found)
                res.render('index', {
                    movie: found
                });
            }
        })
    }
    else{
        res.redirect('/login')
    }
})

app.post('/', (req, res) => {

})

app
    .route('/login')
    .get((req, res) => {
        res.render('login', {'error': ''});
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
                return res.redirect('/')
            })
        })(req, res, next);
    })

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

app.get('/watch/featured/:postId', (req, res) => {
    Movies.find({}, (err, found) => {
        if (err)
            return console.log(err)
        else {
            
            found.forEach(element => {
                if (req.params.postId === element.name){
                    res.render('stream', {
                        title: element.name,
                        description: element.description,
                        image: element.posterImage
                    })
                }

            });
        }
    })
})



app.listen(process.env.YOUR_PORT || process.env.PORT || port, () => {
    console.log('Listening to server on port ' + port)
})