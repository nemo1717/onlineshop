var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var bcrypt = require('bcryptjs');
var nodemailer = require('nodemailer');

var db = mysql.createPool({
  host: 'layanenterprises.cjajxkvdxg0f.us-east-2.rds.amazonaws.com',
  user: 'layanent',
  password: 'Layangrade17',
  database: 'layanenterprises',
  multipleStatements: true

});

module.exports = function(passport) {
  passport.use(
      
      new LocalStrategy({ usernameField: 'email', passReqToCallback: true }, (req, email, password, done) => {

        const clientids = req.body.uname;

        // Match Unique Name
        db.query(" select * from Users where clientid = ? ; ", clientids, function(err, data){
           if(!data.length){
             return done(null, false, { message: 'The Unique Name is not Registered' });
           }

           else {
                    // Match email
        db.query(" select * from Users where email = ?  ; ",
        email, function(err, data){
          if(!data.length){
            return done(null, false, { message: 'The Email is not Registered' });
          }

          /*
            
          else{

            if (data[0].status == "false"){      
              var smtpTransport = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
               secure: true,
                //service: 'Gmail', 
                auth: {
                  type: 'OAuth2',
                  user: 'info@partifest.com',
                  serviceClient: "102086845611841503378",
                  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwORit6+APfwO/\nVj4ofvy1Jpr+VRQZJdc9vBRtB2TCSCi1Q7C20iiqHLL62b7x6JQECrFFYXMlF8RE\nZJxyZXaJeq8hrAZSY64JGvj8XNMzAElA/gDeSJ6gWSJv/KU2NcAt3OoVSzTwoEo3\nmdvnEld2sebjaIw+drvwS/TeWFJtXVvqqtb0FhYulxHmAQyyVtR6q42Cyfh/aroc\nVZVHywxiCViqztwnpw3UF/1mxx0b6aqjVjxlxHHMz5qyWUBez7Ksgn6Hcv2laEzb\n8H6qOlvlBmo495lpxm1+8BRS4nMm8P5OMXeS7DnoFZ6ToNRKD10TxlqqzSAqaOke\nWKhNmbcPAgMBAAECggEABMkNeNjulQfPnpLao0I3iI/Le7FBwiEQmZY8Pm20oxX5\n4lo74pW4ZvjaigyprmtbbEoCCwPyGtrCCKgWxisn2eSL/EUYnYTOxWPcc7Xtl5/1\nXUod1JYc60vLBJwpZwcfTd+G4nHQC+ITwd4au56i42VCA4DjoLqcBegky849hsdh\nBopgEq5O0qL/DBvZ0gOhoLhaWePvkoQPq8ahFu/S7bMMwFmN/Rts3XVWgnA3io/Q\nrIF9dS47ocCShNL2THboIxS9AjN1Fp/a/POVbzoNAQ4Q7M2XatbdEj+tsdh3ltHk\nTQX1TMHaX5GbzSJ+xkffqYE0L1LxsUc+nOCKgSY1KQKBgQDc7bGOWjMFgWbEbfuo\nekFKBRf1di0C+X4eyLhpk0Yj/l/0juoFXhp7cKo565OLzo65VCbxD3RSpbrRyA7P\nAQq9goi+CA09oDdEX9KSIF8L219J5xCZI9+BHfw9Ku2Lym2nprBq5wYVJus8cTef\njuOz+UD8xKQJB0AGvTyTBHISUwKBgQDMMp55yezSfpu0vGk7Sj1j25EjZvSv7poP\nPi97jgdM9YaccIclVBw7L5EPCH+qaU5k3koB1KfAaE97wY+RVbt5HxvtPirsQ/cF\nx43s5sKV7qW9FY5cCJUu3i74Qu2+qMdcX1n49RhgGk4yLKEgrDaNn0+pGmgLjLRi\nPfDfxW6o1QKBgBFgtP2whKDjO9UpnYj0DNyop+jL4eCBBXWgbjkHt5WvNZcEAs5n\nR4f8JbemmxV9KubTArklcQ3rMVW8+cU4nMKpWN4xvfDiAFblfqe12iQRnl4uybRy\nCOucEzIwhTzgsF1mlCvkfir9w7UeZrSrRafrbDw1r31yT4v4KKKbz+k3AoGASyfC\nTj70rBCvTFkgPhM3/x3cEHSfUHV4PG392fLPWxLvBXshMqr/bQU31ZmiK11w3g02\nne/gAiAiSQFXzv0H8C9z/uCnuafWLklhQjU4nyhj1fEuIU+DYOmjzfoMOOUz4xqx\nKcFDxHNKHotwjm7z8TIWhr3SV5Xk+lej5ShsbzUCgYEAxJ1p8LLOwnJhB675o5wu\nVdLphwPu4lDA3YotuSdLf5b1K59nNN6OhynTzu4tw/TqGrzJFwzCrLK1o93077DF\nUQYm5hzxcTTKyXu+jgBnzCC9uix1a/wy2nBbxgYzZ5QyUMXYAwIg178k6k1CVRn2\nahIfmPd5R8ntWjQsl6dIUq8=\n-----END PRIVATE KEY-----\n"
                },
               tls:{
              rejectUnauthorized:false
               }
              });
        
              
           
              var mailOptions = {
                
                to: data[0].Email,
                from: 'tjlayan20@gmail.com',
                subject: 'PartiFest Email Confirmation',
                text: 'You are receiving this because you just register for an account with us.\n\n' +
                  'Please click on the following link, or paste this into your browser to confirm your email:\n\n' +
                  'https://partifest.com/confirm/' + data[0].confirmtoken + '\n\n' +
                  'Thanks.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                //console.log('mail sent');
                console.log(data[0].Email);
                console.log(data[0].confirmtoken);
                if(err){
                  console.log(err);
                }
                else{

                  return done(null, false, { message: 'For security, you need to verify your email to login. A new confirmation email has been sent to ' + data[0].Email + '. Please check your email inbox or junks' });

                }

        
                
            
            
              });

              //return done(null, false, { message: 'You need to verify email to login. To confirm email, please check your email inbox sent to you when you registered ' });
          
            }
            */

        else {
          // decrypy password
          bcrypt.compare(password, data[0].password, (err, isMatch)=>{
            console.log(data[0].password);

            //if(err) throw err;

         
            if(isMatch){
              return done(null, data[0]);
            }
            else{
              return done(null, false, {message: 'Password is not correct. Try Again'});
            }
          });
        }  
            
      });

    }
  });
  })
);
      

    
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });
  
      // used to deserialize the user
    passport.deserializeUser(function(id, done) {
      db.query("select * from Users where id = ?",[id],function(err,rows){
        done(err, rows[0]);
      });
    });

};