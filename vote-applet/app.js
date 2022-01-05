const express = require('express')
const multer = require('multer')
const cookieParser = require('cookie-parser')
const { WebSocketServer } = require('ws')
const http = require('http')
const server = http.createServer()
const querystring = require('querystring')
const _ = require('lodash')
const db = require('./db')
const accountRouter = require('./account')
const path = require('path')
const cookieSecret = 'cookie sign secert'
const port = 80
const app = express()

// WebSocketServer接管了server的upgrade事件
const wss = new WebSocketServer({ server })

// 本映射从投票id映射到响应这个投票最新信息的websocket
const voteWsMap = {
  // 2: [ws, ws, ws], // 2号投票有3个连接
  // 5: [ws, ws, ws, ws], // 5号投票有4个连接等待更新
}

const votesWsMap = {

}

wss.on('connection', (ws, req) => {
  var parsedCookie = cookieParser.signedCookies(querystring.parse(req.headers.cookie, '; '), cookieSecret)

  var loginUserName = parsedCookie.loginUser

  if (!loginUserName) {
    ws.close()
    return
  }

  var user = db.prepare('SELECT * FROM users WHERE name = ?').get(loginUserName)
  ws.user = user

  // 必须匹配这种形式的地址才可以连接
  if (req.url.match(/^\/realtime-voteinfo\/\d+$/)) {
    var voteId = req.url.match(/\d+$/)
    // ws应该被保存起来以在这个vote更新时将最新信息发给这个ws
    if (voteWsMap[voteId]) {
      voteWsMap[voteId].push(ws)
    } else {
      voteWsMap[voteId] = [ws]
    }

    // 当连接断开时，从映射中删除这个ws连接
    ws.on('close', () => {
      var idx = voteWsMap[voteId].indexOf(ws)
      voteWsMap[voteId].splice(idx, 1)
    })
  } else {
    ws.close()
  }
})

app.use((req, res, next) => {
  console.log(req.method, req.url)
  next()
})
app.use(express.static(__dirname + '/build'))
app.use(cookieParser(cookieSecret)) // cookie签名的密码
app.use(express.json()) // 解析json请求体的中间件
app.use(express.urlencoded({ extended: true })) // 解析url编码请求体的中间件

const sessions = {
}
app.use(function session(req, res, next) {
  if (!req.cookies.sessionId) {
    var sessionId = Math.random().toString(16).slice(2)
    //如果当前用户没有sessionid则给他发一个随机的sessionid
    res.cookie('sessionId', sessionId)
    //下发的sessionid存在了用户的cookie中
    sessions[sessionId] = {}//与当前用户交互的信息都放在这个sessionid所映射的那个对象上
    req.session = sessions[sessionId]
  } else {
    if (!sessions[req.cookies.sessionId]) {
      sessions[req.cookies.sessionId] = {}
    }
    req.session = sessions[req.cookies.sessionId]
  }
  next()
})
// 将用户是否登陆放到req的isLogin字段上的中件间
// 查出已登陆用户放到loginUser上
app.use((req, res, next) => {
  if (req.signedCookies.loginUser) {
    var name = req.signedCookies.loginUser
    req.isLogin = true
    req.loginUser = db.prepare('SELECT * FROM users WHERE name = ?').get(name)
  } else {
    req.isLogin = false
    req.loginUser = null
  }
  next()
})
app.use('/account', accountRouter)

//将用户发布的投票信息存入到数据库
app.post('/vote', (req, res, next) => {
  var vote = req.body

  var userId = req.loginUser?.userId
  if (userId != undefined) {

    var stmt = db.prepare('INSERT INTO votes (userId, title, desc, deadline, anonymous, multiple) VALUES (?,?,?,?,?,?)')
    var result = stmt.run(req.loginUser.userId, vote.title, vote.desc, vote.deadline, Number(vote.anonymous), Number(vote.multiple))

    var voteId = result.lastInsertRowid

    var stmt2 = db.prepare('INSERT INTO options (voteId, content) VALUES (?,?)')
    for (var option of vote.options) { // vote.options就是一个字符串数组
      stmt2.run(voteId, option)
    }

    res.json({
      code: 0,
      result: {
        voteId,
      }
    })
  } else {
    res.json({
      code: -1,
      msg: '用户未登陆',
    })
  }

})

