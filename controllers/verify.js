const {Local} = require(__dirname + '/user')
const mongoose = require('mongoose');
Local.findOne({uniqueString: 't10shuXNN7PIxRKVrvZdoMBo3Vc5m3tH'}, (err, doc) => {
    console.log(doc)
})