const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/detail', (req, res) => {
  res.render('detail.ejs');
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.listen(3000);