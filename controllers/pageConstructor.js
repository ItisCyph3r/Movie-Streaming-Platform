const Movies = require('./movie');
const {Local} = require('./user')
module.exports.searchDB = (db, req, res, next) => {
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

module.exports.searchDBStream = (db, req, res, next) => {
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
}

module.exports.searchDBSettings = (db, req, res, error, timeout, success) => {
    if(db === Local){
        db.findById(req.user.id, (err, result) => {
            if (err)
                return console.log(err)
            else {
                if (result) {
                    res.render('settings', {
                        username: result.displayname,
                        userpicture: '/images/icons8-user-48.png',
                        error: error,
                        timeout: timeout,
                        success: success
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
                    res.render('settings', {
                        username: result.username,
                        userpicture: result.picture,
                        error: error,
                        timeout: timeout,
                        success: success
                    })
                }
            }
        })
    }
}
