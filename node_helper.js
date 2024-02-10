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
			host: 'imap.gmail.com',
			//servername: 'imap.gmail.com',  // SNI //https://github.com/nodejs/node/issues/28167
			port: 993,
			tls: true,
			tlsOptions: { servername: 'imap.gmail.com', }, //{ rejectUnauthorized: false } //https://stackoverflow.com/questions/59633564/cannot-connect-to-gmail-using-imap
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
						/*
						msg.once('attributes', attrs => {
							const {uid} = attrs;
							imap.addFlags(uid, ['\\Seen'], () => {
								console.log('Marked as read!');
							});
						});
						*/
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
/*
						if(!self.mail) {
							self.mall = all;
						} else {
							var last = self.mail.entry.length==0 ? null : self.entry[0].issued;
							var l = all.entry.length;
							for(var i=0; i<l; i++) {
								if(!last || all.entry[i].issued>last)
									self.mail.entry.unshift(all.entry[i]);
							}
						}
*/
						self.sendSocketNotification("MMM-ImapFeed_JSON_RESULT", {username: config.username, data: all});
					});
				});
			});
		});
		imap.connect();

		/*
		function openInbox(cb) {
			imap.openBox('INBOX', true, cb);
		}
		
		imap.once('ready', function() {
			openInbox(function(err, box) {
				if (err) throw err;

				//
				var f = imap.seq.fetch('1:3', {
					bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
					struct: true
				});
				f.on('message', function(msg, seqno) {
					console.log('Message #%d', seqno);
					var prefix = '(#' + seqno + ') ';
					msg.on('body', function(stream, info) {
						var buffer = '';
						stream.on('data', function(chunk) {
							buffer += chunk.toString('utf8');
						});
						stream.once('end', function() {
							console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
						});
					});
					msg.once('attributes', function(attrs) {
						console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
					});
					msg.once('end', function() {
						console.log(prefix + 'Finished');
					});
				});
				f.once('error', function(err) {
					console.log('Fetch error: ' + err);

					self.sendSocketNotification("MMM-ImapFeed_JSON_ERROR", {username: config.username, error: err });
				});
				f.once('end', function() {
					console.log('Done fetching all messages!');
					imap.end();

					self.sendSocketNotification("MMM-ImapFeed_JSON_RESULT", {username: config.username, data: null});
				});
			});
		});
		
		imap.once('error', function(err) {
			console.log(err);
		});
		
		imap.once('end', function() {
			console.log('Connection ended');
		});
		
		imap.connect();
		*/

/*
		var feedUrl = "https://mail.google.com/mail/feed/atom";
		request({url: feedUrl, auth: { user: config.username, pass: config.password } } , function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var parser = new xml2js.Parser({trim:true, explicitArray: false });
				parser.parseString(body, function (err, result) {

				if (result.feed.entry) {
					if (!Array.isArray(result.feed.entry)) {
						result.feed.entry = [ result.feed.entry ]
					}
					
					result.feed.entry = result.feed.entry.slice(0, config.maxEmails);
				}

//console.log("----");
//console.log(JSON.stringify(result.feed, null, 2));
//console.log("----");
					// Send the json data back with teh url to distinguish it on the receiving port
					self.sendSocketNotification("MMM-ImapFeed_JSON_RESULT", {username: config.username, data: result.feed});
				});
			}
			else {
				self.sendSocketNotification("MMM-ImapFeed_JSON_ERROR", {username: config.username, error: error });
			}
		});
*/
	},

	//Subclass socketNotificationReceived received.
	socketNotificationReceived: function (notification, config) {
		console.log(this.name + ' Received' + notification);
		if (notification === "MMM-ImapFeed_GET_JSON") {
			this.getFeed(config);
		}
	}
});



