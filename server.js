const express = require('express'),
  app = express(),
  bodyParser = require('body-parser');
  port = process.env.PORT || 3000;

const multer = require('multer');
//const upload = multer({dest: __dirname + '/uploads'});


// var storage = multer.diskStorage(
//   {
//       destination: __dirname + '/uploads',
//       filename: function (req, file, cb ) {
//         cb(null, Date.now() + '-' + file.originalname );
//       }
//   }
// );

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
      cb(null, req.session.userid + ".jpg");
  }
});

var upload = multer({storage: storage});
  
const session = require('express-session')
//let secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
app.use(session({
  //'secret': secret //Random secret, all sessions are invalid after server restart
  'secret': 'rh1fbygu58f8zzcgmjg84l', //Fixed secret, will last between sessions. More unsafe? If so, how?
  'cookie.maxAge': '3600000' //Cookie expiration is one hour (in ms)
}))

const mysql = require('mysql');
// connection configurations
const mc = mysql.createConnection({
    host: 'localhost',
    user: 'piedpiper',
    password: 'piedpiper',
    database: 'node'
});

var simulator = require('./simulator/simulator');
 
// connect to database
mc.connect();

app.listen(port);

console.log('API server started on port ' + port);

app.post('/api/uploadPhoto', upload.single('photo'), (req, res) => {
	try{
		res.send("success");
	}
	catch(err){
		res.send(400);
	}
});


//app.use(multer({dest:'./uploads/'}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./api/routes/appRoutes'); //importing route
routes(app); //register the route
