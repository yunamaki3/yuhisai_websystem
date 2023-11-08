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
  connection.query(
    'SELECT * FROM news',
    (error, results) => {
      res.render('top.ejs', { news: results });
    }
  );
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

app.get('/postnews',(req,res) => {
  res.render('postnews.ejs', { errors: [] });
});

app.post('/login', (req, res) => {
  const email = req.body.email;  
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if(results.length > 0){
        const plain = req.body.password;
        const hash = results[0].password;
        bcrypt.compare(plain, hash, (error, isEqual) => {
          console.log(isEqual);
          if(isEqual){
            req.session.userId = results[0].id;
            req.session.userName = results[0].username;
            req.session.userStatus = results[0].state;
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
      'INSERT INTO users (username, email, password, state) VALUES (?, ?, ?, "Normal")',
      [username, email, hash],
      (error, results) => {
        req.session.userId = results.insertId;
        req.session.userName = username;
        req.session.userStatus = "Normal";
        res.redirect('/');
      }
    );
  });
});

app.post('/postnews',
  (req, res,next) => {
    const title = req.body.title;
    const content = req.body.content;
    const errors = [];
    if(title === ""){
      errors.push('タイトルが空です');
    }
    if(content === ""){
      errors.push('本文が空です');
    }
    if(errors.length > 0){
      res.render('postnews.ejs', { errors: errors });
    } else {
      next();
    }
  },(req,res,next) => {
    const title = req.body.title;
    const errors = [];
    connection.query(
      'SELECT * FROM news WHERE title = ?',
      [title],
      (error, results) => {
        if(results.length > 0){
          errors.push('このタイトルは既に使用されています');
          res.render('postnews.ejs', { errors: errors });
        } else {
          next();
        }
      }
    )
  },(req,res) => {
    const title = req.body.title;
    const content = req.body.content;
    connection.query(
      'INSERT INTO news (title, body, createdDate) VALUES (?, ?, NOW())',
      [title, content],
      (error, results) => {
        res.redirect('/');
      }
    );
});

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/');
  });
});

app.listen(3000);