const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate')

mongoose.connect('mongodb://localhost:27017/MovieDB')

const localUserSchema = new mongoose.Schema({
    username: String,
    password: String,
})

const googleUserSchema = new mongoose.Schema({
    username: String,
    googleId: String,
    picture: String

})

const githubUserSchema = new mongoose.Schema({
    username: String,
    githubId: String,
    picture: String

})

googleUserSchema.plugin(passportLocalMongoose);
googleUserSchema.plugin(findOrCreate)

githubUserSchema.plugin(passportLocalMongoose);
githubUserSchema.plugin(findOrCreate)

localUserSchema.plugin(passportLocalMongoose);
localUserSchema.plugin(findOrCreate)

const Google = new mongoose.model('GoogleUser', googleUserSchema)
const GitHub = new mongoose.model('GitHubUser', githubUserSchema)
const Local = new mongoose.model('LocalUser', localUserSchema)
let a = 1
let b = 2
module.exports = {
    Google, GitHub, Local, a, b
}
