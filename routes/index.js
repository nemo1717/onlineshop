var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var passport = require('passport');
var { ensureAuthenticated } = require('../config/auth');
var multer = require('multer');
var path = require('path');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var moment = require('moment');
var request = require('request');
var http = require('http');
var fs = require('fs');


// Mysql connectionString
var mysql = require('mysql');
var db = mysql.createPool({
  host: 'layanenterprises.cjajxkvdxg0f.us-east-2.rds.amazonaws.com',
  user: 'layanent',
  password: 'Layangrade17',
  database: 'layanenterprises',
  multipleStatements: true

});


http.createServer(function (req, res) {
  fs.readFile('BasicColumnChart.html', function (err, data) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(data);
    res.end();
  });
}).listen(8080);


/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('/homepage');
});

// test nav
router.get('/navy', function (req, res, next) {
  res.render('navy');
});





//test mysql connection
router.get('/testconn', function (req, res, next) {
  if (db != null) {
    res.send('it is connected');
  }
  else {
    res.send('connect fail');
  }
});




// Add Products

router.get('/add_product', ensureAuthenticated, function (req, res, next) {
  db.query(" Select * from category where clientid = ?",  [req.user.clientid],  function (err, rs) {
    if (err) {
      console.log(err);
    }
    else {
      res.render('add_product' , { categ:rs });
    }
  });
});

router.post('/add_product', function (req, res, next) {
  const { pname, cat, quant, price, description } = req.body;
  var catid = 0;

    db.query("select * from category where cat_name = ? and clientid = ? ", [cat, req.user.clientid ], function (err, rs) {
      if (err) {
        console.log(err);
      }
      else{
        if(cat) {
          catid = rs[0].cat_id;
          console.log(catid);
        }
        console.log(catid);
        const full_name = req.user.first_name + ' ' + req.user.last_name;
        db.query("insert into Products(prod_name , categoryid , stockquantity, unitprice, description, clientid, add_by) values ('" + pname + "','" + catid + "', '" + quant + "', '" + price + "','" + description + "','" + req.user.clientid + "','" + full_name + "')", function (err, rs) {
          if (err) {
            console.log(err);
            req.flash('error', 'Error: Product not Inserted');
            res.redirect('/add_product');
          }
          else {
            req.flash('success_msg', 'Product Successfully Added')
            res.redirect('/add_product');
          }
        });
      }
    });
});


// Inventory Update
router.get('/inventory-update',  ensureAuthenticated, function (req, res, next) {
  
  db.query("select * from Products where clientid = ? and active_ind = 1; select * from Supplier where clientid = ?; ", [req.user.clientid, req.user.clientid ], function (err, rs) {
    if (err) {
      res.send(err);
    }
    else {
      res.render('inventory-update', { data:rs[0], datum:rs[1] });
    }
  });
});

// Update Products
router.post('/inventory-update', function (req, res, next) {
  const { date, pname, sup, quant, description } = req.body;
   var sid = 0;
    db.query("select prod_id from Products where prod_name = ? and clientid = ?; select sup_id from Supplier where sup_name = ? and clientid = ? ; ", [pname, req.user.clientid, sup, req.user.clientid], function (err, rs) {
      if (err) {
        console.log(err);
      }
      else {
        var pid = rs[0][0].prod_id;
        if(sup){
        sid = rs[1][0].sup_id;
        }
        full_name = req.user.first_name + ' ' + req.user.last_name;
        db.query("insert into productPurchases(prod_id, sup_id, date ,  quantity, comment, clientid, add_by) values ('" + pid + "','" + sid + "','" + date + "', '" + quant + "','" + description + "','" + req.user.clientid + "','" + full_name + "'); update Products set stockquantity = stockquantity + ? where prod_name = ? and clientid = ? ; ", [quant, pname, req.user.clientid], function (err, rs) {
          if (err) {
            console.log(err);
            req.flash('error', 'Error: Product Supply Update not Inserted')
            res.redirect('/inventory-update');
          }
          else {
            req.flash('success_msg', 'Product Supply Update Successfully Added')
            res.redirect('/inventory-update');
          }
        });
      }
    });
});



// sales
router.get('/sales',  ensureAuthenticated, function (req, res, next) {
  var sql = "select * from Products where clientid = ? and active_ind = 1; select * from Customer where clientid = ?;"
  db.query(sql, [req.user.clientid, req.user.clientid], function (err, rs) {
    if (err) {
      res.send(err);
    }
    else {
      res.render('sales', { data: rs[0], datum: rs[1] });
    }
  });
});

router.post('/sales', function (req, res, next) {
  const { date, pname, cat, price, quant, cust, description } = req.body;
  var cid  = 0
    db.query("select prod_id from Products where prod_name = ?; select cust_id from Customer where Name = ? ;", [pname, cust], function (err, rs) {
      if (err) {
        res.send(err);
      }
      else {
        var pid = rs[0][0].prod_id;
   
        if(cust) {
        cid = rs[1][0].cust_id;
        }
 
        const tot_price = quant * price;
        const full_name = req.user.first_name + ' ' + req.user.last_name;
        db.query("insert into Sales(prod_id, cust_id, date , price, quantity, comments, clientid, add_by, total_price) values ('" + pid + "','" + cid + "','" + date + "', '" + price + "', '" + quant + "','" + description + "','" + req.user.clientid + "','" + full_name + "', '" + tot_price + "'); update Products set stockquantity = stockquantity - ? where prod_name = ? and clientid = ?",[quant, pname, req.user.clientid], function (err, rs) {
          if (err) {
            console.log(err);
            req.flash('error', 'Error: Sale not Inserted')
            res.redirect('/sales');
          }
          else {
            req.flash('success_msg', 'Sale Successfully Added')
            res.redirect('/sales');
          }
        });
      }
    });
});




// supplier
router.get('/supplier',  ensureAuthenticated, function (req, res, next) {
  res.render('supplier');
});

router.post('/supplier', function (req, res, next) {
  const { name, pno, email, addy, city, state, country, description } = req.body;
    const full_name = req.user.first_name + ' ' + req.user.last_name;
    db.query("insert into Supplier(sup_name, phone_number , email, address, city, state, country, description, clientid, add_by) values ('" + name + "','" + pno + "', '" + email + "', '" + addy + "','" + city + "', '" + state + "','" + country + "', '" + description + "', '" + req.user.clientid + "',  '" + full_name + "')", function (err, rs) {
      if (err) {
        console.log(err);
        req.flash('error', 'Error: Supplier not Inserted')
        res.redirect('/supplier');
      }
      else {
        req.flash('success_msg', 'Supplier Successfully Added')
        res.redirect('/supplier');
      }
    });
});

