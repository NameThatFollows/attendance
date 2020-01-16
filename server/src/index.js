require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

const api = require('./api');

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

app.use(express.json());

app.use(express.static(path.join(__dirname, '../build/public')));
app.use('/api', api);
app.use('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './public/index.html'));
});

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);
