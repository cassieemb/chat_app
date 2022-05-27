const req = require("express/lib/request")
const request = require('request');
const fs = require('fs')
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

const signUp = (req,res) => {
    const { member_id, phone_number, password} = req.body;
    console.log('getting token')
    const token = createToken(member_id)
    console.log(token)
    console.log('getting user')
    success = addUser(member_id,phone_number,password,token)
    res.send(success)
}


function createToken(memberID){
    let token = '';

    const options = {
        method: 'POST',
        url: 'https://' + spaceDomain + '/api/chat/tokens',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Basic ' + new Buffer.from(username + ':' + password).toString('base64')},
        body: {
            channels: {'Welcome': {read: true, write: true}},
            ttl: 43200,
            member_id: memberID},
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        token = body['token']
        return token
    });
    ret
}


function addUser(member_id,phone_number,password,token){
    let approvedChannels = 'Welcome'
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

module.exports = {
    signUp,
    view
};