// Customer
router.get('/customer',  ensureAuthenticated, function (req, res, next) {
  console.log(req.user);
  res.render('customer');
});


router.post('/customer', function (req, res, next) {
  const { name, pno, email, addy, city, state, country } = req.body;
    const full_name = req.user.first_name + ' ' + req.user.last_name
    db.query("insert into Customer(Name, phone_no, email, address, city, state, country, clientid, add_by) values ('" + name + "','" + pno + "', '" + email + "', '" + addy + "','" + city + "', '" + state + "','" + country + "','" + req.user.clientid+ "','" + full_name  + "')", function (err, rs) {
      if (err) {
        console.log(err);
        req.flash('error', 'Error: Customer not Inserted')
        res.redirect('/customer');
      }
      else {
        req.flash('success_msg', 'Customer Successfully Added')
        res.redirect('/customer');
      }
    });
});






// picture upload with multer
//set storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).single('MyImage');

function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}






//register page
router.get('/register', function (req, res) {
  res.render('register');
});


//register post
router.post('/register', function (req, res) {
  const { fname, lname,bname, city, state, country, email, password, pass2, size, website,  phone, busname } = req.body;
  let errors = [];


  if (!fname || !lname || !bname || !city || !busname || !state || !country ||!email || !phone || !password || !pass2) {
    errors.push({ msg: 'Please fill in all required fields' });
  }

  if (password != pass2) {
    errors.push({ msg: 'Password do not match' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      fname,
      lname,
      bname,
      city,
      state,
      country,
      email,
      password,
      pass2,
      busname,
      size,
      website,
      phone
    });
  }
  // validation passed
  else {
    db.query("select COUNT(*) AS cnt from Client where domain = ?; select COUNT(*) AS cont from Client where email = ? ",
      [bname, email], function (err, data) {
        console.log(data[0][0].cnt);
        console.log(data[1][0].cont);

        if (err) {
          res.send("there is an eeror");
        }
        else {
          if (data[0][0].cnt > 0 ) {
            errors.push({ msg: 'Unique Name  is already Registered. Choose a new Unique Name' });
            res.render('register', {
              errors,
              fname,
              lname,
              bname,
              city,
              state,
              country,
              email,
              password,
              pass2,
              busname,
              size,
              website,
              phone
            });
          }

          else if (data[1][0].cont > 0 ) {
            errors.push({ msg: 'Email is already Registered. Register with new Email' });
            res.render('register', {
              errors,
              fname,
              lname,
              bname,
              city,
              state,
              country,
              email,
              password,
              pass2,
              busname,
              size,
              website,
              phone
            });
          }
          else {
            async.waterfall([
              function (done) {
                crypto.randomBytes(20, function (err, buf) {
                  var token = buf.toString('hex');

                  done(err, token);
                });
              },

              function (token, done) {
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(password, salt, (err, hash) => {
                  if (err) throw err;

                  //set pass to hash;
                  let password = hash;
                  const roles = 'Admin';

                  db.query("insert into `Client`(firstname, lastname, CompanyName, city, state, country,  email, phoneno, password, companysize, website, domain,  token) values ('" + fname + "','" + lname + "',  '" + busname + "', '" + city + "', '" + state + "', '" + country + "', '" + email + "','" + phone + "','" + password + "', '" + size + "', '" + website + "', '" + bname + "','" + token + "') ; insert into `Users`(first_name, last_name, role_name, phone_number, email, clientid, password, token) values ('" + fname + "','" + lname + "', '" + roles + "', '" + phone + "', '" + email + "', '" + bname + "','" + password + "', '" + token + "') ", function (err, rs) {
                    if (err) {
                      req.flash('error', 'Account not Registered.Please try again')
                      res.redirect('/register');
                    }
                    else {
                   
                      req.flash('success_msg', 'Your Account Successfully Created. Please Login.')
                      res.redirect('/login');
                    }
                  });

                }));

                done(err, token, data);

              }

         
              /*   EMAIL CONFIRMATION (FUTURE)
              function (token, data, done) {

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
                  tls: {
                    rejectUnauthorized: false
                  }
                });


                console.log(token);
                var mailOptions = {

                  to: email,
                  from: 'tjlayan20@gmail.com',
                  subject: 'PartiFest Email Confirmation',
                  text: 'You are receiving this because you just register for an account with us.\n\n' +
                    'Please click on the following link, or paste this into your browser to confirm your email:\n\n' +
                    'http://' + req.headers.host + '/confirm/' + token + '\n\n' +
                    'Thanks.\n'
                };
                smtpTransport.sendMail(mailOptions, function (err) {
                  console.log('mail sent');

                  req.flash('success_messages', 'A confirmation e-mail has been sent to ' + email + ' with further instructions.');
                  done(err, 'done');

                });
                

              }
               */

             

            ]

    );


          }
        }
      });
  }

});


/* Email Confirmation
router.get('/confrim-email', function (req, res) {


  db.query('SELECT partyid,  city_name, state_name, party_name, aditional, price, startDate, startTime, endDate, endTime, image, address, full_name FROM register natural join party where userid = id ', function (err, rows, fields) {
    if (err) throw err;
    console.log(rows[0].aditional);

  });


});


*/

/* Email Confirmation

router.get('/confirm/:token', function (req, res) {
  db.query('select * from register where confirmtoken = ? ', [req.params.token], function (err, data) {

    if (!data.length) {
      req.flash('error', 'Email not successfully confirmed due to wrong confirmation link.');
      res.redirect('/register');
    }
    else {
      db.query('update register set status = "true" where confirmtoken = ? ', [req.params.token], function (err, data) {
        if (!err) {
          req.flash('success_messages', 'Email successfully confirm. Please Login.');
          res.redirect('/login');
        }

      });
    }
  });
});

*/





//Login page
router.get('/login', function (req, res) {
  res.render('login');
});



//login post
router.post('/login', function (req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
    //session: false
  })(req, res, next);
});

//logout
router.get('/logout', function (req, res, next) {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
});

// forget password page
router.get('/forget-password',  function (req, res) {
  res.render('forget-password');
});

