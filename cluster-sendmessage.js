/*
 * clusterとwokerでのメッセージのやりとりしてみる。
 *
 * clusterから各workerへidを通知。
 * workerは1秒毎にログをclusterへ通知し、clusterが表示する。
 */


var cluster = require('cluster');
var clusterNum = require('os').cpus().length - 1;

if (cluster.isMaster){
	for(var i = 0; i < clusterNum; i++){
		var worker = cluster.fork();
		worker.on('message', function(msg){
			console.log(msg);
		});	
		worker.send({id: worker.uniqueID});
	}
}else{
	process.on('message', function(msg){
		QueryStatus.prototype.workerId = msg.id;
		console.log(msg);
		work();
	});
}

function work() {
	var l = startLogger();
	setTimeout( function(){
		process.send(l());	
		work()
	} , 1000);
}

function QueryStatus(){ this.initialize.apply(this, arguments); }
QueryStatus.prototype = {
	initialize: function() {
		this.id = QueryStatus.prototype.classSeqId++;
		this.time = new Date();
		this.workerId = QueryStatus.prototype.workerId;
	},
	end: function() {
		this.time = (new Date()) - this.time;
		return this;
	},
	classSeqId: 0
}

function startLogger() {
	var q = new QueryStatus();
	return function() {
		return q.end();
	}
}


