const express = require('express');
const bodyParser = require('express').json;
const routes = require('./routes');


const app = express();
app.use(bodyParser());
app.use('/api', routes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening ${PORT}`));


module.exports = app; 