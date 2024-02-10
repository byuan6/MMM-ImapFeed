'use strict';

Module.register("MMM-ImapFeed", {

	mailCount: 0,
	jsonData: null,
	errorData: null,

	// Default module config.
	defaults: {
		updateInterval: 60000,
		maxEmails: 5,
		maxSubjectLength: 40,
		maxFromLength: 15,
		playSound: false //true
	},

	start: function () {
		var self = this;
                setTimeout(()=>{
			this.getJson();
			this.scheduleUpdate();
		},30000);
	},

	scheduleUpdate: function () {
		var self = this;
		setInterval(function () {
			self.getJson();
		}, this.config.updateInterval);
	},

	// Define required scripts.
	getStyles: function () {
		return ["MMM-ImapFeed.css"];
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Request node_helper to get json from url
	getJson: function () {
		console.log("MMM-ImapFeed_GET_JSON");
		this.sendSocketNotification("MMM-ImapFeed_GET_JSON", this.config);
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "MMM-ImapFeed_JSON_RESULT") {
			// Only continue if the notification came from the request we made
			// This way we can load the module more than once
			if (payload.username === this.config.username) {
				this.jsonData = payload.data;
				this.errorData = null;
				this.updateDom(500);
			}
		}
		if (notification === "MMM-ImapFeed_JSON_ERROR") {
			if(payload.username === this.config.username) {
				this.jsonData = null;
				this.errorData = "Error: [" + payload.error + "]";
				this.updateDom(500);
			}
		}
	},

	// Override getHeader method.
	getHeader: function() {
		if (!this.jsonData) {
			return "ImapFeed";
		}

		if (this.config.playSound && this.jsonData.fullcount > this.mailCount) {
			new Audio(this.file("eventually.mp3")).play();
		}

		this.mailCount = this.jsonData.fullcount;

		return this.jsonData.title + "  -  " + this.jsonData.fullcount;
	},

	// Override dom generator.
	getDom: function () {

		var table = document.createElement("table");

		table.classList.add("mailtable");
		if (this.errorData) {
			table.innerHTML = this.errorData;
			return table;;
		}

		if (!this.jsonData) {
			table.innerHTML = "Loading...";
			return table;
		}

		if (!this.jsonData.entry) {
			var row = document.createElement("tr");
			table.append(row);

			var cell = document.createElement("td");
			row.append(cell);
			cell.append(document.createTextNode("No New Mail"));
			cell.setAttribute("colspan", "4");
			return table;
		}

		var items = this.jsonData.entry;

		// If the items is null, no new messages
		if (!items) {
			return table;
		}
	
		// If the items is not an array, it's a single entry
		if (!Array.isArray(items)) {
			items = [ items ]
		}
	
		items.forEach(element => {
			var row = this.getTableRow(element);
			table.appendChild(row);
		});

		return table;
	},

	getTableRow: function (jsonObject) {
		var row = document.createElement("tr");
		row.classList.add("normal");
		console.info(jsonObject);

		var fromNode = document.createElement("td");
		var subjNode = document.createElement("td");
		var dtNode = document.createElement("td");
		var tmNode = document.createElement("td");

		var issueDt = moment(jsonObject.issued);

		fromNode.append(document.createTextNode(jsonObject.author.name.substring(0, this.config.maxFromLength)));
		//subjNode.append(document.createTextNode(jsonObject.title.substring(0, this.config.maxSubjectLength)));
		//var synopsisNode = document.createElement("span");
		//synopsisNode.classList.add("xsmall");
		//synopsisNode.classList.add("light");
		//synopsisNode.classList.add("dim");
		//synopsisNode.classList.innerHTML = jsonObject.text;
		//subjNode.append(synopsisNode);
		subjNode.innerHTML = "<div style='max-width:580px;overflow-x:hidden'><span class='small bright'>" + jsonObject.title.substring(0, this.config.maxSubjectLength) + "</span>&nbsp;<span class='xsmall dim'>" +jsonObject.text+"</span></div>";

		if (!issueDt.isSame(new Date(), "day")) {
			dtNode.append(document.createTextNode(issueDt.format("MMM DD - ")));
		}
		tmNode.append(document.createTextNode(issueDt.format("h:mm a")));

		fromNode.classList.add("colfrom");
		fromNode.classList.add("medium");
		fromNode.classList.add("light");

		subjNode.classList.add("colsubj");

		dtNode.classList.add("coldt");
		dtNode.classList.add("med");
		dtNode.classList.add("dim");

		tmNode.classList.add("coltm");
		tmNode.classList.add("med");
		tmNode.classList.add("dim");
		
		

		row.append(fromNode);
		row.append(subjNode);
		row.append(dtNode);
		row.append(tmNode);
	
		return row;
	}

});
