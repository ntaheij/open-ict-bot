const fs = require("fs");

module.exports = {
  readFile: async function (path, fileName) {
    let raw = fs.readFileSync(`${path}/${fileName}.json`);
    return JSON.parse(raw);
  },
  writeFile: async function (path, fileName, data) {
    let writeData = JSON.stringify(data);
    fs.writeFileSync(`${path}/${fileName}.json`, writeData);
  },
};
