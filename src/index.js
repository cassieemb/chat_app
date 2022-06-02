require("dotenv").config()
const fs = require('fs')
const path = require('path')
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const request = require('request');
const axios = require('axios');

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

// define function to add new user object
function addUser(memberID, chatToken, phoneNumber, password, approvedChannels){
    // Storing the JSON format data in userObject
    let userObject = JSON.parse(fs.readFileSync(pathToUsers, 'utf-8'));

    // Backing up the most recent instance of users.json
    fs.writeFileSync(pathToBackupUsers,JSON.stringify(userObject));

    // Defining new data to be added
    let newUser = {
        "memberID": memberID,
        "chatToken": chatToken,
        "phoneNumber": phoneNumber,
        "password": password,
        "approvedChannels": approvedChannels,
    };

    // Adding the new data to our object
    userObject[newUser.memberID] = newUser

    // Writing to our JSON file
    fs.writeFileSync(pathToUsers,JSON.stringify(userObject));
}

// Returns a list of memberIDs associated with channelID
function chListUsers(channelID)
{
    // no backup as no data is written
    const jsonData = fs.readFileSync(pathToChannels, "utf8");
    let channels = JSON.parse(jsonData) 

    // make sure channelID is valid, returns even if members array is empty
    if (channels.hasOwnProperty(channelID))
    {
        return channels[channelID].members;
    }
    else{
        return "Invalid Channel ID"
    }
}

// Adds user to channels[channelID].members array
function chAddUser(channelID,memberID)
{
    const jsonData = fs.readFileSync(pathToChannels, "utf8");

    // Creates a backup instance to /backups/chBackup.json
    fs.writeFileSync(pathToBackupChannels,jsonData);
    let channels = JSON.parse(jsonData) 

    // ensure channelID is valid, check memberID to avoid dupes, push memberID to array
    if (channels.hasOwnProperty(channelID))
    {
        if (!channels[channelID].members.includes(memberID))
              {
                channels[channelID].members.push(memberID)
                fs.writeFileSync(pathToChannels,JSON.stringify(channels))
                return "Member added";
              }
        else{
            return "Member already in channel";
        }
    }
    else{
        return "Invalid Channel ID";
    }
    
}

// Removes user from channelID.members by memberID
function chPopUser(channelID,memberID)
{
    const jsonData = fs.readFileSync(pathToChannels, "utf8");

    // Creates a backup instance to /backups/chBackup.json
    fs.writeFileSync(pathToBackupChannels,jsonData);
    let channels = JSON.parse(jsonData) 

    // make sure channelID is valid channel, memberID is in members array, retrieve and splice memberID by index
    if (channels.hasOwnProperty(channelID))
    {
        if (channels[channelID].members.includes(memberID))
              {
                const chIndex = channels[channelID].members.indexOf(memberID);
                if (chIndex > -1){
                    channels[channelID].members.splice(chIndex,1)
                }
                fs.writeFileSync(pathToChannels,JSON.stringify(channels))
                return "Member removed";
              }
        else{
            return "Member not present";
        }
    }
    else{
        return "Invalid Channel ID";
    }
    
}


// Creates a new channel in channels.json
function chCreateChannel(channelID,memberID)
{
    const jsonData = fs.readFileSync(pathToChannels, "utf8");

    // Creates a backup instance to /backups/chBackup.json
    fs.writeFileSync(pathToBackupChannels,jsonData);
    let channels = JSON.parse(jsonData)

    // if channelID not present in channels, add channelID as a new entry with timestamp
    if (!channels.hasOwnProperty(channelID)){
        let today = new Date().toLocaleDateString()
        channels[channelID] =
        {
              "members":[memberID],
              "phoneNumber":"",
              "creationDate":today
        }
        fs.writeFileSync(pathToChannels,JSON.stringify(channels))
        return "channel created";
    }
    else{
        return "can't overwrite existing channel";
    }
}

// define function to create chat token
async function createToken(memberID){

    const options = {
        method: 'POST',
        url: 'https://' + spaceDomain + '/api/chat/tokens',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Basic ' + new Buffer.from(username + ':' + password).toString('base64')},
        data: {
            channels: {'Welcome to SignalWire': {read: true, write: true}},
            ttl: 43200,
            member_id: memberID},
        json: true
    };
    const response = await axios(options)
    console.log(response.status)
    if (response.status !== 200) {
        return false
    }
    else {
        return response.data.token
    }
}


