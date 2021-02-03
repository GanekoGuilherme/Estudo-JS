const express = require('express');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();
app.use(express.json());

require("./controllers/index")(app);

app.listen(PORT, HOST);