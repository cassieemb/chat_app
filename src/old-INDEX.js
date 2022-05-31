require("dotenv").config()
const fs = require('fs')
const path = require('path')
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const request = require('request');

// authentication variables from .env file
const spaceDomain = process.env.SPACE_URL;
const username= process.env.PROJECT_ID;
const password= process.env.API_KEY

// path to data from .env file
const pathToUsers = process.env.PATH_TO_USERS;
const pathToChannels = process.env.PATH_TO_CHANNELS;
const pathToBackupUsers = process.env.PATH_TO_BACKUP_USERS;
const pathToBackupChannels = process.env.PATH_TO_BACKUP_CHANNELS;

const app = express();

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + "/views"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// everything left in here is not implemented in the MVC model


// Create function to find who sent in the text and where the text is meant to go
function smsToChannelName(smsToNumber, smsFromNumber, smsBody) {
    // Use smsFromNumber to determine who sent the message
    let user = lookupUser(smsFromNumber)
    // check if user exists
    if (user == false) {
        console.log('This number is not associated with a channel')
        return false
    }

// Use smsToNumber to find the associated channel inside of channel.json
// read in channel.json
    let ChannelObject = JSON.parse(fs.readFileSync(pathToChannels, 'utf-8'));
    const channel = Object.values(ChannelObject).map(value => {
        let Chan_Name = value['channelID']
        let Channel_Phone_number = value['phoneNumber']
        return [Chan_Name, Channel_Phone_number]
    });
    for (let i = 0; i < channel.length; i++) {
        let channel_number = channel[i][1];
        let channel_name = channel[i][0];

        // if phone number match is found, return channel_name
        if (channel_number === smsToNumber) {
            console.log( user + " sent the message:  " + smsBody + "  from the number " + smsFromNumber + " ,to the number " +  smsToNumber+ " ,which is tied to the channel: " + channel_name)
            return [user,smsBody, channel_name]
        }
    }
}

// sign up or sign in page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'))
});

// Create a route for incoming messages
app.post("/incoming_message", (req,res) => {
    let smsToNumber = req.body.To
    let smsFromNumber= req.body.From
    let smsBody = req.body.Body
    // Use smsToChannelName to log where the text should be sent in our application
    console.log(smsToChannelName(smsToNumber,smsFromNumber,smsBody))
})


async function start(port) {
    app.listen(port, () => {
        console.log("Server listening at port", port);
    });
}

start(8080);
