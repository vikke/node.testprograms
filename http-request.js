/*
 * Node.jsの挙動確認用tp。
 *
 * とりあえずhttpの負荷toolでも書いてみる。
 */
var http = require('http');
var url = require('url');

//{{{ 終了処理
process.on('uncaughtException', function (err) {
	console.log('Caught exception: ' + err);
});
process.on('SIGINT', function (){
	process.exit(0);
});
process.on('exit', function (){
	var runningTime = (new Date) - startTime;
	console.log("------------------------");
	console.log("ran: " + ran + " queries");
	console.log("running time: " + runningTime + 'ms ');
	console.log(ran / runningTime * 1000 + 'q/s');
});
//}}}

// {{{ 初期値
// 実行完了回数
var ran = 0;

// 現在queryを投げている最中の数
var running = 0;

// 投げたい数
var queryNum = 50000;

// 並列処理数
var concurrency = 100;

var keepalive = false;
// }}}

var options = createQueryObject(process.argv);

var queryStatuses = new Array();

// 実行総時間用開始時間
var startTime = new Date();

function get() {

	if ( --queryNum < 0 ) {
		return;
	}

	var req = http.request(options, function(res) {
		//{{{ response data
		var data;
		res.on('data', function(chunk) {
			data += chunk;
			// TODO:
			;		
		});	
		///}}}

		//{{{ response end
		res.on('end', function() {
			ran++;
			// next query
			get();
			// TODO:
			;
		});
		//}}}
	});
	req.end();

	//{{{ request connect event
	req.once('connect', function(socket) {
		// TODO:
		;
	});
	///}}}

}

function createQueryObject(argv) {

	// {{{いいかげん引数処理
	// TODO:getopt。
	if (argv.length != 3){
		console.error('usage: node http-request.js url\n'
				+ 'ex). node http-request.js http://example.com:8080/index.html');
		process.exit(1);
	}
	var args = url.parse(argv[2]);
	var headers = null;
	/// }}}

	// {{{query内容作成

	args.method = 'GET';
	var agent = new http.Agent();
	agent.maxSockets = concurrency;

	args.agent = agent;
	if ( ! keepalive ) {
		args.headers = { Connection: 'close'};	
	}
	//}}}
	
	return args;
}

for(var i = 0; i < concurrency; i++){
	get();
}