// forget password post
router.post('/forget-password', function (req, res, next) {
  const { email } = req.body;
  console.log(email);
  let errors = [];

  if (!email) {
    errors.push({ msg: 'Please fill in your email' });
  }

  if (errors.length > 0) {
    res.render('forget-password', {
      errors,
      email
    });
  }
  // validation passed
  else {
    console.log(email);
    db.query("select * from register where email = ? ",
      email, function (err, data) {
        if (!data.length) {
          errors.push({ msg: 'That email is not registered ' });
          res.render('forget-password', {
            errors,
            email

          });
        }
        else {


          async.waterfall([
            function (done) {
              crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');

                done(err, token);
              });
            },
            function (token, done) {

              var d = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');

              db.query("update register set resetpasswordtoken = ?, resetpasswordexpire = ? where id = ?",
                [token, d, data[0].id], function (err, data) {
                  if (!err) {
                    console.log('inset me');
                  }
                  else {
                    res.send(err);

                  }

                });
              done(err, token, data);

            },


            function (token, data, done) {

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
                tls: {
                  rejectUnauthorized: false
                }

              });


              console.log(token);
              var mailOptions = {

                to: data[0].Email,
                from: 'tjlayan20@gmail.com',
                subject: 'PartiFest Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
              };
              smtpTransport.sendMail(mailOptions, function (err) {
                console.log('mail sent');

                if (!err) {

                  req.flash('success_messages', 'An e-mail has been sent to ' + data[0].Email + ' with further instructions.');
                  done(err, 'done');

                }

              });

            }

          ],


            function (err) {
              if (err) return next(err);
              res.redirect('/forget-password');
            });

        }
      });
  }
});

// reset token
router.get('/reset/:token', function (req, res) {
  db.query('select * from register where resetpasswordtoken = ? ', [req.params.token], function (err, data) {
    console.log(data);
    if (!data.length) {
      req.flash('error', 'Password reset link is invalid.');
      res.redirect('/forget-password');
    }
    else {
      res.render('reset', { token: req.params.token });
    }
  });
});

// reset token Post
router.post('/reset/:token', function (req, res) {

  const { password, password2 } = req.body;
  let errors = [];

  if (!password || !password2) {
    errors.push({ msg: 'Please fill in all required fields' });

  }
  if (password != password2) {
    errors.push({ msg: 'Password do not match' });
  }

  if (errors.length > 0) {
    res.render('reset', {
      token: req.params.token, errors

    });
  }

  // validation passed
  else {
    bcrypt.genSalt(10, (err, salt) => bcrypt.hash(password, salt, (err, hash) => {
      if (err) throw err;

      //set pass to hash;
      let password = hash;

      db.query("update register set password = ?  where resetpasswordtoken = ?",
        [password, req.params.token], function (err, rs) {
          if (err) {
            res.send('not inserted buddy')
          }
          else {
            req.flash('success_msg', 'Your password has been successfully changed. Please login with new password')
            res.redirect('/login');
          }
        });

    }));


  }
});


router.get('/page-not-found', function (req, res) {
  res.render('page-not-found');
});




router.get('/eric',  ensureAuthenticated, function (req, res, next) {
  console.log(req.user);
  
  db.query("select * from Sales where clientid = ?  ", [req.user.clientid], function (err, rs) {
   
    var x_months = [];
    var maxyear = 0;
    var maxmonth = 0;
    var quantity_array = [];
    var price_array = [];
    var profit_array = [];
    var prod_name = [];
    var stockquantity = [];

    //get max year
    rs.map(data => {
      var year = data.date.getFullYear();
      if(year > maxyear) maxyear= year;
    })

    //get max month
    rs.map(data =>{
      var month = 0;
      if(data.date.getFullYear() === maxyear)
      {
        month = data.date.getMonth();
      } 
      if(month > maxmonth) maxmonth = month+1;
    })

    //get x_axis month array
    for(var i = 0; i< 7; i++)
    {
      var x_axis = '';
      if(maxmonth < 1)
      {
        maxyear = maxyear-1;
        maxmonth = 12;
        x_axis = maxyear + '/' + maxmonth;
        x_months.push(x_axis);
      }
      else 
      {
        x_axis = maxyear + '/' + maxmonth;
        x_months.push(x_axis);
      }
      maxmonth = maxmonth-1;
    }
   
    x_months = x_months.reverse();

    // get quantities, price, profits
    x_months.map(each => {
      let result = each.split("/");
      var quantity_sum = 0;
      var price_sum = 0;
      var profit_sum = 0;
      rs.map(data => {
        if(data.date.getFullYear() == result[0] && data.date.getMonth()+1 == result[1])
        {
          quantity_sum += data.quantity;
          price_sum += data.price;
          profit_sum += data.profits;
        }
      });
      quantity_array.push(quantity_sum);
      price_array.push(price_sum);
      profit_array.push(profit_sum);
    });

    // get inventory
    db.query("select * from Products where clientid = ?", [req.user.clientid], function (err, re) {
      re.map(data => {
        prod_name.push(data.prod_name);
        stockquantity.push(data.stockquantity);
      });
      res.render('eric', {x_months, quantity_array, price_array, profit_array, prod_name, stockquantity});
    });
  });
});



// Dashboard
router.get('/dashboard',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT DATE_FORMAT(date,'%b/%Y') as dates, SUM(quantity) as quant, (SUM(quantity * price))  as rev, sum(price) as prices from layanenterprises.Sales where layanenterprises.Sales.clientid = ? GROUP BY YEAR(date), MONTH(date) order by date desc limit 7 ; SELECT *, ((quantity) * (price))  as tot from category join Products on category.cat_id = Products.categoryid right outer join Sales on layanenterprises.Sales.prod_id = Products.prod_id left outer join Customer on Sales.cust_id = Customer.cust_id where Sales.clientid = ? order by date", [req.user.clientid, req.user.clientid], function (err, rs) {
    const x_months = [];
    const quantity_array = [];
    const price_array = [];
    var maxyear = 0;
    var prevyear = 0;
    const rev = [];
    const stockquantity = [];
    const x_monthss = [];
    const profit_array = [];
    var prod_name = [];
    var profmaxyrsum = 0;
    var profprevyrsum = 0;
    var profmaxyear = 0;
    var profprevyear = 0;
    

    rs[1].map(data => {
      var year = data.date.getFullYear();
      if(year > maxyear) maxyear= year;
      prevyear = maxyear - 1;
    });

      var maxyrsum = 0;
      var prevyrsum = 0;
  
      rs[1].map(data => {
        if(data.date.getFullYear() == maxyear)
        {
          maxyrsum += data.tot;
        }
        if(data.date.getFullYear() == prevyear)
        {
          prevyrsum += data.tot;
        }
      });

    rs[0].map(data => {
      x_months.push(data.dates);
      quantity_array.push(data.quant);
      price_array.push(data.rev);
      rev.push(data.rev);
 
    });
/*
    db.query(" SELECT *, year(date) as years, cat_name, DATE_FORMAT(date,'%b/%Y') as dates, sum((Sales.price * Sales.quantity) - (Sales.quantity * Products.unitprice)) as profit FROM Sales join Products on Sales.prod_id = Products.prod_id  join category on Products.categoryid = category.cat_id where Sales.clientid = ? group by  month(date), year(date) order by date;", [req.user.clientid], function (err, rs) {

      rs.map(data => {
        x_monthss.push(data.dates);
        profit_array.push(data.profit);

      }); 
    });
    */

        // get inventory
    db.query("SELECT prod_name, sum(stockquantity) as quant FROM layanenterprises.Products where clientid = ? and active_ind = 1 group by prod_name order by stockquantity desc limit 7 ; SELECT *, year(date) as years, cat_name, DATE_FORMAT(date,'%b/%Y') as dates, sum((Sales.price * Sales.quantity) - (Sales.quantity * Products.unitprice)) as profit FROM Sales join Products on Sales.prod_id = Products.prod_id  join category on Products.categoryid = category.cat_id where Sales.clientid = ? group by  month(date), year(date) order by date desc limit 7;", [req.user.clientid, req.user.clientid], function (err, re) {

      var profmaxyrsum = 0;

      re[0].map(data => {
        prod_name.push(data.prod_name);
        stockquantity.push(data.quant);
      });

      re[1].map(data => {
        x_monthss.push(data.dates);
        profit_array.push(data.profit);

      });

      re[1].map(data => {
        var year = data.date.getFullYear();
        if(year > profmaxyear) profmaxyear= year;
        profprevyear = profmaxyear - 1;
      });
  
  

    
        re[1].map(data => {
          if(data.date.getFullYear() == profmaxyear)
          {
            profmaxyrsum += data.profit;
          }
          if(data.date.getFullYear() == profmaxyear)
          {
            profprevyrsum += data.profit;
          }
    
        });
  
      res.render('dashboard', {datas:rs[1], x_months, profmaxyrsum, x_monthss, prod_name, stockquantity, profit_array, quantity_array, price_array, prevyrsum, maxyrsum, rev, moment : moment});

    });
  });
});













