module.exports.passport = () => {

    const passport = require('passport');
    const FacebookStrategy = require('passport-facebook').Strategy;
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    const InstagramStrategy = require('passport-instagram').Strategy;
    const {
        Google,
        Facebook,
        Instagram,
        Local
    } = require('./user');

    passport.use(Local.createStrategy());

    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // callbackURL: "http://localhost:3000/auth/google/watch",
            callbackURL: "https://zapnode-tv.onrender.com/auth/google/watch",
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
            callbackURL: "https://zapnode-tv.onrender.com/auth/facebook/watch",
        },
        function (accessToken, refreshToken, profile, cb) {
            const picture = `https://graph.facebook.com/${profile.id}/picture?width=200&height=200&access_token=${accessToken}`

            Facebook.find({
                facebookId: profile.id
            }, (err, found) => {
                if (err)
                    return console.log(err)

                else {
                    if (found.length) {
                        Facebook.findOrCreate({
                            username: profile.displayName,
                            facebookId: profile.id
                        }, function (err, user) {
                            return cb(err, user);
                        })
                    } else {
                        Facebook.findOrCreate({
                            username: profile.displayName,
                            facebookId: profile.id,
                            picture: picture
                        }, function (err, user) {
                            return cb(err, user);
                        });
                    }
                }
                return console.log('Successful')
            })
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
    
    
}
