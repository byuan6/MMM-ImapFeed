var NodeHelper = require('node_helper');
var inspect = require('inspect');
var request = require('request');
var xml2js = require('xml2js');
var Imap = require('imap');
const {simpleParser} = require('mailparser');

module.exports = NodeHelper.create({
	start: function () {
		console.log('MMM-ImapFeed helper started...');
	},

	getFeed: function (config) {
		var self = this;

		var imap = new Imap({
			user: config.username,  
			password: config.password,
			host: config.imapAddress, //'imap.gmail.com',
			//servername: 'imap.gmail.com',  // SNI //https://github.com/nodejs/node/issues/28167
			port: config.imapPort, //993,
			tls: config.tls, //true,
			tlsOptions: config.tlsOptions, //{ servername: 'imap.gmail.com', }, //{ rejectUnauthorized: false } //https://stackoverflow.com/questions/59633564/cannot-connect-to-gmail-using-imap
		});
		
		var empty = {
			issued: null,
			author:{
				name: null,
			},
			title: null,
			text: null,
		};
		var all = {
			fullcount: 0,
			entry: [],
			title: config.username,
		};
		imap.once('ready', () => {
			imap.openBox('INBOX', false, () => {
				imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
					const f = imap.fetch(results, {bodies: ''});
					f.on('message', msg => {
						msg.on('body', stream => {
							simpleParser(stream, async (err, parsed) => {
								//console.log(parsed);
try{
								var unread = {...empty};
								unread.issued = parsed.date;
								unread.author = {name: parsed.from.text};
								unread.title = parsed.subject;
								if(parsed.text)
								  unread.text = parsed.text.substring(0, 160);
								
								//console.log(unread);
								//console.log(parsed.from.text);
								//console.log(unread.author);
								all.entry.push(unread);
								all.fullcount = all.entry.length;

								all.entry.sort((a,b) => (a.issued < b.issued) ? 1 : ((b.issued < a.issued) ? -1 : 0) );
								self.sendSocketNotification("MMM-ImapFeed_JSON_RESULT", {username: config.username, data: all});
} catch(ex) { console.error(ex); }
							});
						});
					});
					f.once('error', ex => {
						self.sendSocketNotification("MMM-ImapFeed_JSON_ERROR", {username: config.username, error: ex });

						return Promise.reject(ex);
					});
					f.once('end', () => {
						console.log(self.name+'Done fetching all messages! ' + all.entry.length);
						imap.end();

						all.entry.sort((a,b) => (a.issued < b.issued) ? 1 : ((b.issued < a.issued) ? -1 : 0) );
						//console.log(all);
						self.sendSocketNotification("MMM-ImapFeed_JSON_RESULT", {username: config.username, data: all});
					});
				});
			});
		});
		imap.connect();
	},

	//Subclass socketNotificationReceived received.
	socketNotificationReceived: function (notification, config) {
		console.log(this.name + ' Received' + notification);
		if (notification === "MMM-ImapFeed_GET_JSON") {
			this.getFeed(config);
		}
	}
});