router.get('/sales-reports',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT  DATE_FORMAT(date,'%b/%Y') as dates, SUM(quantity) as quant, (SUM(quantity * price))  as rev, sum(price) as prices from layanenterprises.Sales where layanenterprises.Sales.clientid = ? GROUP BY YEAR(date), MONTH(date) order by date desc limit 7; SELECT *, ((quantity) * (price))  as tot from category join Products on category.cat_id = Products.categoryid right outer join Sales on layanenterprises.Sales.prod_id = Products.prod_id left outer join Customer on Sales.cust_id = Customer.cust_id where Sales.clientid = ? order by date ", [req.user.clientid, req.user.clientid], function (err, rs) {

    const x_months = [];
    const quantity_array = [];
    const price_array = [];
    var maxyear = 0;
    var prevyear = 0;
    var quantmaxyr =0
    const rev = [];
    const uniquecat = [];
    const uniqueprod = [];


    rs[1].map(data => {
      uniquecat.push(data.cat_name);
      uniqueprod.push(data.prod_name);
      var year = data.date.getFullYear();
      if(year > maxyear) maxyear= year;
      prevyear = maxyear - 1;
    });


      var maxyrsum = 0;
      var prevyrsum = 0;
  
      rs[1].map(data => {
        if(data.date.getFullYear() == maxyear)
        {
          maxyrsum += data.tot;
          quantmaxyr += data.quantity;
          
        }
        if(data.date.getFullYear() == prevyear)
        {
          prevyrsum += data.tot;
        }
      });

 /*
    for (var i = 0; i < rs.length; i++){
      total += rs[i].tot; 
    }

    */

    rs[0].map(data => {
      x_months.push(data.dates);
      quantity_array.push(data.quant);
      price_array.push(data.rev);
      rev.push(data.rev);
 
    });

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  // usage example:
  var uniqueprods = uniqueprod.filter(onlyUnique);
  var uniqucat = uniquecat.filter( onlyUnique  ); 
//remove empty string. 
  var uniquca = uniqucat.filter(function (el) {
    return el != null;
  });

  //var unique_prod = prod_array.filter( onlyUnique ); 



    res.render('sales-reports', {datas:rs[1], x_months, uniqucat,uniqueprods,  uniquca, quantity_array,quantmaxyr, price_array, prevyrsum, maxyrsum, rev, moment : moment});
  });
});



router.get('/delete/:ids',  ensureAuthenticated, function (req, res, next) {
  var num = req.params.ids
  console.log(num)
  db.query('DELETE FROM Sales WHERE sales_id = ? ;', num , function (err, rs) {
    if (err) {
      res.send('err');
    }
    else {
      res.redirect('/sales-reports');
    }
  });
});

//search sales report
router.get('/searchme',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT *, DATE_FORMAT(date,'%b/%Y') as dates, SUM(quantity) as quant, (SUM(quantity * price))  as rev, sum(price) as prices from layanenterprises.Sales where layanenterprises.Sales.clientid = ? GROUP BY YEAR(date), MONTH(date) order by date desc limit 7; SELECT *, ((quantity) * (price))  as tot from category join Products on category.cat_id = Products.categoryid right outer join Sales on layanenterprises.Sales.prod_id = Products.prod_id left outer join Customer on Sales.cust_id = Customer.cust_id where Sales.clientid = ? and (Sales.date = ? or cat_name = ? or prod_name = ? ); select * from category join Products on category.cat_id = Products.categoryid where category.clientid = ?", [req.user.clientid, req.user.clientid, req.query.date, req.query.cat, req.query.prod, req.user.clientid], function (err, rs) {

    const x_months = [];
    const quantity_array = [];
    const price_array = [];
    var maxyear = 0;
    var quantmaxyr =0
    var prevyear = 0;
    const rev = [];
    const uniquecat = [];
    const uniqueprod = [];



    rs[0].map(data => {
      
      var year = data.date.getFullYear();
      if(year > maxyear) maxyear= year;
      prevyear = maxyear - 1;
    });


      var maxyrsum = 0;
      var prevyrsum = 0;
  
      rs[0].map(data => {
        if(data.date.getFullYear() == maxyear)
        {
          maxyrsum += data.rev;
          quantmaxyr += data.quantity;
        }
        if(data.date.getFullYear() == prevyear)
        {
          prevyrsum += data.rev;
        }
      });

 /*
    for (var i = 0; i < rs.length; i++){
      total += rs[i].tot; 
    }

    */

    rs[0].map(data => {
      x_months.push(data.dates);
      quantity_array.push(data.quant);
      price_array.push(data.rev);
      rev.push(data.rev);
 
    });

    
    rs[2].map(data => {
      uniquecat.push(data.cat_name);
      uniqueprod.push(data.prod_name);
    });

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  // usage example:
  var uniqueprods = uniqueprod.filter(onlyUnique);
  var uniqucat = uniquecat.filter( onlyUnique  ); 
//remove empty string. 
  var uniquca = uniqucat.filter(function (el) {
    return el != null;
  });

    res.render('searchme', {datas:rs[1], x_months,  quantmaxyr, uniqueprods, uniquca,  quantity_array, price_array, prevyrsum, maxyrsum, rev, moment : moment});
  });
});

