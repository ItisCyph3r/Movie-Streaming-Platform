const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate')
require('dotenv').config()

mongoose.connect(process.env.USER_SECRET)


const localUserSchema = new mongoose.Schema({
    username: String,
    displayname: String,
    isValid: Boolean,
    uniqueString: String,
    OTP: Number
})

const googleUserSchema = new mongoose.Schema({
    refreshToken: String,
    username: String,
    googleId: String,
    picture: String

})

const FacebookUserSchema = new mongoose.Schema({
    username: String,
    facebookId: String,
    picture: String
})

const InstagramUserSchema = new mongoose.Schema({
    username: String,
    facebookId: String,
    picture: String
})

googleUserSchema.plugin(passportLocalMongoose);
googleUserSchema.plugin(findOrCreate)

FacebookUserSchema.plugin(passportLocalMongoose);
FacebookUserSchema.plugin(findOrCreate)

localUserSchema.plugin(passportLocalMongoose);
localUserSchema.plugin(findOrCreate)

InstagramUserSchema.plugin(passportLocalMongoose);
InstagramUserSchema.plugin(findOrCreate)

const Google = new mongoose.model('GoogleUser', googleUserSchema)
const Facebook = new mongoose.model('FacebookUser', FacebookUserSchema)
const Instagram = new mongoose.model('InstagramUser', InstagramUserSchema)
const Local = new mongoose.model('LocalUser', localUserSchema)


module.exports = {
    Google, Facebook, Instagram, Local
}
