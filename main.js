// 使用 require 导入模块
const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const readline = require('readline')

const moduleFn = require('./module')
const tasksFn = require('./tasks')
const userData = require('./data/user.json')

// 需要输入的问题
const problems = [
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
    choices: ['默认: 08:[47, 57] 区间随机', '自定义'],
    default: '默认: 08:[47, 57] 区间随机',
  },
  {
    type: 'input',
    name: 'signInTime',
    message: '输入自定义签到时间:[12:12]',
    // 检验输入的是否是时间格式
    validate: (value) => {
      const reg = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (reg.test(value)) {
        return true
      }
      return '请输入正确时间格式'
    },
    when: (answers) => answers.chooseTime === '自定义',
  },
  {
    type: 'confirm',
    name: 'confirm',
    message: '保存当前配置:',
  },
]

const USER_DATA = []
let RUN_ONCE = {}

// 筛选需要的用户
if (userData.length > 0) {
  userData.forEach((user) => {
    // console.log('user:', user)
    if (user.active) USER_DATA.push(user)
  })
}
console.log('USER_DATA:', USER_DATA)

// 未录入用户,手动录入
if (USER_DATA.length === 0) {
  /* 在这里配置您的问题（可以设置多个，它们将按顺序向用户提出） */
  inquirer.prompt(problems).then((answers) => {
    // 回调，对用户输入的答案就行处理
    console.log('==============')
    answers.active = true
    // console.log('answers:', answers)
    // 存
    USER_DATA.push(answers)
    if (answers.confirm) {
      // 写入文件
      let result = [answers]
      // 将修改后的 JSON 数据写回文件
      const updatedData = JSON.stringify(result, null, 2)
      try {
        fs.writeFileSync(path.join(__dirname, './data/user.json'), updatedData, 'utf-8')
        console.log('\x1b[32m%s\x1b[0m', '配置文件已保存,下次执行不再需要进行输入')
      } catch (err) {
        console.error('写入文件时发生错误:', err)
      }
    } else {
      console.log('\x1b[32m%s\x1b[0m', '下次执行需要重新输入')
    }

    loopMain()
  })
} else {
  loopMain()
}

function loopMain() {
  USER_DATA.forEach((user) => {
    main(user)
  })
}
/**
 * 主函数
 * 执行启动函数
 */
function main(user) {
  console.log('程序开始运行')
  console.log('\x1b[32m%s\x1b[0m', '程序运行中')
  let h
  let m
  let time = '08:' + moduleFn.genRandomNumber(47, 57)
  // let time = '17:' + '23'
  if (user.signInTime) {
    // 自定义时间
    time = user.signInTime
  }
  h = parseInt(time.split(':')[0])
  m = parseInt(time.split(':')[1])
  console.log('签到时间:', h, ':', m)
  // 使用示例：每天 8:00 执行 taskFunc
  scheduleTask(h, m, function () {
    console.log('开始执行任务:[签到~]')
    execute(user)
    let date = moduleFn.getCurrentDate()
    // 当日记为已完成
    RUN_ONCE = {
      [date]: true,
    }
  })
}

/**
 * 打开chrome浏览器，填写用户名和密码，然后提交
 */
async function execute(user) {
  const flag = await tasksFn.signIn(user)
  console.log('\x1b[32m%s\x1b[0m', '执行成功!')
  if (flag) {
    loopMain()
  }
}

function scheduleTask(hour, minute, taskFunc) {
  let now = new Date() // 获取当前时间
  let then = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute) // 计算出下一次执行任务的时间

  // 如果当日任务已完成，那么将执行时间推迟到明天
  let currentDate = moduleFn.getCurrentDate()
  console.log(RUN_ONCE)
  if (RUN_ONCE && RUN_ONCE[currentDate]) {
    then.setDate(now.getDate() + 1)
    console.log('\x1b[31m%s\x1b[0m', `当日任务已完成! `)
    console.log('\x1b[32m%s\x1b[0m', '开始等待下一次执行任务时间...')
  } else {
    // 如果当前时间已经超过了计划的执行时间，那么将执行时间推迟到明天
    if (now.getTime() > then.getTime()) {
      then.setDate(now.getDate() + 1)
      console.log('\x1b[31m%s\x1b[0m', `当前时间已经超过了计划的执行时间`)
      console.log('\x1b[32m%s\x1b[0m', '开始等待下一次执行任务时间...')
    }
  }

  let timeout = then.getTime() - now.getTime() // 计算出距离下一次执行任务的时间
  // 打印倒计时
  const countdown = setInterval(function () {
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)

    let hours = Math.floor(timeout / 3600000)
    let minutes = Math.floor((timeout % 3600000) / 60000)
    let seconds = Math.floor((timeout % 60000) / 1000)

    process.stdout.write(`\x1b[31m距离任务执行还有:\x1b[0m ` + `${hours}小时 ${minutes}分钟 ${seconds}秒`)

    timeout -= 1000

    if (timeout < 0) {
      clearInterval(countdown)
      console.log('\n倒计时结束!')
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
      // currentDate = '20231230'
      // console.log(currentDate) // 输出格式为 "yyyyMMdd"
      // 拼接参数
      // config.url 和config.data所有参数
      let params = jointData(config.data)
      let url = `${config.baseUrl}${currentDate}?${params}`
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.data.type == 0) {
            console.log('\x1b[31m%s\x1b[0m', `今天是${data.data.date}|${data.data.lunarCalendar},为 ${data.data.typeDes}，任务即将执行,请稍后>>>`)
            taskFunc() // 执行任务
          } else {
            console.log('\x1b[31m%s\x1b[0m', `今天是${data.data.date}|${data.data.lunarCalendar},为${data.data.typeDes}期间 ,不是工作日，任务不会执行`)
            loopMain()
          }
        })
    })
    // 使用 setInterval 来安排每 24 小时执行一次任务
    // setInterval(scheduleTask, 24 * 60 * 60 * 1000)
  }, timeout + 2000)
}

function jointData(data) {
  let dataStr = ''
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const element = data[key]
      dataStr += `${key}=${element}&`
    }
  }
  return dataStr
}