// Category Report
router.get('/category-report',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT *, sum(quantity) as quant from category join Products on category.cat_id = Products.categoryid right outer join Sales on Sales.prod_id = Products.prod_id left outer join Customer on Sales.cust_id = Customer.cust_id where Sales.clientid = ? and (cat_name is not NULL or cat_name <> ' ') group by category.cat_name;", [req.user.clientid], function (err, rs) {
    console.log(rs);
    const cat_name = [];
    const quantity_sold = [];
  

    rs.map(data => {
      cat_name.push(data.cat_name);
      quantity_sold.push(data.quant);
      
    });

    res.render('category-report', {data:rs, cat_name,  quantity_sold});
  });

});


router.get('/customer-report',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT Name, sum(quantity) as quant from  layanenterprises.Sales join layanenterprises.Customer on layanenterprises.Sales.cust_id = layanenterprises.Customer.cust_id where layanenterprises.Sales.clientid = ? group by layanenterprises.Customer.Name; SELECT * FROM layanenterprises.Customer where clientid = ?;", [req.user.clientid, req.user.clientid], function (err, rs) {
    const cust_name = [];
    const quantity_sold = [];
    const Names = [];

    rs[0].map(data => {
      cust_name.push(data.Name);
      quantity_sold.push(data.quant);
    });

    rs[1].map(data => {
      Names.push(data.Name);
    });

    var uniquename = Names.filter(function (el) {
      return el != null;
    });

    res.render('customer-report', {data:rs[1], datas:rs[0], uniquename, cust_name, quantity_sold});
  });

});

//customer search
router.get('/customer-search',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT Name, sum(quantity) as quant from  layanenterprises.Sales join layanenterprises.Customer on layanenterprises.Sales.cust_id = layanenterprises.Customer.cust_id where layanenterprises.Sales.clientid = ? group by layanenterprises.Customer.Name; SELECT * FROM layanenterprises.Customer where clientid = ? and Name = ?; SELECT * FROM layanenterprises.Customer where clientid = ? ", [req.user.clientid, req.user.clientid, req.query.cust, req.user.clientid], function (err, rs) {
    const cust_name = [];
    const quantity_sold = [];
    const Names = [];


    rs[0].map(data => {
      cust_name.push(data.Name);
      quantity_sold.push(data.quant);
    });

    rs[2].map(data => {
      Names.push(data.Name);
    });

    var uniquename = Names.filter(function (el) {
      return el != null;
    });

    res.render('customer-report', {data:rs[1], datas:rs[0], uniquename, cust_name, quantity_sold});
  });

});


router.get('/productpurchased-report',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT  *, productPurchases.add_by as adds FROM productPurchases left outer join Products on productPurchases.prod_id = Products.prod_id left outer join Supplier on productPurchases.sup_id = Supplier.sup_id left outer join category on category.cat_id = Products.categoryid where productPurchases.clientid = ? order by date; ", [req.user.clientid], function (err, rs) {
    const cat_array = [];
    const prod_array = [];

    rs.map(data => {
      cat_array.push(data.cat_name);
      prod_array.push(data.prod_name)

    });

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  // usage example:
  var unique = cat_array.filter( onlyUnique ); 
  var unique_prod = prod_array.filter( onlyUnique ); 

  var unique = unique.filter(function (el) {
    return el != null;
  });

    res.render('productpurchased-report', {data:rs, unique,unique_prod, moment:moment});
  });

});

router.get('/productpurchased-search',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT  *, productPurchases.add_by as adds FROM productPurchases left outer join Products on productPurchases.prod_id = Products.prod_id left outer join Supplier on productPurchases.sup_id = Supplier.sup_id left outer join category on category.cat_id = Products.categoryid where productPurchases.clientid = ? ; SELECT  *, productPurchases.add_by as adds FROM productPurchases left outer join Products on productPurchases.prod_id = Products.prod_id left outer join Supplier on productPurchases.sup_id = Supplier.sup_id left outer join category on category.cat_id = Products.categoryid where productPurchases.clientid = ? and (cat_name = ? or productPurchases.date = ? or prod_name = ? ) order by date ;", [req.user.clientid,req.user.clientid, req.query.cat, req.query.date, req.query.prod], function (err, rs) {
    const cat_array = [];
    const prod_array = [];

    rs[0].map(data => {
      cat_array.push(data.cat_name);
      prod_array.push(data.prod_name)

    });

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  // usage example:
  var unique = cat_array.filter( onlyUnique ); 
  var unique_prod = prod_array.filter( onlyUnique ); 

  var unique = unique.filter(function (el) {
    return el != null;
  });
    res.render('productpurchased-report', {data:rs[1], unique,unique_prod, moment:moment});
  });

});


router.get('/delete-purchases/:ids',  ensureAuthenticated, function (req, res, next) {
  var num = req.params.ids
  console.log(num)
  db.query('DELETE FROM productPurchases WHERE purchase_id = ? ;', num , function (err, rs) {
    if (err) {
      res.send('err');
    }
    else {
      res.redirect('/productpurchased-report');
    }
  });
});


router.get('/product-report',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT *, sum(stockquantity) as quant FROM Products join category on Products.categoryid = category.cat_id where Products.clientid = ? and active_ind = 1  group by prod_name ; SELECT * FROM  category join Products on Products.categoryid = category.cat_id  where Products.clientid = ? and active_ind = 1 ; SELECT prod_name, sum(stockquantity) as quant FROM layanenterprises.Products where clientid = ? and active_ind = 1 group by prod_name order by stockquantity desc limit 7 ; ", [req.user.clientid,req.user.clientid, req.user.clientid], function (err, rs) {
    const quantity_array = [];
    const prod_array = [];
    const cat_array = [];
    const prods = [];

    rs[0].map(data => {

      cat_array.push(data.cat_name);
      prods.push(data.prod_name);
    });

    rs[2].map(data => {
      quantity_array.push(data.quant);
      prod_array.push(data.prod_name);

    });

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  // usage example:
  var unique_cat = cat_array.filter( onlyUnique ); 
  //var unique_prod = prod_array.filter( onlyUnique ); 
    res.render('product-report', {data:rs[1], unique_cat,prod_array, prods, quantity_array,  moment:moment});
  });

});


