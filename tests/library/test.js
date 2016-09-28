/*global require:false, process:false, __dirname:false*/

var express = require('express');
var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/../../', {
  extensions: 'html'
}));
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  console.log('To view the test, visit http://localhost:' + app.get('port') + '/tests/library/');
});
