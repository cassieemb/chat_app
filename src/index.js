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
    fs.writeFile(pathToUsers, JSON.stringify(userObject), (err) => {
        if (err)
            console.log(err);
        console.log(memberID + " added");
    });
}

// handles updating channel objects
function channelsUpdate(channelList, memid){

    // Read in channels.json
    const jsonData = fs.readFileSync(pathToChannels, "utf8");

    // Creates a backup instance to /backups/chBackup.json
    fs.writeFileSync(pathToBackupChannels,jsonData);
    let channels = JSON.parse(jsonData) 

    // loops over channels passed
    for (const channel of channelList){
        // if the channel exists in channels.json, add the member by member ID
          if (channels.hasOwnProperty(channel)){
              if (!channels[channel].members.includes(memid))
              {
                channels[channel].members.push(memid)
              }
          }
          // if the channel isn't in channels.json, assume it's a new channel and add it to the file with creation timestamp
          else {
            let today = new Date().toLocaleDateString()
            channels[channel] = 
            {
                  "members":[memid],
                  "phoneNumber":"",
                  "creationDate":today
            }
        }

        // write to data/channels.json
        fs.writeFileSync(pathToChannels,JSON.stringify(channels))
    }
}

// define function to create chat token
function createToken(memberID){
    let token = '';

    const options = {
        method: 'POST',
        url: 'https://' + spaceDomain + '/api/chat/tokens',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')},
        body: {
            channels: {'Welcome to SignalWire': {read: true, write: true}},
            ttl: 43200,
            member_id: memberID},
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
        token = body['token']
    });
    return token
}

// use phone number to lookup user ID from phone number
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

// sign up or sign in page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'))
});

// sign up as new user
app.post("/sign_up", async (req, res) => {

    // receive form values
    console.log(req.body);
    const { member_id, phone_number, password } = req.body;

    // create chat token
    const token = createToken(member_id)

    // create user object using default channel
    addUser(member_id, token, phone_number, password, ['Welcome to SignalWire'])

    // add user to the default channel
    channelsUpdate(['Welcome to SignalWire'],member_id)

    // after user registration, redirect to 'home' view which should show current channels in a sidebar and user modification options
});

// sign in should validate password and user ID and if correct, redirect to 'home' view
app.post( "/sign_in", async(req, res) =>{
    // receive credentials from login attempt
    const phone_number_attempt  = req.body['phone_number_login'];
    const password_attempt = req.body['password_1'];

    // check to find a matching user object and validate that the password is correct
    let attemptResult = validateLogin(phone_number_attempt, password_attempt)
    console.log(attemptResult)

    // redirect to home page if validation is successful, need to maybe pass userID also?
    if (attemptResult === 'Login Validated') {
        // res.sendFile(path.join(__dirname, 'views/home.html'))
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

async function start(port) {
    app.listen(port, () => {
        console.log("Server listening at port", port);
    });
}

start(8080);