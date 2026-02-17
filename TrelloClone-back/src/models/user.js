const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
    {
        name : {
            type : String,
            required : true,
            maxLength : 40
        },
        email : {
            type : String,
            required : true,
            unique : true,
            trim : true,
            lowercase : true,
            validate(value){
                if(!validator.isEmail(value)){
                    throw new Error("Invalid email address : " + value)
                }
            }
        },
        password : {
            type : String,
            required : true,
            validate(value){
                if(!validator.isStrongPassword(value)){
                    throw new Error("Weak password!");
                }
            }
        }
    },
    { 
        timestamps : true
    }
);

userSchema.methods.getJWT = async function(){
    const user = this;

    const token = await jwt.sign({_id : user._id}, process.env.JWT_SECRET, {
        expiresIn : "7d"
    });

    return token;
}   

userSchema.methods.validatePassword = async function(passwordInputByUser){
    const user = this;
    const passwordHash = user.password;
    const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHash);
    return isPasswordValid;
}

module.exports = mongoose.model("User", userSchema);