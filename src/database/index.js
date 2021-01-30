const mongoose = require('mongoose');

mongoose.connect(
    "mongodb+srv://ganeko:3DUJasoA9ywCNABu@cluster0.wqrng.mongodb.net/nagro?retryWrites=true&w=majority",
    {useNewUrlParser: true, useUnifiedTopology:true}
);
mongoose.Promise = global.Promise;

module.exports = mongoose;