router.get('/product-search',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT *, sum(stockquantity) as quant FROM Products join category on Products.categoryid = category.cat_id where Products.clientid = ? and active_ind = 1  group by prod_name; SELECT * FROM  category left outer join Products on Products.categoryid = category.cat_id left outer join Supplier on Supplier.sup_id = Products.sup_id where Products.clientid = ? and active_ind = 1 and  (cat_name = ? or prod_name = ?) ; SELECT prod_name, sum(stockquantity) as quant FROM layanenterprises.Products where clientid = ? and active_ind = 1 group by prod_name order by stockquantity desc limit 7 ; ", [req.user.clientid,req.user.clientid, req.query.cat, req.query.prod, req.user.clientid], function (err, rs) {
    const quantity_array = [];
    const prod_array = [];
    const cat_array = [];
    const prods = [];

    rs[0].map(data => {

      cat_array.push(data.cat_name);
      prods.push(data.prod_name);
    });

    rs[2].map(data => {
      quantity_array.push(data.quant);
      prod_array.push(data.prod_name);
    });


    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  // usage example:
  var unique_cat = cat_array.filter( onlyUnique ); 
  //var unique_prod = prod_array.filter( onlyUnique ); 
    res.render('product-report', {data:rs[1], unique_cat, prods, prod_array,quantity_array,  moment:moment});
  });
});

router.get('/delete-product/:ids',  ensureAuthenticated, function (req, res, next) {
  var num = req.params.ids
  db.query('update Products set active_ind = 0 WHERE prod_id = ? ;', num , function (err, rs) {
    if (err) {
      res.send('err');
    }
    else {
      res.redirect('/product-report');
    }
  });
});


router.get('/supplier-report',  ensureAuthenticated, function (req, res, next) {
  db.query(" SELECT * FROM Supplier where clientid = ?  ; SELECT * FROM Supplier where clientid = ?; select sup_name,  sum(quantity) as quant from Supplier join  productPurchases on productPurchases.sup_id = Supplier.sup_id where Supplier.clientid = ? group by sup_name ; ", [req.user.clientid,req.user.clientid, req.user.clientid], function (err, rs) {
    const quantity_array = [];
    const sup_array = [];

    rs[2].map(data => {
      quantity_array.push(data.quant);
      sup_array.push(data.sup_name);
    });
    

    res.render('supplier-report', {data:rs[0], datas:rs[1], sup_array,quantity_array,  moment:moment});
  });

});

router.get('/supplier-search',  ensureAuthenticated, function (req, res, next) {
  db.query(" SELECT * FROM Supplier where clientid = ? and sup_name = ?; SELECT * FROM Supplier where clientid = ?  ; select sup_name, sum(stockquantity) as quant from Supplier join Products on Supplier.sup_id = Products.sup_id where Supplier.clientid = ? group by sup_name ; ", [req.user.clientid, req.query.sup, req.user.clientid, req.user.clientid], function (err, rs) {
    const quantity_array = [];
    const sup_array = [];

    rs[2].map(data => {
      quantity_array.push(data.quant);
      sup_array.push(data.sup_name);
    });
    

    res.render('supplier-report', {data:rs[0], datas:rs[1], sup_array,quantity_array,  moment:moment});
  });

});

router.get('/delete-supplier/:ids',  ensureAuthenticated, function (req, res, next) {
  var num = req.params.ids
  console.log(num)
  db.query('DELETE FROM Supplier WHERE sup_id = ? ;', num , function (err, rs) {
    if (err) {
      res.send('err');
    }
    else {
      res.redirect('/supplier-report');
    }
  });
});



router.get('/profit-report',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT *, cat_name, monthname(date) as months, year(date) as years, DATE_FORMAT(date,'%M/%Y') as dates, DATE_FORMAT(date,'%b/%Y') as datess, sum((Sales.price * Sales.quantity) - (Sales.quantity * Products.unitprice)) as profit FROM Sales join Products on Sales.prod_id = Products.prod_id  join category on Products.categoryid = category.cat_id where Sales.clientid = ? group by Products.categoryid, month(date), year(date) order by date; SELECT *, year(date) as years, cat_name, DATE_FORMAT(date,'%b/%Y') as dates, sum((Sales.price * Sales.quantity) - (Sales.quantity * Products.unitprice)) as profit FROM Sales join Products on Sales.prod_id = Products.prod_id  join category on Products.categoryid = category.cat_id where Sales.clientid = ? group by  month(date), year(date) order by date limit 7;", [req.user.clientid, req.user.clientid], function (err, rs) {

    const x_months = [];
    const profit_array = [];
    var maxyear = 0;
    var prevyear = 0;
    const cat_array = [];
    const years = [];
    const months = [];
    const cat = [];
    const cat_profit = [];

    rs[0].map(data => {
      var year = data.date.getFullYear();
      if(year > maxyear) maxyear= year;
      prevyear = maxyear - 1;
    });

      var maxyrsum = 0;
      var prevyrsum = 0;
  
      rs[0].map(data => {
        if(data.date.getFullYear() == maxyear)
        {
          maxyrsum += data.profit;
        }
        if(data.date.getFullYear() == prevyear)
        {
          prevyrsum += data.profit;
        }
      });

 /*
    for (var i = 0; i < rs.length; i++){
      total += rs[i].tot; 
    }

    */

    rs[1].map(data => {
      x_months.push(data.dates);
      profit_array.push(data.profit);
      cat_array.push(data.cat_name)
      years.push(data.years)
      months.push(data.months);
    });

    
    var result = [];
    rs[0].reduce(function(res, value) {
      if (!res[value.cat_name]) {
        res[value.cat_name] = { cat_name: value.cat_name, profit : 0 };
        result.push(res[value.cat_name])
      }
    res[value.cat_name].profit += value.profit;
    return res;
}, {});

result.map(data => {
  cat.push(data.cat_name);
  cat_profit.push(data.profit);
});

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }

  
  
  // usage example:
  var unique_cat = cat_array.filter( onlyUnique ); 
  var unique_mth = months.filter( onlyUnique );
  var unique_yr = years.filter( onlyUnique );

  var unique_cat = unique_cat.filter(function (el) {
    return el != null;
  });

    res.render('profit-report', {datas:rs[0], x_months,profit_array,unique_cat, cat, cat_profit, unique_mth, unique_yr,  prevyrsum, maxyrsum, moment : moment});
  });
});