// Update chat token function
function updateToken(memberID){
    let jsonData = fs.readFileSync(pathToUsers, 'utf-8');

    fs.writeFileSync(pathToBackupUsers,jsonData);
    let user = JSON.parse(jsonData);

    if (user.hasOwnProperty(memberID))
    {
       let channels = user[memberID].approvedChannels;
       let channelPerms = {}
       for (const channel in channels){
            channelPerms[channel]={read:true,write:true}
       }
       const options = {
        method: 'POST',
        url: 'https://' + spaceDomain + '/api/chat/tokens',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Basic ' + new Buffer.from(username + ':' + password).toString('base64')},
        body: {
            channels: channelPerms,
            ttl: 43200,
            member_id: memberID},
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        token = body['token']
        user[memberID].chatToken = token;

        fs.writeFileSync(pathToUsers,JSON.stringify(user));
    });
    return "Updated Chat Token";
    }
    else{
        return "Invalid Member ID";
    }    
}

// Update User Object
function userAddChannels(channelID,memberID)
{
    let userData = fs.readFileSync(pathToUsers, 'utf-8');
    let channelData = fs.readFileSync(pathToChannels, 'utf-8');

    fs.writeFileSync(pathToBackupUsers,userData);
    let user = JSON.parse(userData);
    let channels = JSON.parse(channelData);


    if (user.hasOwnProperty(memberID) && channels.hasOwnProperty(channelID)){
        if (!user[memberID].approvedChannels.includes(channelID)){
        user[memberID].approvedChannels.push(channelID)
        fs.writeFileSync(pathToUsers,JSON.stringify(user));
        return "Channel added to User Object";
    }
    return "Channel already in User Object"
    }
    return "Invalid Param"
}

// Remove channel from user object
function userPopChannel(channelID,memberID)
{
    const userData = fs.readFileSync(pathToUsers,"utf8")

    // Creates a backup instance to /backups/chBackup.json
    fs.writeFileSync(pathToBackupUsers,userData);
    let user = JSON.parse(userData)

    // make sure channelID is valid channel, memberID is in members array, retrieve and splice memberID by index
    if (user.hasOwnProperty(memberID) && user[memberID].approvedChannels.includes(channelID))
    {
        const chIndex = user[memberID].approvedChannels.indexOf(channelID);
                if (chIndex > -1){
                    user[memberID].approvedChannels.splice(chIndex,1)
                }
                fs.writeFileSync(pathToUsers,JSON.stringify(user))
                return "Channel Removed";
    }
    else{
        return "Invalid member or channel ID"
    }
}

// use phone number to lookup allowed channels
function lookupAllowedChannels(submittedTN){
    // read users.json into users
    let userObject = JSON.parse(fs.readFileSync(pathToUsers, 'utf-8'));
    const users = Object.values(userObject).map(value => {
        let memberID = value['memberID']
        let memberPass = value['password']
        let phoneNumber= value['phoneNumber']
        let approvedChannels = value['approvedChannels']
        return [memberID, memberPass, phoneNumber, approvedChannels]
    });

    // loop through users array to find a user with matching phone number
    for (let i = 0; i < users.length; i++) {
        let userNumber = users[i][2];
        let userChannels = users[i][3];
        let userID = users[i][0]

        // if phone number match is found, return user ID
        if (userNumber === '' + submittedTN) {
            return [userID, userChannels]
        }
    }
    return false
}

// use phone number to lookup user ID and return false if none is found
function lookupUser(submittedTN){
    // read users.json into users
    let userObject = JSON.parse(fs.readFileSync(pathToUsers, 'utf-8'));
    const users = Object.values(userObject).map(value => {
        let memberID = value['memberID']
        let memberPass = value['password']
        let phoneNumber= value['phoneNumber']
        return [memberID, memberPass, phoneNumber]
    });

    // loop through users array to find a user with matching phone number
    for (let i = 0; i < users.length; i++) {
        let userNumber = users[i][2];
        let userID = users[i][0];

        // if phone number match is found, return user ID
        if (userNumber === '' + submittedTN) {
            return userID
        }
    }
    return false
}

// validate login from user object
function validateLogin(submittedTn, submittedPass){
    // read in users.json
    let userObject = JSON.parse(fs.readFileSync(pathToUsers, 'utf-8'));

    // store user ID or 'false' in user var
    let user = lookupUser(submittedTn)

    // check if user exists
    if (user !== false){
        console.log('user found')


        // if phone number and password match, return 'login validated'
        let userPass = userObject[user]['password']
        if (userPass === submittedPass) {

            return 'Login Validated'
        }
        // if phone number and password don't match, return 'invalid password'
        else {
            return 'Invalid password and username combination, please try again'
        }
    }
    else {
        return 'There is no registered user with that phone number.'
    }
}

