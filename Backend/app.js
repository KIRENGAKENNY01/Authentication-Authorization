// Importing dependencies 
const express = require('express');
const cookieParser=require('cookie-parser');
const mongoose=require('mongoose');

// To load environment variables 
require('dotenv').config()

// importing files 
const authRouter=require('./routes/auth');
const indexRouter=require('./routes/index');

// Start the express server 
const app= express();

const PORT = process.env.PORT || 8080;
const MONGO_URL= process.env.DB;

// parsing data and starting Cookie Parser
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());

//connect to the database 
mongoose.connect(MONGO_URL,{
    UseNewUrlParser:true,
    UseUnifiedTopology:true
})
.then(()=>{
    console.log("Connected to the database")
})
.catch((err)=>{
    console.log("Err during connection to the database",err);
})

app.use('/',indexRouter);
app.use('/auth',authRouter);




//listen to the Server
app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
})
