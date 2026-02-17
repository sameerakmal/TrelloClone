const validator = require("validator");

const validSignUpData = ((req) => {
    const {name, email, password} = req.body;

    if(!name){
        throw new Error("Please enter your name")
    }
    else if(!validator.isEmail(email)){
        throw new Error("EmailId is not valid");
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("Please enter a strong password!!");
    }
})

module.exports = {validSignUpData};