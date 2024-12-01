const express = require('express');
const router= express.Router();
const { verify }= require('jsonwebtoken')
const {hash,compare} = require('bcrypt');
const { protected } = require('../utils/protected');

const {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
    createPasswordResetToken,
}= require('../utils/tokens');


const { 
transporter, 
createPasswordResetUrl,
passwordResetTemplate,
passwordResetConfirmationTemplate,
}=require('../utils/email')

const User= require("../models/user");

// Sign up request

router.post('/signup',async(req,res)=>{
    try{
   const{email}=req.body;
   //see if the user exists 
   const existingUser=User.findOne({email:email});
   if(existingUser){
   return res.status(500).json({message:"User arleady exists! Try logging in",type:"Warning"});
   }
   else{
    //hash the password
    const passwordHash= hash(password,10);
    const newUser= new User({
        email:email,
        password:passwordHash
    })
    await newUser.save();
    return res.status(500).json({message:"User is created",type:"Success"})
   }
    }
    catch(err){
    return res.status(400).json({message:"Err during creation of user",type:"Error",err})
    }
})



//Sign in request 

router.post("/signin",async(req,res)=>{
    try{
        const{email,password}= req.body;
        // check if user exists 
      const existingUser= User.findOne({email:email})
      if(!existingUser){
       res.status(500).json({
        message:"User doesn't exist",
        type:"Error"
       })
      }
      //check if the password match 
      const isMatch= await compare(password,User.password);
      if(!isMatch){
        res.status(500).json({
            message:"Incorrect password.",
            type:"Error"
        })
      }
      // create tokens if password is correct 
      const accesstoken=createAccessToken(User._id);
      const refreshtoken=createRefreshToken(User._id);

      //put the refresh token 
      User.refreshtoken= refreshtoken;
      await User.save();

      // send response 
      sendRefreshToken(res,refreshtoken)
      sendAccessToken(req,res,accesstoken);
      
    }
    catch(err){
        res.status(401).json({
            message:"Err signing in",
            type:"Error",
            err
        })
    }
})

//logging out the user 

router.post("/logout",async(_req,res)=>{
    //clear cookie 
    res.clearCookie("refreshToken")
    return res.json({
        message:"Logged out the successfully ",
        type:"Success"
    })
})

// refresh Token request to get a new access token 


router.post("/refresh_token",async(req,res)=>{
    try{
        const { refreshtoken } = req.cookies;
        // if we don't have a refresh token , return error 
        if(!refreshtoken){
            return res.status(500).json({
                message:"No refresh token",
                type:"error"
            })
        }

// if we have a refresh token , you have to verify it 
    let id;
    try{
        id=verify(refreshtoken,process.env.REFRESH_TOKEN_SECRET).id;
    }
    catch(err){
        return res.status(500).json({
            message:"Invalid refresh token",
            type:"error",
        })
    }
    // if refreshtoken is invalid return error
    if(!id){
        return res.status(500).json({
            message:"Invalid refresh token"
        })
    }
    // if refreshtoken check if the user exists 
    const user = await User.findById(id);
    if(!user){
        return res.status(500).json({
            message:"The user doesn't exist",
            type:"Error",
        });
    } 
    // if the user exists , check if the refresh token is correct  return error if it isn't ;
    if(user.refreshtoken!==refreshtoken){
        return res.status(500).json({
            message:"Invalid refresh token",
            type:"error"
        })
    } 
    // if the refreshtoken is correct create the new tokens 
    const accessToken=createAccessToken(user._id);
    const refreshToken=createRefreshToken(user._id);

    // update the refreshtoken in the database 
    user.refreshtoken=refreshtoken;

    //send the new tokens as a response 
    sendRefreshToken(res,refreshToken);

    return res.json({
        message:" Refreshed successfully ",
        type:"success",
        accessToken
    });

    }
    catch(err){
        res.status(500).json({
            type:"error",
            message:"Error refreshing token!",
            err
        })
    }
})

// protected route
router.get("/protected", protected, async(req,res)=>{
    try{
        // if user exists in the request  send the data 
        if(req.user){
        return res.status(200).json({
            message: "You are logged in!",
            type:"success",
            user:req.user
        })
        }
        // if user doesn't exist  return error 
        return res.status(200).json({
            message:"You are not logged in!",
            type:"error"
        })
    }
    catch(err){
        return res.status(200).json({
            message:"Error getting protected route",
            type:"error", 
            err
        })
    }
})

// send password reset email 
router.post("/send-password-reset-email", async(req,res)=>{
    try{ 
        //get the user from the request body 
        const { email }= req.body ; 
        // find the user by email 
        const userexist=await User.findOne({email})
        if(!userexist){
            return res.status(500).json({
                message:"The user doesn't exist",
                type:"error",
            });
        }
       // create password reset token 
       const token= createPasswordResetToken({...userexist, createdAt: Date.now()}) ;
       //create the password reset url 
       const url = createPasswordResetUrl(userexist._id,token);
       // send the email 
       const mailOptions = passwordResetTemplate(userexist, url);
       transporter.sendMail(mailOptions,(err, info)=>{
        if(err){
            return  res.status(500).json({
                message: "Error sending email", 
                 type:"error",
            })
        }
        return res.json({
            message: " Password reset link has been sent to your email ", 
            type: " success"
        });
       });    
    }
    catch(error){ 
        res.status(500).json({
            type:"error", 
            message: "Error sending email", 
            error,
        })
    }
})


