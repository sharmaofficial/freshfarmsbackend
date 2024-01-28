const express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser');
const dotenv = require('dotenv')
dotenv.config();
// var url = "mongodb://localhost:27017/TI";
const url = `mongodb+srv://sharmaofficial12:15Eaics7406@ecommerce.yp9eu3n.mongodb.net/freshfarms?retryWrites=true&w=majority`
const app = express();
//multer initialize
// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, 'asset/image'))
//   },
//   filename: (req, file, cd) => {
//     cd(null, Math.random().toString() + "-" + file.originalname);
//   }
// });

const port = process.env.PORT || 8080
var Routes = require('./routes');
var db  = require('./database');
const verifyToken = require('./utils/jwtMiddleware');
app.get('/favicon.ico', (req, res) => res.status(204));

app.use(bodyParser.json({limit: '50mb'}));
// app.use(fileUpload({limits: { fileSize: 50 * 1024 * 1024 },useTempfiles: true,tempFileDir : '/tmp/', debug: true}));
// app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
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

const excludePaths = ['/register', '/login'];
app.use(verifyToken(excludePaths));
app.use(Routes.getRouter, Routes.postRouter);

// app.use(db);
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