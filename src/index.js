// packages 
require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// routes 
const userRoute = require("./routes/Users")
const channelRoute = require("./routes/Channels")

// authentication variables from .env file
const spaceDomain = process.env.SPACE_URL;
const username= process.env.PROJECT_ID;
const password= process.env.API_KEY

// path to data from .env file
const pathToUsers = process.env.PATH_TO_USERS;
const pathToChannels = process.env.PATH_TO_CHANNELS;
const pathToBackupUsers = process.env.PATH_TO_BACKUP_USERS;
const pathToBackupChannels = process.env.PATH_TO_BACKUP_CHANNELS;

// express options
const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + "/views"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// routes
app.use("/users",userRoute);
app.use("/channel",channelRoute);

// serve index
app.get('/', (req, res) => {
    res.sendFile('views/index.html',{root:'src'});
  });


app.listen(8080,()=> {
    console.log("Server on port 8080")
})