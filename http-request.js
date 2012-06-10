/*
 * Node.jsの挙動確認用tp。
 *
 * とりあえずhttpの負荷toolでも書いてみる。
 */
var http = require('http');
var url = require('url');

//{{{ 終了処理
process.on('uncaughtException', function (err) {
	console.log('Caught exception: ');
	console.log(err);
	process.exit(10);
});

process.on('SIGINT', function (){
	process.exit(2);
});
process.on('exit', function (){
	if (params == null) return;

	var runningTime = (new Date) - startTime;
	console.log('------------------------');
	console.log('ran: ' + params.ran + ' queries');
	console.log('running time: ' + runningTime + 'ms ');
	console.log(params.ran / runningTime * 1000 + ' q/s');
	// TODO: queryStatusesかdbに入っている実行結果からreportを作成する。
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

var queryStatuses = new Array();	// 実行結果
var startTime = new Date();			// 実行開始日時
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

// {{{ createQueryObject
function createQueryObject(argv) {

	var queryUrl = parseArgs(argv);

	// {{{ query内容作成
	var args = url.parse(queryUrl);
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
// }}}

// {{{ parseArgs
function parseArgs(argv) {
	var opt = require('getopt');

	try{
		opt.setopt('c::n::k', argv);
		opt.getopt(function (o, p) {
			switch (o) {
				// TODO: 書き方が冗長。なんとかならん？
				case 'c':
					var val = parseInt(arrayLastValue(p));
					if ( ! isNaN(val) ) {
						params.concurrency = val;
					}else{
						throw new Object();
					}
					break;
				case 'n':
					var val = parseInt(arrayLastValue(p));
					if ( ! isNaN(val)){
						params.queryNum = val;
					}else {
						throw new Object();
					}
					break;
				case 'k':
					params.keepalive = true;
					break;
			}
		});

		var p = opt.params();
		if (p.length != 3) {
			throw new Object();
		}

		return p[2];

	}catch (e) {
		params = null;
		console.error('usage: node http-request.js [options] url\n'
				+ 'ex). node http-request.js http://example.com:8080/index.html\n'
				+ 'options are:\n'
				+ '    -n requests     Number of requests for perform\n'
				+ '    -c concurrency  Number of multiple requests to make\n'
				+ '    -k              Use HTTP KeepAlive feature\n'
		);
		process.exit(1);
	}
}
// }}}

// {{{ arrayLastValue
function arrayLastValue(array){
	return array[array.length - 1];	
}
// }}}
