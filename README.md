# MMM-ImapFeed
Displays e-mail retrieved from IMAP protocol

# Installation
### Step 1: Git Clone and install dependencies(npm install)
```bash
    cd ~/MagicMirror/modules
    git clone https://github.com/studio-1b/MMM-ImapFeed.git
    cd MMM-ImapFeed
    npm install
```

### Step 2: Enable your Google Account for IMAP

You don't need Gmail, but if you are going to access your Gmail via IMAP, please read warning below.  Otherwise any IMAP e-mail can be accessed and displayed.

> [!WARNING]
> To enable IMAP for Google, you need to generate a different App password (than the one you use to login to Gmail), just for IMAP.  Same username is used in the configuration below.

[https://support.google.com/mail/answer/185833?hl=en](https://support.google.com/mail/answer/185833?hl=en)

### Step 3: Configure MagicMirror to display module

Add this entry to <MagicMirror root>/config/config.js, as entry in *modules: [* array, somewhere at end.

```js
    {
        module: "MMM-ImapFeed",
        header: "Gmail",
        position: "bottom_bar",
        config: {
            imapAddress: "***<IMAP server address>***", //'imap.gmail.com',
            imapPort: ***<IMAP server port>***, //993
            tls: ***<true or false if encrypted>***, //true
            tlsOptions: ***<other options, need to use option in comment below, for Gmail IMAP>***
                // { servername: 'imap.gmail.com', }, //https://stackoverflow.com/questions/59633564/cannot-connect-to-gmail-using-imap
            username: "***<email address>***",
            password: "***<IMAP password>***",
            updateInterval: 5*60000,
            maxFromLength: 15
        }
    },
```

This module has only been formatted to fit at bottom of screen.  Feel free to update MMM-ImapFeed.js to adjust formatting for your specific display

### Step 4: Restart MagicMirror
