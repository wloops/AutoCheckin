const readline = require('readline')

let timeout = 70000 // 设置倒计时毫秒数

const countdown = setInterval(function () {
  readline.clearLine(process.stdout, 0)
  readline.cursorTo(process.stdout, 0)

  let hours = Math.floor(timeout / 3600000)
  let minutes = Math.floor((timeout % 3600000) / 60000)
  let seconds = Math.floor((timeout % 60000) / 1000)

  process.stdout.write('\x1b[31m倒计时:\x1b[0m ' + `${hours}小时 ${minutes}分钟 ${seconds}秒`)

  timeout -= 1000

  if (timeout < 0) {
    clearInterval(countdown)
    console.log('\n倒计时结束!')
  }
}, 1000)
