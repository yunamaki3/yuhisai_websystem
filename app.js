// net start mysql57 にてmysqlを起動すること忘れずに
//mysql --user=root --passwordにてmysqlにログイン
//comittはczで行う

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
    'SELECT * FROM news ORDER BY createdDate DESC',
    (error, results) => {
      res.render('top.ejs', { news: results });
    }
  );
});

app.get('/detail/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM news WHERE id = ?',[id],
    (error, results) => {
      res.render('detail.ejs', { news: results[0] });
    }
  );
});

app.get('/login', (req, res) => {
  res.render('login.ejs' , { errors: [] });
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs', { errors: [] });
});

app.get('/postnews',(req,res) => {
  if(req.session.userStatus === "Admin"){
    res.render('postnews.ejs', { errors: [] });
  } else {
    res.redirect('/');
  }
});

app.get('/docs',(req,res) => {
  connection.query(
    'SELECT * FROM documents ORDER BY id DESC',
    (error, results) => {
      res.render('docs.ejs', { docs: results });
    }
  );
});

app.get('/docs/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM documents WHERE id = ?',[id],
    (error, results) => {
      console.log(results);
      res.render('doc.ejs', { docs: results[0] });
    }
  );
});

app.get('/proposal',(req,res) => {
  res.render('proposal.ejs');
});

app.get('/proposal/edit',(req,res) => {
  res.render('editpro.ejs');
});

app.get('/proposal/edit/kihon',(req,res) => {
  res.render('editpro_kihon.ejs');
});

app.get('/proposal/edit/kaikei',(req,res) => {
  res.render('editpro_kaikei.ejs');
});

app.get('/postdoc',(req,res) => {
  if(req.session.userStatus === "Admin"){
    res.render('postdoc.ejs', { errors: [] });
  } else {
    res.redirect('/');
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;  
  const errors = [];
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
            errors.push('ログインに失敗しました');
            res.render('login.ejs', { errors: errors });
          }
        });
      }else{
        errors.push('ログインに失敗しました');
        res.render('login.ejs', { errors: errors });
      }
    }
  )
});

app.post('/signup',
  (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const code = req.body.code;
    const errors = [];
    if(username === ""){
      errors.push('名前を入力してください');
    }
    if(email === ""){
      errors.push('メールアドレスを入力してください');
    }
    if(password === ""){
      errors.push('パスワードを入力してください');
    }
    if(code === ""){
      errors.push('登録コードを入力してください');
    }
    if(errors.length > 0){
      res.render('signup.ejs', { errors: errors });
    } else {
      next();
    }
  },(req,res,next) => {
    const email = req.body.email;
    const domain = email.split('@')[1];
    const errors = [];
    if(domain !== "showa-shuei.ed.jp"){
      errors.push('このメールアドレスは使用できません');
      errors.push('メールアドレスは学校発行のものを使用してください')
      res.render('signup.ejs', { errors: errors });
    } else {
      next();
    }
  },(req,res,next) => {
    const code = req.body.code;
    const errors = [];
    connection.query(
      'SELECT * FROM invitecode',
      (error, results) => {
        if(results[0].code === code){
          next();
        } else {
          errors.push('登録コードが間違っています');
          res.render('signup.ejs', { errors: errors });
        }
      }
    )
  },(req, res, next) => {
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if(results && results.length > 0){
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
        console.log(results);
        console.log(error);
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
        if(results && results.length > 0){
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

app.post('/postdocs',
  (req,res,next) => {
    const title = req.body.title;
    const content = req.body.content;
    const link = req.body.link;
    const errors = [];
    if(title === ""){
      errors.push('タイトルが空です');
    }
    if(content === ""){
      errors.push('説明が空です');
    }
    if(link === ""){
      errors.push('リンクが空です');
    }
    if(errors.length > 0){
      res.render('postdoc.ejs', { errors: errors });
    } else {
      next();
    }
  },(req,res,next) => {
    const title = req.body.title;
    const errors = [];
    connection.query(
      'SELECT * FROM documents WHERE title = ?',
      [title],
      (error, results) => {
        if(results && results.length > 0){
          errors.push('このタイトルは既に使用されています');
          res.render('postnews.ejs', { errors: errors });
        } else {
          next();
        }
      }
    )
  },(req,res) => {
    const title = req.body.title;
    const link = req.body.link;
    const content = req.body.content;
    connection.query(
      'INSERT INTO documents (title, link, content, createdDate) VALUES (?, ?, ?, NOW())',
      [title, link, content],
      (error, results) => {
        res.redirect('/docs');
      }
    );
});

app.get('/admin/invite', (req, res) => {
  if(req.session.userStatus === "Admin"){
    connection.query(
      'DELETE FROM invitecode',
      (error, results) => {
        const code = String(generateRandomCode(6)).padStart(6, '0');
        connection.query(
          'INSERT INTO invitecode (code) VALUES (?)',
          [code],
          (error, results) => {
            connection.query(
              'SELECT * FROM invitecode',
              (error, results) => {
                res.render('setting.ejs', { code: results[0] });
              }
            );
          }
        );
      }
    );
  } else {
    res.redirect('/');
  }
});

function generateRandomCode(length) {
  let code = '';
  const characters = '0123456789';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    res.redirect('/');
  });
});

app.listen(3000);