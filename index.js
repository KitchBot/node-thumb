var server = require('./server')
var cluster = require('cluster')
var os = require('os')

server(8000)
