const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/MovieDB')

const movieSchema = new mongoose.Schema({
    id: Number,
    name: String,
    posterImage: String,
    actors: String,
    description: String
})

module.exports = mongoose.model('movie', movieSchema);