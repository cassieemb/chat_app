const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const userRoute = require("./routes/Users")

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use("/users",userRoute);

app.get('/', (req, res) => {
    res.sendFile('views/index.html',{root:'src'});
  });


app.listen(8080,()=> {
    console.log("Server on port 8080")
})