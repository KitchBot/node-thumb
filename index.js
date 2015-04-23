var server = require('./server')
var cluster = require('cluster')
var os = require('os')

if(!cluster.isMaster){   
    server(process.env['Port'])
    return
}
numCPUs = os.cpus()
if(cluster.isMaster){
    console.log('master')
    var workers = []
    spawn = function(i){
        console.log(i+' Process running')
        var env = {}
        env['Port'] = 8000+i;
        workers[i] = cluster.fork(env);
        workers[i].on('exit', function(worker, code, signal){
            console.log('respawning worker', i);
            spawn(i);
        })
    }
    for(var i=0;i<numCPUs.length;i++){
        console.log("spawn"+i)
        spawn(i)
    }
        
}        

