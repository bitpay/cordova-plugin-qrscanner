/*global require:false*/
var replace = require("replace");
var now = Date.now();
console.log('Replacing the {{TIMESTAMP}} in config.xml...');
replace({
    regex: "{{TIMESTAMP}}",
    replacement: now,
    paths: ['./config.xml'],
    recursive: false,
    silent: false,
});
