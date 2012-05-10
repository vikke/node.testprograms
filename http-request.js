process.on('uncaughtException', function (err) {
	  console.log('Caught exception: ' + err);
});
process.on('SIGINT', function (){
	process.exit(0);
});
process.on('exit', function (){
	var runningTime = (new Date) - startTime;
	console.log("ran " + ran + " queries");
	console.log("running time:" + runningTime + "ms");
	console.log(ran / runningTime * 1000 + "q/s" );
	;
});

var http = require('http');

// いいかげん引数処理
if (process.argv.length != 5){
	console.error('usage: node http-request.js host port url');
	process.exit(-1);
}

var options = {
	host: process.argv[2],
	port: process.argv[3],
	path: process.argv[4],
	method: 'GET'
};	


// 実行完了回数
var ran = 0;

// 現在queryを投げている最中の数
var running = 0;

// 投げたい数
//var queryNum = 1000;

// 並列処理数
var parallel = 30;

var startTime = new Date();

function get() {
	process.nextTick(function() {
		var i;
		for(i = 0; i < 1000; i++){
			if(running < parallel){
				//console.log("queued. now running=" + running);
				running++;
				http.get(options, function(res){
					var data;

					res.on('data', function(chunk) {
						data += chunk;
					});

					res.on('end', function() {
						ran++;
						running--;
						//console.log("ran: " + ran);
					});
				});
			}else{
				//console.log('max running.');
			}

			if (typeof(queryNum) != 'undefined' 
					&& queryNum != null 
					&& ran >= queryNum){
				process.exit();
			}
		}
		get();
	});
}

get();


