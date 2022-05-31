const req = require("express/lib/request")
const fs = require('fs')
const axios = require('axios').default;
require("dotenv").config()

const pathToUsers = process.env.PATH_TO_USERS;
const pathToChannels = process.env.PATH_TO_CHANNELS;
const pathToBackupUsers = process.env.PATH_TO_BACKUP_USERS;
const pathToBackupChannels = process.env.PATH_TO_BACKUP_CHANNELS;
const spaceDomain = process.env.SPACE_URL;
const username= process.env.PROJECT_ID;
const password= process.env.API_KEY


const view = (req,res) =>{
    res.sendFile('views/chRouteTest.html',{root:'src'})
}

const signUp = async (req,res) => {
    const { member_id, phone_number, password} = req.body;
    token = await createToken(member_id)
    success = userNewUser(member_id,phone_number,password,token)
    res.send(success)
}

const signIn = async (req,res) => {
    const phone_number_attempt  = req.body['phone_number_login'];
    const password_attempt = req.body['password_1'];
    let attemptResult = validateLogin(phone_number_attempt, password_attempt)
    if (attemptResult === 'Login Validated') {
        // res.sendFile(path.join(__dirname, 'views/home.html'))
        res.send("login validated")
    }
    else {
        // redirect back to sign in page and flash error message
        res.redirect(401,'/')
    }
}


//creates a fresh user token 
async function createToken(memberID){
    const options = {
        method: 'POST',
        url: 'https://' + spaceDomain + '/api/chat/tokens',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Basic ' + new Buffer.from(username + ':' + password).toString('base64')},
        data: {
            channels: {'Welcome': {read: true, write: true}},
            ttl: 43200,
            member_id: memberID},
        json: true
    };
    const response = await axios(options)
    return response.data.token
}


// Creates a new User object
function userNewUser(member_id,phone_number,password,token){
    let approvedChannels = ['Welcome']
    let userObject = JSON.parse(fs.readFileSync(pathToUsers, 'utf-8'));
    fs.writeFileSync(pathToBackupUsers,JSON.stringify(userObject));

    let newUser = {
        "memberID": member_id,
        "chatToken": token,
        "phoneNumber": phone_number,
        "password": password,
        "approvedChannels": approvedChannels,
    };
    userObject[newUser.memberID] = newUser
    fs.writeFileSync(pathToUsers,JSON.stringify(userObject));
    return true;
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


module.exports = {
    signUp,
    signIn,
    view
};