require('date-utils');
var yaml = require('js-yaml');
var fs   = require('fs');
var opts = require('opts');
opts.parse([
    {
        'short': 'c',
        'long': 'config',
        'description': 'set config file',
        'value': true,
        'required': true
    }
]);
var conf = opts.get('config');
var yml = yaml.safeLoad(fs.readFileSync(conf, 'utf8'));

var kafka = require('kafka-node'),
    HighLevelConsumer = kafka.HighLevelConsumer,
    client = new kafka.Client(yml.config.zkHost),
    consumer = new HighLevelConsumer(
        client,
        [
            { topic: yml.config.topic }
        ],
        {
            groupId: yml.config.groupId
        }
    );

var toObj;
var unixtime;
var before_unixtime = 0;
var cnt = 0;
var feed_data = {};
var MilkCocoa = require('milkcocoa');
var milkcocoa = new MilkCocoa(yml.config.milkcocoaId);
var ds = milkcocoa.dataStore('messages');

consumer.on('message', function (message) {
    toObj = JSON.parse(message['value']);
    unixtime = new Date(toObj['createdAt']).getTime() / 1000;
    if ((before_unixtime + 1) == unixtime) {
        ds.send({"timestamp": unixtime, "log_num":cnt});
        cnt = 1; // reset
    } else {
        cnt++;
    }
    before_unixtime = unixtime;
});
