// net start mysql57 にてmysqlを起動すること忘れずに
//mysql --user=root --passwordにてmysqlにログイン

const e = require('express');
const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
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
    res.locals.isLoggedIn = false;
    console.log("ログインしていません");
    res.locals.userName = "ゲスト";
    res.locals.userStatus = "None";
  } else {
    res.locals.isLoggedIn = true;
    console.log("ログインしています");
    res.locals.userName= req.session.userName;
    res.locals.userStatus = req.session.userStatus;
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

app.get('/signup', (req, res) => {
  res.render('signup.ejs', { errors: [] });
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
        const plain = req.body.password;
        const hash = results[0].password;
        bcrypt.compare(plain, hash, (error, isEqual) => {
          if(isEqual){
            req.session.userId = results[0].id;
            req.session.userName = results[0].username;
            res.redirect('/');
          }else{
            res.redirect('/login');
          }
        });
      }
    }
  )
});

app.post('/signup',
  (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];
    if(username === ""){
      errors.push('ユーザー名が空です');
    }
    if(email === ""){
      errors.push('メールアドレスが空です');
    }
    if(password === ""){
      errors.push('パスワードが空です');
    }
    if(errors.length > 0){
      res.render('signup.ejs', { errors: errors });
    } else {
      next();
    }
  },
  (req, res, next) => {
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if(results.length > 0){
          errors.push('このメールアドレスは既に使用されています');
          res.render('signup.ejs', { errors: errors });
        } else {
          next();
        }
      }
    )
  },
  (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  bcrypt.hash(password,10,(error,hash) => {
    connection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hash],
      (error, results) => {
        req.session.userId = results.insertId;
        req.session.userName = username;
        res.redirect('/');
      }
    );
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/');
  });
});

app.listen(3000);