//将投票信息发送到客户端
app.get('/vote/:voteId', (req, res, next) => {
  var { voteId } = req.params

  var vote = db.prepare('SELECT * FROM votes WHERE voteId = ?').get(voteId)

  if (vote) {
    var options = db.prepare('SELECT * FROM options WHERE voteId = ?').all(voteId)
    var userVotes = db.prepare(`
      SELECT optionId, avatar, voteOptions.userId
      FROM voteOptions
      JOIN users
      ON voteOptions.userId = users.userId
      WHERE voteId = ?
    `).all(voteId)

    if (vote.anonymous && req.loginUser.userId != vote.userId) {
      userVotes.forEach(it => {
        if (it.userId !== req.loginUser.userId) {
          it.avatar = '/uploads/niming.png'
        }
      })
    }

    res.json({
      code: 0,
      result: {
        vote,
        options,
        userVotes,
      }
    })
  } else {
    res.status(404).json({
      code: -1,
      msg: 'can not find this vote: ' + voteId,
    })
  }
})

// 切换当前登陆用户对voteId问题的optionId选项的投递情况
app.post('/vote/:voteId', (req, res, next) => {
  var { voteId } = req.params
  var { optionId } = req.body //我们的optionid是一个数字，而不是一个数组
  
  var userId = req.loginUser?.userId

  console.log('投票时的用户id', userId)

  // 如果用户未登陆，则不能投票
  if (!userId) {
    res.status(401).json({
      code: -1,
      msg: 'user not login!'
    })
    return
  }

  var vote = db.prepare('SELECT * FROM votes WHERE voteId = ?').get(voteId)
  if (vote) {
    var multiple = vote.multiple
    if (multiple) { // 多选
      let voted = db.prepare('SELECT * FROM voteOptions WHERE userId = ? AND voteId = ? AND optionId = ?')
        .get(userId, voteId, optionId)

      if (voted) { // 如果已经投过这个选项，则删除它
        db.prepare('DELETE FROM voteOptions WHERE voteOptionId = ?').run(voted.voteOptionId)
      } else { // 如果没有投过，则增加一行，表示用户投了这个选项
        db.prepare('INSERT INTO voteOptions (userId, voteId, optionId) VALUES (?, ?, ?)')
          .run(userId, voteId, optionId)
      }
      res.end()

    } else { // 单选
      let voted = db.prepare('SELECT * FROM voteOptions WHERE userId = ? AND voteId = ?')
        .get(userId, voteId)
      if (voted) { // 投过，修改或取消
        if (voted.optionId == optionId) { // 已经投的就是这次点的，则直接取消
          db.prepare('DELETE FROM voteOptions WHERE voteOptionId = ?').run(voted.voteOptionId)
        } else { // 已经投的跟这次点的不一样，则换成这次选的
          db.prepare('UPDATE voteOptions SET optionId = ? WHERE voteOptionId = ?').run(optionId, voted.voteOptionId)
        }
      } else { // 没投过，则增加
        db.prepare('INSERT INTO voteOptions (userId, voteId, optionId) VALUES (?, ?, ?)')
          .run(userId, voteId, optionId)
      }
      res.end()
    }

    // 把最新的当前投票数据拿到，并发给在等待这个投票最新信息的ws们
    var userVotes = db.prepare(`
      SELECT optionId, avatar, voteOptions.userId
      FROM voteOptions
      JOIN users
      ON voteOptions.userId = users.userId
      WHERE voteId = ?
    `).all(voteId)

    if (voteWsMap[voteId]) {
      voteWsMap[voteId].forEach(ws => {
        var userId = ws.user.userId

        var cloned = _.cloneDeep(userVotes)

        // 如果是匿名，且登陆用户不是当前投票的创建者，则抹去其它登陆用户的信息
        if (vote.anonymous && userId !== vote.userId) {
          cloned.forEach(it => {
            if (it.userId != userId) {
              it.avatar = '/uploads/niming.png'
            }
          })
        }
        ws.send(JSON.stringify(cloned))
      })
    }

  } else { // 如果投票不存在    实际上，我们前端只在投票存在的页面发送了ws链接请求，所以应该不会进入到这个else语句
    res.status(404).json({
      code: -1,
      msg: 'vote not exist: ' + voteId
    })
  }
})


let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.random().toString(16).slice(2) + path.extname(file.originalname)) //Appending extension
  }
})
app.get('/all-vote', (req, res, next) => {
  let votes = db.prepare(`
  SELECT name, title, voteId, multiple, anonymous, avatar, votes.userId
  FROM votes
  JOIN users
  ON votes.userId = users.userId
`).all()
  _.reverse(votes)
  console.log(votes);
  res.json({
    code: 0,
    result: votes
  })
})
const upload = multer({ storage: storage })
app.use('/uploads', express.static(__dirname + '/uploads')) // 用于响应用户上传的头像请求
app.post('/upload', upload.any(), (req, res, next) => {
  var userId = req.loginUser.userId
  var files = req.files
  console.log(files)
  var urls = files.map(file => `/uploads/` + file.filename)
  db.prepare('UPDATE users SET avatar = ? WHERE userId = ?').run(urls, userId)
  res.json(urls)
})

server.on('request', app)

server.listen(port, () => {
  console.log('vote app listening on port', port)
})