const { validSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const express = require("express");
const { userAuth } = require("../middlewares/auth");

const authRouter = express.Router();


authRouter.post("/signup",
    async (req, res) => {
        try{
            validSignUpData(req);
            
            const {name, email, password} = req.body;
            const passwordHash = await bcrypt.hash(password, 10);

            const user = new User({
                name, 
                email, 
                password : passwordHash
            });

            const savedUser = await user.save();

            const token = await savedUser.getJWT();
            
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none"
            })

            res.json({message : "Signed up successfully!!", data : savedUser});

        }catch(err){
            res.status(400).send("Error saving the user : " + err.message);
        }
    }
);

authRouter.post("/login",
    async (req, res) => {
        try{
            const {email, password} = req.body;

            const user = await User.findOne({email : email});

            if (!user) {
                throw new Error("Invalid credentials");
            }

            const isPasswordValid = await user.validatePassword(password);

            if(isPasswordValid){
                const token = await user.getJWT();

                res.cookie("token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none"
                })
                res.send(user);
            }
            else {
                throw new Error(" Invalid credentials");
            }

        }catch(err){
            res.status(400).send("Error : " + err.message);
        }
    }
);

authRouter.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    }); 
    res.send({ message: "Logged out successfully" });
});

authRouter.get("/profile", userAuth, async (req, res) => {
    try {
        res.send(req.user);
    } catch (err) {
        res.status(400).send("Error fetching profile: " + err.message);
    }
});



module.exports = {authRouter};