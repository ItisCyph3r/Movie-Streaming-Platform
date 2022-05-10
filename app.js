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

app.get('/', (req, res) => {
    Movies.find({}, (err, found) => {
        if (err)
            return console.log(err)
        else
            return res.render('index', {
                movie: found
            });
    })
})

app.post('/', (req, res) => {

})

app
    .route('/login')
    .get((req, res) => {
        res.render('login', {});
    })
    .post((req, res) => {
        console.log(req.body.username)
        console.log(req.body.password)

        const user = new Local({
            username: req.body.username,
            password: req.body.password
        })

        

        req.login(user, function (err) {
            if (err) {
                console.log(err)
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect('/')
                })
            }
        })
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
            username: req.body.email
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
                        // await User.register({
                        //         email: req.body.username,
                        //         username: req.body.email,
                        //         raw_password: req.body.password
                        //     },
                        //     req.body.password);
                        // res.redirect('/')

                        Local.register({
                            username: req.body.username,
                            displayname: req.body.displayname
                        }, req.body.password, function (err, user) {
                            if (err) {
                                console.log(err)
                                res.redirect('/signup')
                            } else {
                                res.redirect('/login')
                                // passport.authenticate("local")(req, res, function () {
                                //     res.redirect('/secrets')
                                // })
                            }
                        })
                    }
                });
            }
        })



        // Local.register({
        //     username: req.body.username,
        //     displayName: req.body.displayname
        // }, req.body.password, function (err, user) {
        //     if (err) {
        //         console.log(err)
        //         res.redirect('/signup')
        //     } else {
        //         res.redirect('/login')
        //         // passport.authenticate("local")(req, res, function () {
        //         //     res.redirect('/secrets')
        //         // })
        //     }
        // })
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




app.get('/featured/:postId', (req, res) => {
    // const reqUrl = req.params.postId
    // console.log(reqUrl.toLowerCase())
    Movies.find({}, (err, found) => {
        if (err){}
            // return console.log(err)
        else {
            found.forEach(element => {
                if (req.params.postId === element.name){
                    res.render('stream', {movie:found})
                }

            });
        }
    })
})



app.listen(process.env.YOUR_PORT || process.env.PORT || port, () => {
    console.log('Listening to server on port ' + port)
})