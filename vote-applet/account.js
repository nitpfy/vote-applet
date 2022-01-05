// 账户系统路由中间件
const svgCaptcha = require('svg-captcha')
const express = require('express')
const db = require('./db')
const md5 = val => val

const app = express.Router()

app.post('/register', (req, res, next) => {
  var regInfo = req.body

  var USERNAME_RE = /^[0-9a-z_]+$/i

  var EMAILE_RE = /^([a-zA-Z]|[0-9])(\w|\-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/

  if (regInfo.captcha !== req.session.captcha) {
    res.json({
      code: -1,
      msg: 'captcha incorrect!',
    })
    return
  }
  if (!USERNAME_RE.test(regInfo.name)) {
    res.status(400).json({
      code: -1,
      msg: 'username invalid, can only contain digit and letter and _',
    })
  } else if (regInfo.password == 0) {
    res.status(400).json({
      code: -1,
      msg: 'password may not be empty',
    })
  } else if (!EMAILE_RE.test(regInfo.email)) {
    res.status(400).json({
      code: -1,
      msg: 'email invalid, please input correct email',
    })
  }else {
    try {
      var addUser = db.prepare('INSERT INTO users (name, password, email, avatar) VALUES (?, ?, ?, ?)')
      regInfo.avatar = '/uploads/default.jfif'
      var result = addUser.run(regInfo.name, md5(regInfo.password), regInfo.email, regInfo.avatar)
      console.log(result)
      res.json({
        code: 0,
        result: {},
      })
    } catch (e) {
      res.status(400).json({
        code: -1,
        msg: 'username or email already exists'
      })
    }
  }
})//这里是注册路由，在验证完 用户名唯一，密码不为空，邮箱格式正确，用户名唯一后，注册成功，数据库更新
//注册成功后返回一个空对象，code为0，注册失败后返回失败原因，原因从res.data.msg中读取

app.get('/captcha-img', (req, res, next) => {
  var captcha = svgCaptcha.create({
    noise: 1,
    ignoreChars: '0o1i',
    background: 'rgb(109,96,89)',
    color:'black'
  });
  req.session.captcha = captcha.text.toLocaleLowerCase();

  res.type('svg');// response Content-Type
  res.status(200).send(captcha.data);
})

app.post('/login', (req, res, next) => {
  var loginInfo = req.body

  if (loginInfo.captcha !== req.session.captcha && loginInfo.name !== 'visiter') {
    res.json({
      code: -1,
      msg: 'captcha incorrect!',
    })
    return
  }

  var user = db.prepare(`SELECT * FROM users WHERE name = ? AND password = ?`).get(loginInfo.name, md5(loginInfo.password))
  // var userStmt = db.prepare(`SELECT * FROM users WHERE name = 'foo' OR 1 = 1 OR '2' = '2' AND password = 'a'`)
  // var user = userStmt.get(loginInfo.name, loginInfo.password)
  // var user = userStmt.get()

  if (user) {
    res.cookie('loginUser', user.name, {
      signed: true
      // maxAge: 86400000, // 相对过期时间点，多久过期，过期后浏览器会自动删除，并不再请求中带上
      // expires: new Date(), // 绝对过期时间点
      // httpOnly: true, // 只在请求时带在头里，不能通过document.cookie读到
    })
    res.json({
      code: 0,
      result: user,
    })
  } else {
    res.status(400).json({
      code: -1,
      msg: 'username or password incorrect',
    })
  }
})//这里是登录路由，从前端收到登录对象之后进行验证，若用户名和密码匹配，则返回返回一个包含用户信息的对象，并给用户一个cookie
//登录失败后，返回一个code为-1的对象，错误信息msg为 “用户名或密码错误”

// 获取到当前可能已经登陆的用户信息
app.get('/current-user', (req, res, next) => {
  if (req.loginUser) {
    var { userId, name, avatar,email} = req.loginUser
    res.json({
      code: 0,
      result: {
        userId,
        name,
        avatar,
        email
      }
    })
  } else {
    res.status(404).json({
      code: -1,
      msg: 'not login'
    })
  }
})

app.get('/logout', (req, res, next) => {
  res.clearCookie('loginUser')
  res.json({
    code: 0,
    result: {},
  })
})

module.exports = app
