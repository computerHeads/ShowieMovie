const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const mysql = require('./scripts/dbcon.js');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('css'));
app.use(express.static('scripts'));

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('port', 6548);

// default route for loading the page
app.get('/', (req, res, next) => {
    res.render('home');
});

// route for saved
app.get('/saved', (req, res, next) => {
    res.render('saved')
})

// route for edit
app.get('/edit', (req, res, next) => {
    res.render('edit')
})

app.listen(app.get('port'), function () {
    console.log(`Express started on http://${process.env.HOSTNAME}:${app.get('port')}; press Ctrl-C to terminate.`);
});