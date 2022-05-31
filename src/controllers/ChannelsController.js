const req = require("express/lib/request")
const fs = require('fs')
const axios = require('axios').default
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

const listUsers = (req,res) => {
    const { memberID, channelID } = req.body;
    users = chListUsers(channelID)
    res.send(users)
}
const addUser = (req,res) => {
    const { memberID, channelID } = req.body;
    success = chAddUser(channelID, memberID)
    if (success){
        userAddChannel(channelID, memberID)
        userUpdateToken(memberID)}
    res.send(success)
}

const popUser = (req,res) => {
    const { memberID, channelID } = req.body;
    
    success = chPopUser(channelID, memberID)
    if (success){
        userPopChannel(channelID, memberID)
        userUpdateToken(memberID)
    }
    
    res.send(success)
}

const newChannel = (req,res) => {
    const { memberID, channelID } = req.body;
    success = chNewChannel(channelID, memberID)
    if (success){
    userAddChannel(channelID, memberID)
    userUpdateToken(memberID)   
    }
    res.send(success)
}

// this route is only meant for testing functionality. we can call userUpdateToken when we act on the user object instead.
const updateToken = async (req,res) => {
    const { memberID } = req.body;
    token = await userUpdateToken(memberID)
    res.send(token)
}


// returns list of users in channelID

function chListUsers(channelID)
{
    const jsonData = fs.readFileSync(pathToChannels, "utf8");
    let channels = JSON.parse(jsonData) 
    if (channels.hasOwnProperty(channelID))
    {
        return channels[channelID].members;
    }
    else{
        return "Invalid Channel ID"
    }
}

// adds memberID to channelID
function chAddUser(channelID,memberID)
{
    const userData = fs.readFileSync(pathToUsers, 'utf-8');
    const jsonData = fs.readFileSync(pathToChannels, "utf8");

    // Creates a backup instance to /backups/chBackup.json
    fs.writeFileSync(pathToBackupChannels,jsonData);
    let channels = JSON.parse(jsonData) 
    let user = JSON.parse(userData)

    // ensure channelID is valid, check memberID to avoid dupes, push memberID to array
    if (channels.hasOwnProperty(channelID))
    {
        if (user.hasOwnProperty(memberID) && (!channels[channelID].members.includes(memberID)))
              {
                channels[channelID].members.push(memberID)
                fs.writeFileSync(pathToChannels,JSON.stringify(channels))
                return true;
              }
        else{
            return "Member does not exist, or is already present in the channel";
        }
    }
    else{
        return "Invalid Channel ID";
    }
    
}

// removes memberID from channelID
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
                return true;
              }
        else{
            return "Member not present";
        }
    }
    else{
        return "Invalid Channel ID";
    }
    
}

// removes channelID from users[memberID] channels
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
                return true;
    }
    else{
        return "Invalid member or channel ID"
    }
}

// adds channelID to users[memberID] channels
function userAddChannel(channelID,memberID)
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
        return true;
    }
    return "Channel already in User Object"
    }
    return "Invalid Param"
}


// Creates a new channel with ChannelID and adds MemberID
function chNewChannel(channelID,memberID)
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
        return true;
    }
    else{
        return "can't overwrite existing channel";
    }
}

// updates memberID chat token with all memberID.approvedChannels
async function userUpdateToken(memberID){
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
        data: {
            channels: channelPerms,
            ttl: 43200,
            member_id: memberID},
        json: true
    };
    
    const response = await axios(options)
    token = response.data.token
    user[memberID].chatToken = token;

    fs.writeFileSync(pathToUsers,JSON.stringify(user));
    return true;
    };
    return("Invalid member ID")
}

module.exports = {
    listUsers,
    addUser,
    popUser,
    newChannel,
    updateToken,
    view
};