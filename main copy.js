const inquirer = require('inquirer')
const fs = require('fs')
const { Builder } = require('selenium-webdriver')
const fetch = require('node-fetch')
// 使用 require 导入模块
const sayHello = require('./module')

// 调用导入的函数
sayHello('John')
let globalData = {
  username: '',
  password: '',
}

const arr = [
  {
    type: 'input',
    name: 'username',
    message: '用户名:',
    default: 'username',
  },
  {
    type: 'input',
    name: 'password',
    message: '登录密码:',
    default: 'password',
  },
  {
    type: 'list',
    name: 'chooseTime',
    message: '选择签到时间:',
    choices: ['默认: 08:52', '自定义'],
    default: '默认: 08:52',
  },
  {
    type: 'input',
    name: 'signInTime',
    message: '输入自定义签到时间:',
    // 检验输入的是否是时间格式
    validate: (value) => {
      const reg = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (reg.test(value)) {
        return true
      }
      return '请输入时间格式'
    },
    when: (answers) => answers.chooseTime === '自定义',
  },
  {
    type: 'confirm',
    name: 'confirm',
    message: '保存当前配置:',
  },
]

// 读取文件
fs.readFile('./data/user.json', 'utf8', function (err, data) {
  if (err) throw err

  console.log(data)
  let config = JSON.parse(data)
  if (config.username && config.password) {
    globalData.username = config.username
    globalData.password = config.password
    main()
  } else {
    /* 在这里配置您的问题（可以设置多个，它们将按顺序向用户提出） */
    inquirer.prompt(arr).then((answers) => {
      // 回调，对用户输入的答案就行处理
      console.log('==============')
      globalData.username = answers.username
      globalData.password = answers.password
      // 修改文件内容
      let result = answers

      if (answers.confirm) {
        // 写入文件
        fs.writeFile('./data/user.json', JSON.stringify(result), 'utf8', function (err) {
          if (err) throw err
          console.log('\x1b[32m%s\x1b[0m', '配置文件已保存,下次执行不再需要进行输入')
          // console.log(answers)
        })
      } else {
        console.log('\x1b[32m%s\x1b[0m', '下次执行需要重新输入')
        globalData = answers
      }

      main()
    })
  }
})

/**
 * 主函数
 * 执行启动函数
 */
function main() {
  console.log('程序开始运行')
  console.log('\x1b[32m%s\x1b[0m', '程序运行中')

  let config = globalData
  let h
  let m
  let time = '08:52'
  if (config.signInTime) {
    // 自定义时间
    time = config.signInTime
  }
  h = parseInt(time.split(':')[0])
  m = parseInt(time.split(':')[1])

  console.log(h, ':', m)
  // 使用示例：每天 8:00 执行 taskFunc
  scheduleTask(h, m, function () {
    console.log('开始执行任务')
    login()
  })
}

/**
 * 打开chrome浏览器，填写用户名和密码，然后提交
 */
async function login() {
  const loginUrl = 'http://work.paytunnel.cn:19060/gms-v4/login.jsp?key=developmentServerTest121'
  const driver = await new Builder().forBrowser('chrome').build()
  driver.manage().window().maximize() //窗口最大化
  await driver.get(loginUrl)
  await driver.findElement({ id: 'userID' }).sendKeys(globalData.username)
  await driver.findElement({ id: 'hisu_password' }).sendKeys(globalData.password)
  await driver.findElement({ id: 'submit' }).click()
  console.log('\x1b[32m%s\x1b[0m', '登录成功')
  // 延迟3秒后点击签到
  await driver.sleep(3000)
  await driver.findElement({ id: 'attendSetting' }).click()
  console.log('\x1b[32m%s\x1b[0m', `签到成功`)
  await driver.sleep(1000)
  // 关闭浏览器并退出driver
  await driver.close()
  await driver.quit()

  console.log('\x1b[32m%s\x1b[0m', '执行成功! 开始等待下一次执行任务时间...')
}

function scheduleTask(hour, minute, taskFunc) {
  let now = new Date() // 获取当前时间
  let then = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute) // 计算出下一次执行任务的时间

  // 如果当前时间已经超过了计划的执行时间，那么将执行时间推迟到明天
  if (now.getTime() > then.getTime()) {
    then.setDate(now.getDate() + 1)
    console.log('\x1b[31m%s\x1b[0m', '当前时间已经超过了计划的执行时间')
    console.log('\x1b[32m%s\x1b[0m', '开始等待下一次执行任务时间...')
  }

  let timeout = then.getTime() - now.getTime() // 计算出距离下一次执行任务的时间

  // 打印倒计时
  let countdown = setInterval(function () {
    let hours = Math.floor((timeout % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    let minutes = Math.floor((timeout % (1000 * 60 * 60)) / (1000 * 60))
    let seconds = Math.floor((timeout % (1000 * 60)) / 1000)
    // 倒计时不足1分钟时再进行打印
    if (hours < 1 && minutes < 1) {
      console.log('\x1b[31m%s\x1b[0m', '距离任务执行还有: ' + hours + '小时 ' + minutes + '分钟 ' + seconds + '秒 ...')
    }
    timeout -= 1000
    if (timeout < 0) {
      clearInterval(countdown)
    }
  }, 1000)

  // 使用 setTimeout 来安排在指定时间执行任务
  setTimeout(function () {
    clearInterval(countdown) // 停止倒计时

    // 判断是否是工作日(不含法定节假日)
    // 读取文件
    fs.readFile('./data/config.json', 'utf8', function (err, data) {
      if (err) throw err
      let config = JSON.parse(data)
      let currentDate = config.url
      let date = new Date()
      let year = date.getFullYear()
      let month = ('0' + (date.getMonth() + 1)).slice(-2) // 月份从 0 开始，所以需要加 1
      let day = ('0' + date.getDate()).slice(-2)
      currentDate = year + month + day
      // console.log(currentDate) // 输出格式为 "yyyyMMdd"
      // 拼接参数
      // config.url 和config.data所有参数
      let params = ''
      for (const key in config.data) {
        if (Object.hasOwnProperty.call(config.data, key)) {
          const element = config.data[key]
          params += `${key}=${element}&`
        }
      }
      let url = `${config.baseUrl}${currentDate}?${params}`
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.data.type == 0) {
            console.log('\x1b[31m%s\x1b[0m', `今天是${data.data.date}|${data.data.lunarCalendar},为 ${data.data.typeDes}，任务即将执行,请稍后>>>`)
            taskFunc() // 执行任务
          } else {
            console.log('\x1b[31m%s\x1b[0m', `今天是${data.data.date}|${data.data.lunarCalendar},为${data.data.typeDes}期间 ,不是工作日，任务不会执行`)
          }
        })
    })
    // 使用 setInterval 来安排每 24 小时执行一次任务
    setInterval(scheduleTask, 24 * 60 * 60 * 1000)
  }, timeout)
}
