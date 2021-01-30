const mongoose = require('mongoose');

// import enviroment variables for connect to DB
require('dotenv').config();

// connet on MongoDB atlas
mongoose.connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wqrng.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {useNewUrlParser: true, useUnifiedTopology:true}
);
mongoose.Promise = global.Promise;

module.exports = mongoose;

