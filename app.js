const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const app = express();

app.use(express.json()); // JSON形式のボディを解析するため
app.use(express.urlencoded({ extended: true })); // URLエンコードされたボディを解析するため

app.use(express.static('public'));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'yuna52300120',
  database: 'yuhiwebsystem'
});

app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
)

app.use((req, res, next) => {
  if(req.session.userId === undefined){
    console.log("ログインしていません");
    res.locals.userName = "ゲスト";
  } else {
    console.log("ログインしています");
    res.locals.userName= req.session.userName;
  }
  next();
});

app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/detail', (req, res) => {
  res.render('detail.ejs');
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      console.log(error);
      if(results.length > 0){
        if(results[0].password === password){
          //一時的処置。デプロイ時には変更する -> github-issue#121
          req.session.userId = results[0].id;
          req.session.userName = results[0].username;
          res.redirect('/');
          console.log("ログイン成功");
        }else{
          res.redirect('/login');
          console.log("ログイン失敗");
        }
      } else {
        res.redirect('/login');
        console.log("ログイン失敗");
      }
    }
  )
});

app.listen(3000);