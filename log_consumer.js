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
var zkHost = yml.config.zkHost;
var topic = yml.config.topic;
var groupId = yml.config.groupId;

var kafka = require('kafka-node'),
    HighLevelConsumer = kafka.HighLevelConsumer,
    client = new kafka.Client(zkHost),
    consumer = new HighLevelConsumer(
        client,
        [
            { topic: topic }
        ],
        {
            groupId: groupId
        }
    );

var toObj;
var unixtime;
var before_unixtime = 0;
var cnt = 0;
var feed_data = {};
consumer.on('message', function (message) {
    toObj = JSON.parse(message['value']);
    unixtime = new Date(toObj['createdAt']).getTime() / 1000;
    if ((before_unixtime + 1) == unixtime) {
        feed_data.timestamp = unixtime;
        feed_data.log_cnt = cnt;
        console.log(JSON.stringify(feed_data));
        cnt = 1; // reset
    } else {
        cnt++;
    }
    before_unixtime = unixtime;
});
