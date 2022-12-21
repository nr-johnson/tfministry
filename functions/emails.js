'use strict'

const nodemailer = require('nodemailer');

// Checks if the url is localhost or not.
  // If it is not it and the url does not include HTTPS, it redirects to the same url with HTTPS included.
module.exports = function() {
    return function(req, res, next) {
        let emailURL
        if(req.get('Host').substring(0, 9) !== 'localhost') {
            emailURL = req.protocol + "://" + req.get('host')
        } else {
            emailURL = 'http://localhost:8000'
        }
        req.emailURL = req.protocol + "://" + req.get('host')

        req.sendMail = function(options) {
          return new Promise(resolve => {
            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                  user: process.env.EMAIL_NAME,
                  pass: process.env.EMAIL_KEY
              }
          });

          console.log('Sending email.')
            transporter.sendMail(options, function(error, info){
              if (error) throw error
              if(info.accepted.length > 0) {
                console.log('Email Sent to ' + options.to)
              } else {
                console.log('Email not sent.')
              }
              resolve(info)
            });
          })
           
        }

        next()
    }
    
}