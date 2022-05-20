const Movies = require('./movie');
const {
    Local
} = require('./user')
module.exports.searchDB = (db, req, res, next) => {
    if (db === Local) {
        db.findById(req.user.id, (err, result) => {
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
                                userpicture: '<i class="uil uil-user-circle"></i>'
                            });
                        }
                    })
                }
            }
        })
    }
    else{
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
                                // userpicture: result.picture
                                userpicture: `<img src= ${result.picture} alt="">`
                            });
                        }
                    })
                }
            }
        })
    }
}

module.exports.searchDBStream = (db, req, res, next) => {
    if (db === Local) {
        db.findById(req.user.id, (err, result) => {
            // console.log(result);
            if (err)
                return console.log(err)
            else {
                if (result) {
                    Movies.find({}, (err, found) => {
                        if (err)
                            return console.log(err)
                        else {
                            console.log(result.displayname)
                            found.forEach(element => {
                                if (req.params.postId === element.name) {
                                    res.render('stream', {
                                        username: result.displayname,
                                        userpicture: '<i class="uil uil-user-circle"></i>',
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
        db.findById(req.user.id, (err, result) => {
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
                                        username: result.username,
                                        userpicture: `<img src= ${result.picture} alt="">`,
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

}

module.exports.searchDBSettings = (db, req, res, error, timeout, success) => {
    if (db === Local) {
        db.findById(req.user.id, (err, result) => {
            if (err)
                return console.log(err)
            else {
                if (result) {
                    res.render('settings', {
                        username: result.displayname,
                        userpicture: '<i class="uil uil-user-circle"></i>',
                        error: error,
                        timeout: timeout,
                        success: success
                    })
                }
            }
        })
    } else {
        db.findById(req.user.id, (err, result) => {
            if (err)
                return console.log(err)
            else {
                if (result) {
                    res.render('settings', {
                        username: result.username,
                        userpicture: `<img src= ${result.picture} alt="">`,
                        error: error,
                        timeout: timeout,
                        success: success
                    })
                }
            }
        })
    }
}