const mongoose=require('mongoose');

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
     type:String,
     required:true,
     unique:true
    },
    verified:{
        type:Boolean,
        default:false
    },
    refreshtoken:{
        type:String
    }
})

module.exports= new mongoose.model("User",userSchema);