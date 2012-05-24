/*
 * Node.jsの挙動確認用tp。
 *
 * とりあえずhttpの負荷toolでも書いてみる。
 */

var http = require('http');

if (process.argv.length != 5){
	console.error('usage: node http-request.js host port url\n'
			+ 'ex). node http-request.js example.com 8080 /index.html');
	process.exit(-1);
}

var options = {
	host: process.argv[2],
	port: process.argv[3],
	path: process.argv[4],
	method: 'GET'
};	


var ran = 0;
var running = 0;
var parallel = 20;
var queryNum = 100000;

function get() {
	process.nextTick(function() {
		var i;
		for(i = 0; i < 1000; i++){
			if(running < parallel){
				running++;
				var queryTime;
		
				var req = http.request(options, function(res){
					var data;

					res.on('data', function(chunk) {
						data += chunk;
					});

					res.once('end', function() {
						ran++;
						running--;
					});
				});
				req.end();

				req.once('socket', function(socket) {
					socket.setMaxListeners(parallel);
					socket.once('connect', function(arg, arg2) {
						queryTime = new Date();
					});
				});

			}else{
				//console.log('max running.');
			}

			if (ran >= queryNum){
				process.exit();
			}
		}
		get();
	});
}

get();


