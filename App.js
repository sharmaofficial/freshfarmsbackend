const express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser');
const dotenv = require('dotenv')
dotenv.config();

const url = `mongodb+srv://${process.env.dbUsername}:${process.env.dbPassword}${process.env.dbURL}?retryWrites=true&w=majority`
const app = express();

const port = process.env.PORT || 8080
var Routes = require('./routes');
const verifyToken = require('./utils/jwtMiddleware');
app.get('/favicon.ico', (req, res) => res.status(204));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE'
  );
  res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

const excludePaths = ['/register', '/login', '/admin/login', '/verifyPaymentHook', '/admin/login', '/forgotPassword', '/verifyOTP', '/updatePasswordWithoutAuth'];
app.use(verifyToken(excludePaths));
app.use(Routes.getRouter, Routes.postRouter);

mongoose.connect(url, 
  {
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useFindAndModify: false,
    autoIndex: true, 
    useCreateIndex: true, 
    useUnifiedTopology: true,
    keepAlive: true,
    poolSize: 10,
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  }, (err, db)=>{
    console.log("database connection success");
  if(err) console.log("error while connecting to mongo DB", err);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})