// Create function to find who sent in the text and where the text is meant to go
function smsToChannelName(smsToNumber, smsFromNumber, smsBody) {
    // Use smsFromNumber to determine who sent the message
    let user = lookupUser(smsFromNumber)
    // check if user exists
    if (user === false) {
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

// sign up as new user
app.post("/sign_up", async (req, res) => {
    // receive form values
    const { member_id, phone_number, password } = req.body;

    // check if phone_number already exists and flash error on page
    let attemptResult = lookupUser(phone_number)

    if (attemptResult !== false) {
        return res.render(path.join(__dirname, 'views/index.html'),
            {setClass: 'activate',
                errM: 'User already exists with that phone number',
                fail: false},
        );
    }

    // create chat token
    const token = await createToken(member_id)

    // check if token creation was successful and flash error if chat token fails
    if (token === false) {
        // redirect back to sign in page and flash error message
        res.render(path.join(__dirname, 'views/index.html'),
        {setClass: 'activate',
            errM: '422 Error: Token Failed to Create. Try again!',
            fail: false},
        );
    }

    // create user object using default channel
    addUser(member_id, token, phone_number, password, ['Welcome'])

    // add user to the default channel
    chAddUser('Welcome',member_id)

    // after user registration, redirect to 'home' page with phone number as query param
    res.redirect( "/home" + phone_number);

});

// sign in should validate password and user ID and if correct, redirect to 'home' view
app.post( "/sign_in", async(req, res) =>{
    // receive credentials from login attempt
    const phone_number_attempt  = req.body['phone_number_login'];
    const password_attempt = req.body['password_1'];

    // check to find a matching user object and validate that the password is correct
    let attemptResult = validateLogin(phone_number_attempt, password_attempt)
    console.log(attemptResult)

    // redirect to home page if validation is successful
    if (attemptResult === 'Login Validated') {
        res.redirect( "/home" + phone_number_attempt);
    }

    // reset sign in page if validation fails
    else {
        // redirect back to sign in page and flash error message
        res.render(path.join(__dirname, 'views/index.html'),
            {setClass: 'activate',
                errM: attemptResult,
            fail: true},
        );
    }

});

// redirect to home page
app.get("/home:phone_number", async(req, res)=>{
    // look up user ID and return allowed channels
    let miniMem = lookupAllowedChannels(req.params.phone_number);
    const userID = miniMem[0];
    const allowedChannels = miniMem[1];

    console.log(userID)
    console.log(allowedChannels)

    // feed channels into sidenav so each can be clicked to show a 'chat', maybe add username in top corner?

    // pass whatever channel is first in allowed channels as the 'current' channel


})

// routes to expose the ability to modify channels.json
app.post("/chAddUser",async(req,res)=>{
    const memberID = req.body['memberID'];
    const channelID = req.body['channelID'];
    console.log(chAddUser(channelID,memberID));
    console.log(userAddChannels(channelID,memberID));
});

app.post("/chPopUser",async(req,res)=>{
    const memberID = req.body['memberID'];
    const channelID = req.body['channelID'];
    console.log(chPopUser(channelID,memberID));
    console.log(userPopChannel(channelID,memberID));
});

app.post("/chListUsers",async(req,res)=>{
    const channelID = req.body['channelID'];
    console.log(chListUsers(channelID));
});

app.post("/chCreateChannel",async(req,res)=>{
    const memberID = req.body['memberID'];
    const channelID = req.body['channelID'];
    console.log(chCreateChannel(channelID,memberID));
    console.log(userAddChannels(channelID,memberID));
});

// Create a route for incoming messages
app.post("/incoming_message", (req,res) => {
    let smsToNumber = req.body.To
    let smsFromNumber= req.body.From
    let smsBody = req.body.Body
    // Use smsToChannelName to log where the text should be sent in our application
    console.log(smsToChannelName(smsToNumber,smsFromNumber,smsBody))
})

// Update token route
app.post("/update_token",async(req,res)=>{
    const memberID = req.body['memberID'];
    console.log(updateToken(memberID))
});


async function start(port) {
    app.listen(port, () => {
        console.log("Server listening at port", port);
    });
}

start(8080);
