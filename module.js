// module.js

// 生成一个范围在规定之间的随机整数函数
function genRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getCurrentDate() {
  // 当前日期 2023-12-19格式
  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()

  month = month < 10 ? '0' + month : month
  day = day < 10 ? '0' + day : day

  let formattedDate = year + '-' + month + '-' + day
  return formattedDate
}

// 导出函数，使其在其他文件中可用
module.exports = {
  genRandomNumber,
  getCurrentDate,
}
