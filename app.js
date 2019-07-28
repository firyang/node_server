// 1. 加载对应模块
// const http = require("http")
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const multiparty = require('connect-multiparty') // 文件上传
const multipartMiddleware = multiparty()
const path = require('path')
const fs = require('fs')
const cors = require('cors')

// 2. 创建 express 对象
const app = express()
const port = process.env.PORT || 3000
const www = process.env.WWW || './'

// new
app.use(express.static(www))

app.listen(port, () => console.log(`listening on http://localhost:${port}`))
// 3. 配置第三方模块
// 3.1 配置跨域
// app.use(cors({
//   origin: ['http://localhost:8080', 'http://127.0.0.1'],
//   credentials: true
// }))
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'content-type')
  res.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS')
  if (req.method.toLowerCase() === 'options') {
    res.send(200)
  } else {
    next()
  }
})

// 3.2 支持POST请求
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false })) // 配置对特殊 json是否是自动转换 不转换

// 3.3 配置cookie 和session
app.use(cookieParser())
app.use(expressSession({
  resave: false, // 每次请求是否重新设置 session
  saveUninitialized: true, // 初始化时保存数据
  secret: '128位随机字符', // https加密传输，密钥
  cookie: {
    maxAge: 1000 * 60 * 60 * 8
  }
}))

// 3.4 配置文件上传路径
app.use(multiparty({ uploadDir: path.resolve('./upload') }))

// 4. 指定静态资源目录 public
app.use(express.static('public'))

// 文件上传
app.post('/upload', multipartMiddleware, function (req, res) {
  console.log(req.body, req.files)
  // don't forget to delete all req.files when done
  let id = req.files.file.path.split('\\').pop().split('.')[0]
  let name = req.files.file.name
  res.json({ msg: 'ok', id, name})
})

// 文件下载
app.get('/download', (req, res) => {
  var fileType = req.query.fileType
  var fileName = req.query.fileName

  if (fileType == 1) {
    // 直接访问文件进行下载
    res.redirect(fileName)
  } else if (fileType == 2) {
    // 以文件流的形式下载文件
    var filePath = path.join(__dirname, './data/' + fileName)
    var stats = fs.statSync(filePath)
    var isFile = stats.isFile()
    if (isFile) {
      res.set({
        'Content-Type': 'application/octet-stream', // 告诉浏览器这是一个二进制文件
        'Content-Disposition': 'attachment; filename=' + fileName, // 告诉浏览器这是一个需要下载的文件
        'Content-Length': stats.size // 文件大小
      })
      fs.createReadStream(filePath).pipe(res)
    } else {
      res.end(404)
    }
  } else if (fileType == 3) {
    // 读取文件内容后再响应给页面
    var filePath = path.join(__dirname, '../public/' + fileName)
    var stats = fs.statSync(filePath)
    var isFile = stats.isFile()
    if (isFile) {
      fs.readFile(filePath, function (isErr, data) {
        if (isErr) {
          res.end('Read file failed!')
          return
        }
        res.set({
          'Content-Type': 'application/octet-stream', // 告诉浏览器这是一个二进制文件
          'Content-Disposition': 'attachment; filename=' + fileName, // 告诉浏览器这是一个需要下载的文件
          'Content-Length': stats.size // 文件大小
        })

        res.setCharacterEncoding('UTF-8')
        res.end(data)
      })
    } else {
      res.end(404)
    }
  } else {
    res.end(404)
  }
})

app.post('/test',(req,res)=>{
  console.log(req.body)
  res.send(req.body)
})
