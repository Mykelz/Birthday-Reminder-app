const express = require('express');
const schedule = require("node-schedule");
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
require('dotenv').config();
const User = require('./model/user');
const nodemailer = require('nodemailer');
const fs = require('fs');



const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))


app.get('/', (req, res, next)=>{
    res.sendFile(path.join(__dirname, 'public/views', 'index.html'));
})

app.post('/submit-form',async (req,res,next)=>{
    const {username,email, date}  = req.body;

    const user = await User.create({
        username: username,
        email: email,
        DOB: date
    });
    res.sendFile(path.join(__dirname, 'public/views', 'submit.html'));
})

const emailTemplatePath = path.join(__dirname, 'public/views', 'mail.html');
const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');

async function sendEmail(users){
    try{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false, // Use `true` for port 465, `false` for all other ports
            auth: {
              user: process.env.GMAIL_ACCT,
              pass: process.env.APP_PASS,
            },
          });

          for (const user of users){
            const mailOptions = {
                from: '"Obianuka micheal" obianukamicheal@gmail.com', // sender address
                to: user.email, // list of receivers
                subject: `Happy Birthday ${user.username} !!`, // Subject line
                html: emailTemplate, // html body
              }
              let info = await transporter.sendMail(mailOptions);
              console.log('Message sent: %s', info.messageId);
          }
    }catch(err){
        console.log(err)
    }

}


schedule.scheduleJob('*/30 * * * * *', async()=>{
    try{
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
        const users = await User.find({
            DOB: {
                $gte: startOfDay,
                $lte: endOfDay
            }

        }).select('email username').exec();

        const usersEmail = [];
        console.log(users, 'all users email and username')
        if(users.length > 0 ){
            users.forEach(user=>{
                usersEmail.push(user.email)
            })

            sendEmail(users)
            // console.log(usersEmail)
        }else{

            console.log('No user has their birthday today')
        }
    }catch(err){
        console.log(err)
    }

})




mongoose.connect(process.env.CONNECT).then(con=>{
    app.listen(process.env.PORT, ()=>{
        console.log(`app is listening on port ${process.env.PORT}`)
    })
}).catch(err=>{
    console.log(err)
})
