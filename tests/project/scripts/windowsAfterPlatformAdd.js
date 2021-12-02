/*eslint no-unused-vars: ["error", { "args": "none" }]*/

const fs = require("fs");
const path = require('path');

module.exports = context => {
    // Fix mysterious permissions issue since bumping plugin dependencies.
    const versionPath = path.join(__dirname, '../platforms/windows/cordova/version');
    fs.chmodSync(versionPath, '755');
    return Promise.resolve()
}
