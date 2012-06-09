/*
 * Node.jsの挙動確認用tp。
 *
 * とりあえずhttpの負荷toolでも書いてみる。
 */
var http = require('http');
var url = require('url');


//{{{ 終了処理
//process.on('uncaughtException', function (err) {
//	console.log('Caught exception: ' + err);
//	process.exit(10);
//});

process.on('SIGINT', function (){
	process.exit(2);
});
process.on('exit', function (){
	if (params == null) return;

	var runningTime = (new Date) - startTime;
	console.log('------------------------');
	console.log('ran: ' + params.ran + ' queries');
	console.log('running time: ' + runningTime + 'ms ');
	console.log(params.ran / runningTime * 1000 + 'q/s');
});
//}}}

// {{{ 初期値
var params = {
	ran: 0,	// 実行完了回数
	concurrency: 20,	// 並列処理数
	queryNum: 500,	// 処理数
	keepalive: false,	// keepalive
	res: 0
};

var queryStatuses = new Array();	
var startTime = new Date();
// }}}

var queryObject = createQueryObject(process.argv);

for(var i = 0; i < params.concurrency; i++){
	get(queryObject);
}

// {{{ get()
function get(options) {
	
	if ( --params.queryNum < 0 ) {
		return;
	}

	var statusLogger;
	var req = http.request(options, function(res) {
		
		var data;
		res.on('data', function(chunk) {
			data += chunk;
			// TODO:
			;		
		});	

		res.on('end', function() {
			params.ran++;
			statusLogger();
			// next query
			get(options);
		});
	});

	req.on('response', function(res){
		params.res++;
	});
	req.on('socket', function(socket){
		statusLogger = startLogger();	
	});

	req.end();
}
// }}}

// {{{ QueryStatus
function QueryStatus(){ this.initialize.apply(this, arguments); }
QueryStatus.prototype = {
	initialize: function() {
		this.id = QueryStatus.prototype.classSeqId++;
		this.time = new Date();
	},
	end: function() {
		this.time = (new Date()) - this.time;
		// TODO: dbにでも放り込む
		return this;
	},
	classSeqId: 0
}
// }}}

// {{{ startLogger
function startLogger(queryNum) {
	var q = new QueryStatus();
	return function() {
		queryStatuses.push(q.end());
	}
}
// }}}

function createQueryObject(argv) {

	// {{{ いいかげん引数処理
	// TODO:getopt。
	if (argv.length != 3){
		params = null;
		console.error('usage: node http-request.js url\n'
				+ 'ex). node http-request.js http://example.com:8080/index.html');
		process.exit(1);
	}
	var args = url.parse(argv[2]);
	var headers = null;
	/// }}}

	// {{{ query内容作成
	args.method = 'GET';
	var agent = new http.Agent();
	agent.maxSockets = params.concurrency;

	args.agent = agent;
	if ( ! params.keepalive ) {
		args.headers = { Connection: 'close'};	
	}
	//}}}
	
	return args;
}

