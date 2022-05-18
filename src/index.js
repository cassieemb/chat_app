require("dotenv").config()
const fs = require('fs')
const path = require('path')
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const request = require('request');

// authentication variables
const spaceDomain = process.env.SPACE_URL;
const username= process.env.PROJECT_ID;
const password= process.env.API_KEY

const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + "/views"));

// define function to add new user object
function addUser(memberID, chatToken, phoneNumber, password, approvedChannels){
    console.log(memberID, chatToken, phoneNumber, password, approvedChannels)
    // Storing the JSON format data in userObject
    let userObject = JSON.parse(fs.readFileSync("users.json", 'utf-8'));

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
    fs.writeFile("users.json", JSON.stringify(userObject), (err) => {
        if (err)
            console.log(err);
        console.log(memberID + " added");
    });
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

    // after user registration, redirect to 'home' view which should show current channels in a sidebar and user modification options
});

// sign in should validate password and user ID and if correct, redirect to 'home' view which should show current channels in a sidebar and user modification options


async function start(port) {
    app.listen(port, () => {
        console.log("Server listening at port", port);
    });
}

start(8080);