router.get('/profitreport-search',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT *, cat_name, monthname(date) as months, year(date) as years, DATE_FORMAT(date,'%M/%Y') as dates, DATE_FORMAT(date,'%b/%Y') as datess, sum((Sales.price * Sales.quantity) - (Sales.quantity * Products.unitprice)) as profit FROM Sales join Products on Sales.prod_id = Products.prod_id  join category on Products.categoryid = category.cat_id where Sales.clientid = ? and (cat_name = ? or month(date) = ? or year(date) = ?) group by Products.categoryid, month(date), year(date) order by date; SELECT *, year(date) as years, DATE_FORMAT(date,'%b/%Y') as dates, sum((Sales.price * Sales.quantity) - (Sales.quantity * Products.unitprice)) as profit FROM Sales join Products on Sales.prod_id = Products.prod_id  join category on Products.categoryid = category.cat_id where Sales.clientid = ? group by  month(date), year(date) order by date;", [req.user.clientid, req.query.cat, req.query.month, req.query.year, req.user.clientid], function (err, rs) {

    console.log(rs);
    const x_months = [];
    const profit_array = [];
    var maxyear = 0;
    var prevyear = 0;
    const cat_array = [];
    const years = [];
    const months = [];
    const cat = [];
    const cat_profit = [];

    rs[0].map(data => {
      var year = data.date.getFullYear();
      if(year > maxyear) maxyear= year;
      prevyear = maxyear - 1;
    });


      var maxyrsum = 0;
      var prevyrsum = 0;
  
      rs[0].map(data => {
        if(data.date.getFullYear() == maxyear)
        {
          maxyrsum += data.profit;
        }
        if(data.date.getFullYear() == prevyear)
        {
          prevyrsum += data.profit;
        }
      });

 /*
    for (var i = 0; i < rs.length; i++){
      total += rs[i].tot; 
    }

    */

    rs[1].map(data => {
      x_months.push(data.dates);
      profit_array.push(data.profit);
      cat_array.push(data.cat_name)
      years.push(data.years)
      months.push(data.months);
 
    });

    var result = [];
    rs[0].reduce(function(res, value) {
      if (!res[value.cat_name]) {
        res[value.cat_name] = { cat_name: value.cat_name, profit : 0 };
        result.push(res[value.cat_name])
      }
    res[value.cat_name].profit += value.profit;
    return res;
}, {});

result.map(data => {
  cat.push(data.cat_name);
  cat_profit.push(data.profit);
});

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  // usage example:
  var unique_cat = cat_array.filter( onlyUnique ); 
  var unique_mth = months.filter( onlyUnique );
  var unique_yr = years.filter( onlyUnique );

  var unique_cat = unique_cat.filter(function (el) {
    return el != null;
  });

    res.render('profit-report', {datas:rs[0], x_months,profit_array,unique_cat, cat, cat_profit, unique_mth, unique_yr,  prevyrsum, maxyrsum, moment : moment});
  });
});

// expenses
router.get('/expenses',  ensureAuthenticated, function (req, res, next) {
    res.render('expenses');
});


router.post('/expenses', function (req, res, next) {
  const{date, shop_exp, prod_transp, sch_fee, contri, cop, hhold, sal, others} = req.body;
  var total_exp = parseFloat(shop_exp) + parseFloat(prod_transp) + parseFloat(sch_fee) + parseFloat(contri) + parseFloat(cop) + parseFloat(hhold) + parseFloat(sal) + parseFloat(others);
  const full_name = req.user.first_name + ' ' + req.user.last_name;
  db.query("Insert into Expenses (date, shop_expenses, good_transport, school_fees, contribution, coperative, household, salary, others, clientid, add_by, total_expenses) values ('" + date + "','" + shop_exp + "','" + prod_transp + "', '" + sch_fee + "','" + contri + "','" + cop + "', '" + hhold + "','" + sal + "','" + others + "','" + req.user.clientid + "','" + full_name + "', '" + total_exp + "')", function (err, rs) {
    if (err) {
      console.log(err);
      req.flash('error', 'Error: Expenses not Inserted')
      res.redirect('/expenses');
    }
    else {
      req.flash('success_msg', 'Expenses Successfully Added')
      res.redirect('/expenses');
    }
  });
});


router.get('/expenses-report', ensureAuthenticated, function (req, res, next) {
  db.query("SELECT *, year(date) as years, DATE_FORMAT(date,'%b/%Y') as dates FROM Expenses where clientid = ? order by date limit 7 ; SELECT *, year(date) as years, DATE_FORMAT(date,'%b/%Y') as dates FROM Expenses where clientid = ? order by date ; ", [req.user.clientid, req.user.clientid], function (err, rs) {
    const x_month = [];
    const tot_exp = [];
    const years = [];
    var maxyear = 0;
    var prevyear = 0;
 

    rs[0].map(data => {
      x_month.push(data.dates);
      tot_exp.push(data.total_expenses);
      years.push(data.years);
    });

    rs[1].map(data => {
      var year = data.date.getFullYear();
      if(year > maxyear) maxyear= year;
      prevyear = maxyear - 1;
    });


      var maxyrsum = 0;
      var prevyrsum = 0;
  
      rs[1].map(data => {
        if(data.date.getFullYear() == maxyear)
        {
          maxyrsum += data.total_expenses;
        }
        if(data.date.getFullYear() == prevyear)
        {
          prevyrsum += data.total_expenses;
        }
      });

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  // usage example:

  var unique_yr = years.filter( onlyUnique );
    
    res.render('expenses-report', {data:rs[1], x_month, unique_yr, tot_exp, maxyrsum, prevyrsum, moment:moment});
  });
});

router.get('/expenses-search',  ensureAuthenticated, function (req, res, next) {
  db.query("SELECT *, year(date) as years, DATE_FORMAT(date,'%b/%Y') as dates FROM Expenses where clientid = ? order by date limit 7 ; SELECT *, year(date) as years, DATE_FORMAT(date,'%b/%Y') as dates FROM Expenses where clientid = ? and (month(date) = ? or year(date) = ?) order by date ", [req.user.clientid, req.user.clientid,  req.query.month, req.query.year], function (err, rs) {
    const x_month = [];
    const tot_exp = [];
    const years = [];
    var maxyear = 0;
    var prevyear = 0;
 

    rs[0].map(data => {
      x_month.push(data.dates);
      tot_exp.push(data.total_expenses);
      years.push(data.years);
    });

    rs[0].map(data => {
      var year = data.date.getFullYear();
      if(year > maxyear) maxyear= year;
      prevyear = maxyear - 1;
    });


      var maxyrsum = 0;
      var prevyrsum = 0;
  
      rs[0].map(data => {
        if(data.date.getFullYear() == maxyear)
        {
          maxyrsum += data.total_expenses;
        }
        if(data.date.getFullYear() == prevyear)
        {
          prevyrsum += data.total_expenses;
        }
      });

    function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  // usage example:

  var unique_yr = years.filter( onlyUnique );
    
    res.render('expenses-report', {data:rs[1], x_month, unique_yr, tot_exp, maxyrsum, prevyrsum, moment:moment});
  });

});


