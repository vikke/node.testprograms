/*
 * clusterとwokerでのメッセージのやりとりの重さを調べてみる。
 */



var loopNum = 100000;
var messaging = true;	// 毎回通信する(true)?しない(false)?
var masterKill = true;	// masterがworkerを殺す(true)?workerが自殺する(false)?

var cluster = require('cluster');
var clusterNum = require('os').cpus().length ;

if (cluster.isMaster){
	var startTime = new Date();
	var runningClusterNum = 0;
	var called = 0;

	process.on('exit', function(){
		var runningTime = new Date() - startTime;
		console.log('runtime: ' + runningTime + ' ms');	
		console.log( called / runningTime + ' message/ms');
	});

	function msgCallback(msg){
		if(msg.msg == 'increment'){
			called++;
		}else if(msg.msg == 'interval'){
			console.log('interval uniqueID: ' + msg.id + ' / count:' + msg.count);
		}else if(msg.msg == 'exit'){
			console.log('exit: uniqueID: ' + msg.id + ' / count:' + msg.count);
			if(masterKill){
				cluster.workers[msg.id].destroy();
			}
		}
	}

	for(var i = 0; i < clusterNum; i++){
		var worker = cluster.fork();
		worker.on('message', msgCallback);
		worker.on('online', function(w){
			// 全workerの準備が整ってから処理開始
			if(++runningClusterNum == clusterNum){;
				for(var id in cluster.workers){
					cluster.workers[id].send({msg:'online', id: id});
				}
			}
		});
	}

	cluster.on('disconnect', function(worker){
		console.log('disconnect: ' + worker.uniqueID);	
		if(--runningClusterNum == 0){
			process.exit();
		}
	});
	cluster.on('exit', function(worker, code, signal){
		console.log('exit: ' + worker.uniqueID);	
	});
	setInterval(function(){
		console.log('called: ' + called);
		for(var id in cluster.workers){
			cluster.workers[id].send({msg: 'interval'});
		}
	}, 1000);

}else{

	var count = 0;
	var id;
	process.on('message', function(msg){
		if(msg.msg == 'online'){
			id = msg.id;
			work();
		}else if(msg.msg == 'interval'){
			process.send({
				msg: 'interval',
				count: count,
				id: id
			});
		}
	});

	function work() {
		for(var i = 0; i < 100; i++){
			if(loopNum == ++count){
				if(masterKill){
					process.send({
						msg: 'exit',
						count: count,
						id: id
					});
					return;
				}else{
					process.exit();	
				}
			}
			if(messaging){
				process.send({msg: 'increment'});	
			}
		}

		process.nextTick(work);
	}
}


