const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://zapnodeAdmin:n5vYkFPVKjiFG01S@Zapnode.rh2p8.mongodb.net/MovieDB')

const movieSchema = new mongoose.Schema({
    id: Number,
    name: String,
    posterImage: String,
    actors: String,
    description: String
})

module.exports = mongoose.model('movie', movieSchema);