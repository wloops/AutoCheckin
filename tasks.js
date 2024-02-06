// tasks.js
const { Builder } = require('selenium-webdriver')

async function signIn(user) {
  const driver = await login(user)
  // 延迟3秒后点击签到
  await driver.sleep(3000)
  await driver.findElement({ id: 'attendSetting' }).click()
  console.log('\x1b[32m%s\x1b[0m', `签到成功`)
  await driver.sleep(1000)
  // 关闭浏览器并退出driver
  await driver.close()
  await driver.quit()
  return true
}

async function login(user) {
  const loginUrl = 'http://work.paytunnel.cn:19060/gms-v4/login.jsp?key=developmentServerTest121'
  const driver = await new Builder().forBrowser('chrome').build()
  driver.manage().window().maximize() //窗口最大化
  await driver.get(loginUrl)
  await driver.findElement({ id: 'userID' }).sendKeys(user.username)
  await driver.findElement({ id: 'hisu_password' }).sendKeys(user.password)
  await driver.findElement({ id: 'submit' }).click()
  console.log('\x1b[32m%s\x1b[0m', '登录成功')
  return driver
}

// 导出函数，使其在其他文件中可用
module.exports = {
  signIn,
}