router.get('/delete-expenses/:ids',  ensureAuthenticated, function (req, res, next) {
  var num = req.params.ids
  console.log(num)
  db.query('DELETE FROM Expenses WHERE exp_id = ? ;', num , function (err, rs) {
    if (err) {
      res.send('err');
    }
    else {
      res.redirect('/expenses-report');
    }
  });
});

//net profit
router.get('/netprofit',  ensureAuthenticated, function (req, res, next) {

    res.render('netprofit');
  });

  router.post('/netprofit', function (req, res, next) {
    const{date, profit, expenses, netprofit} = req.body;
    db.query("Insert into netprofit(date, profit, expenses, netprofit, clientid) values ('" + date+ "', '" + profit+ "' , '" + expenses+ "', '" + netprofit+ "', '" + req.user.clientid+ "')", function (err, rs) {
      if (err) {
        res.send('err');
      }
      else {
        req.flash('success_msg', 'Netprofit Successfully Added')
        res.redirect('/netprofit');
      }
    });
  });


  router.get('/netprofit-report',  ensureAuthenticated, function (req, res, next) {
    db.query("SELECT *, DATE_FORMAT(date,'%b/%Y') as dates from netprofit where clientid = ? ; ", [req.user.clientid], function (err, rs) {
      const x_month = [];
      const netprofit = [];
      var maxyear = 0;
      var prevyear = 0;
   
  
      rs.map(data => {
        x_month.push(data.dates);
        netprofit.push(data.Netprofit);
        var year = data.date.getFullYear();
        if(year > maxyear) maxyear= year;
        prevyear = maxyear - 1;
      });
  
  
        var maxyrsum = 0;
        var prevyrsum = 0;
    
        rs.map(data => {
          if(data.date.getFullYear() == maxyear)
          {
            maxyrsum += data.Netprofit;
          }
          if(data.date.getFullYear() == prevyear)
          {
            prevyrsum += data.Netprofit;
          }
        });
      
      res.render('netprofit-report', {data:rs, x_month,netprofit, maxyrsum, prevyrsum, moment:moment});
    });
  });

  router.get('/netprofit-search',  ensureAuthenticated, function (req, res, next) {
    db.query("SELECT *, DATE_FORMAT(date,'%b/%Y') as dates from netprofit where clientid = ? and month(date) = ? ; ", [req.user.clientid, req.query.month], function (err, rs) {
      const x_month = [];
      const netprofit = [];
      var maxyear = 0;
      var prevyear = 0;
   
  
      rs.map(data => {
        x_month.push(data.dates);
        netprofit.push(data.Netprofit);
        var year = data.date.getFullYear();
        if(year > maxyear) maxyear= year;
        prevyear = maxyear - 1;
      });
  
  
        var maxyrsum = 0;
        var prevyrsum = 0;
    
        rs.map(data => {
          if(data.date.getFullYear() == maxyear)
          {
            maxyrsum += data.Netprofit;
          }
          if(data.date.getFullYear() == prevyear)
          {
            prevyrsum += data.Netprofit;
          }
        });
      
      res.render('netprofit-report', {data:rs, x_month,netprofit, maxyrsum, prevyrsum, moment:moment});
    });
  });

  router.get('/delete-netprofit/:ids',  ensureAuthenticated, function (req, res, next) {
    var num = req.params.ids
    console.log(num)
    db.query('DELETE FROM netprofit WHERE netprofit_id = ? ;', num , function (err, rs) {
      if (err) {
        res.send('err');
      }
      else {
        res.redirect('/netprofit-report');
      }
    });
  });


  // Activate Product

  router.get('/activate-product',  ensureAuthenticated, function (req, res, next) {
    db.query("SELECT *, sum(stockquantity) as quant FROM Products join category on Products.categoryid = category.cat_id where Products.clientid = ? and active_ind = 0  group by prod_name ; SELECT * FROM  category join Products on Products.categoryid = category.cat_id  where Products.clientid = ? and active_ind = 0 ; SELECT prod_name, sum(stockquantity) as quant FROM layanenterprises.Products where clientid = ? and active_ind = 0 group by prod_name order by stockquantity desc limit 7 ; ", [req.user.clientid,req.user.clientid, req.user.clientid], function (err, rs) {
      const quantity_array = [];
      const prod_array = [];
      const cat_array = [];
      const prods = [];
  
      rs[0].map(data => {
  
        cat_array.push(data.cat_name);
        prods.push(data.prod_name);
      });
  
      rs[2].map(data => {
        quantity_array.push(data.quant);
        prod_array.push(data.prod_name);
  
      });
  
      function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }
    
    // usage example:
    var unique_cat = cat_array.filter( onlyUnique ); 
    //var unique_prod = prod_array.filter( onlyUnique ); 
      res.render('activate-product', {data:rs[1], unique_cat,prod_array, prods, quantity_array,  moment:moment});
    });
  
  });
  
  
  router.get('/product-activate-search',  ensureAuthenticated, function (req, res, next) {
    db.query("SELECT *, sum(stockquantity) as quant FROM Products join category on Products.categoryid = category.cat_id where Products.clientid = ? and active_ind = 0  group by prod_name; SELECT * FROM  category left outer join Products on Products.categoryid = category.cat_id left outer join Supplier on Supplier.sup_id = Products.sup_id where Products.clientid = ? and active_ind = 0 and  (cat_name = ? or prod_name = ?) ; SELECT prod_name, sum(stockquantity) as quant FROM layanenterprises.Products where clientid = ? and active_ind = 0 group by prod_name order by stockquantity desc limit 7 ; ", [req.user.clientid,req.user.clientid, req.query.cat, req.query.prod, req.user.clientid], function (err, rs) {
      const quantity_array = [];
      const prod_array = [];
      const cat_array = [];
      const prods = [];
  
      rs[0].map(data => {
  
        cat_array.push(data.cat_name);
        prods.push(data.prod_name);
      });
  
      rs[2].map(data => {
        quantity_array.push(data.quant);
        prod_array.push(data.prod_name);
      });
  
  
      function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }
    // usage example:
    var unique_cat = cat_array.filter( onlyUnique ); 
    //var unique_prod = prod_array.filter( onlyUnique ); 
      res.render('activate-product', {data:rs[1], prods, unique_cat,prod_array,quantity_array,  moment:moment});
    });
  });
  
  router.get('/activate-product/:ids',  ensureAuthenticated, function (req, res, next) {
    var num = req.params.ids
    db.query('update Products set active_ind = 1 WHERE prod_id = ? ;', num , function (err, rs) {
      if (err) {
        res.send('err');
      }
      else {
        res.redirect('/activate-product');
      }
    });
  });
  
  







module.exports = router;
