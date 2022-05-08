const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const lodash = require('lodash');
const Movies = require('./controllers/movie');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));



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