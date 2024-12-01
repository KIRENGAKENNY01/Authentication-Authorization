const {verify} = require("jsonwebtoken")
const User = require('../models/user');
// creating a middleware that will check if the user is logged in with every request 

const protected= async (req,res,next)=>{
    // get the token from the header 
    const authorization= req.headers['authorization'];
    // if we don't  have a token, return error

    if(!authorization){
        return res.status(500).json({
            message:"No token!",
            type:"error",
        })
    }
    //if we have a token we need to verify the token 
    const token = authorization.split("")[1];
    let id; 
   try{
   id=verify(token,process.env.ACCESS_TOKEN_SECRET).id;
   }
   catch(err){
     return res.status(500).json({
        message:"Invalide token!",
        type:"error",
     })
   }

   //if token is invalid return error
   if(!id){
    return res.status(500).json({
        message:"Invalid token",
        type:"error"
    })
   }

   // if the token is valid check if the user exists 
   const user= await User.findOneById(id);
   // if the user doesn't exist  , return error 

   if(!user){
    return res.status(500).json({
        message: "user doen't exist ",
        type:"error"
    })
   }

   //if the user exists , we'll add  a new field "user" to the request 
   req.user= user;
   // call the next  middleware 
   next(); 
}

module.exports= { protected }