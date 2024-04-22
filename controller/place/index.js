var placeSchema = require('../../modal/place');
const Transloadit = require('transloadit');
const path = require('path');
const transloadit = new Transloadit({
    authKey   : 'a41b91ab894c4bb8bb36b2be0869503f',
    authSecret: 'f1b7f10813079cb67335df52165ab5e037dd9ed2',
  });
// const multer = require('multer');
// const {GridFsStorage} = require('multer-gridfs-storage');
// const storage = new GridFsStorage({
//     url : `mongodb://localhost/place-images`,
//     Option:{
//         useNewUrlParser: true,
//         useUnifieadTopology: true,
//         file:(req, file) => {
//             const match = ["image/png", "image/jpeg"];
//             if(match.indexOf(file.mimetype) === -1){
//                 const filename = `${Date.now()}-any-name-${file.originalname}`;
//                 return filename;
//             }
//             return{
//                 bucketName: "Photos",
//                 filename :`${Date.now()}-any-name-${file.originalname}`
//             }
//         }
//     }
// });

exports.placeList = (req, res, next) => {
    placeSchema.find({},(err, result) =>{
        console.log(result);
        res.send({status: 1, message:'Places list fetched', data: result})
    })
};

exports.addPlace = async(req, res, next) => {
    let place ;
    if(req.files){
        let uploadPath =  path.join(__dirname, 'asset/images/' + req.files.files.name);
    console.log("uploadPath",uploadPath);
    req.files.files.mv(uploadPath, function(err) {
        if (err){
            console.log("Error", err);
            return res.status(500).send(err);
        }
    
        res.send('File uploaded!');
      });
    try {
        const options = {
          files: {
            file1: uploadPath,
          },
          params: {
            steps: { // You can have many Steps. In this case we will just resize any inputs (:original)
              resize: {
                use   : ':original',
                robot : '/image/resize',
                result: true,
                width : 75,
                height: 75,
              },
            },
            // OR if you already created a template, you can use it instead of "steps":
            // template_id: 'YOUR_TEMPLATE_ID',
          },
          waitForCompletion: true,  // Wait for the Assembly (job) to finish executing before returning
        }
    
        const status = await transloadit.createAssembly(options)
    
        if (status.results.resize) {
            place={
                ...req.body,
                images:[status.results.resize[0].ssl_url]
            };
            placeSchema.create({...place}).then(result => {
                console.log('result', result);
                res.send({status: 1, message: 'Place Added'})
            }).catch(error => {
                // console.log('error', error.messsage);
                res.send({status: 0, message: error.message})
            })
          console.log('✅ Success - Your resized image:', status.results.resize[0].ssl_url);

        } else {
          console.log("❌ The Assembly didn't produce any output. Make sure you used a valid image file");
          placeSchema.create({...place}).then(result => {
            console.log('result', result);
            res.send({status: 1, message: 'Place Added'})
        }).catch(error => {
            // console.log('error', error.messsage);
            res.send({status: 0, message: error.message})
        })
        }
      } catch (err) {
        console.error('❌ Unable to process Assembly.', err)
        if (err.assemblyId) {
          console.error(`💡 More info: https://transloadit.com/assemblies/${err.assemblyId}`)
        }
      }
    }else{
        place={
            ...req.body
        };
        placeSchema.create({...place}).then(result => {
            console.log('result', result);
            res.send({status: 1, message: 'Place Added'})
        }).catch(error => {
            // console.log('error', error.messsage);
            res.send({status: 0, message: error.message})
        })
    }

};

exports.updatePlace = async(req, res, next) => {
    console.log(req.body);
    await placeSchema.findOneAndUpdate({_id: req.params.id},{...req.body}).then(result => {
        console.log('result', result);
        res.send({status: 1, message: 'Place updated'})
    }).catch(error => {
        console.log('error', error.messsage);
        res.send({status: 0, message: error.message})
    })
};

exports.deletePlace = async(req, res, next) => {
    console.log(req.body);
    await placeSchema.findByIdAndDelete({_id: req.params.id}).then(result => {
        console.log('result', result);
        res.send({status: 1, message: 'Place deleted'})
    }).catch(error => {
        // console.log('error', error.messsage);
        res.send({status: 0, message: error.message})
    })
};

exports.uploadImage = async(req, res, next) => {
    console.log("req", req.files.files);
    let uploadPath =  path.join(__dirname, 'asset/images/' + req.files.files.name);
    console.log("uploadPath",uploadPath);
    req.files.files.mv(uploadPath, function(err) {
        if (err){
            console.log("Error", err);
            return res.status(500).send(err);
        }
    
        res.send('File uploaded!');
      });
    try {
        const options = {
          files: {
            file1: uploadPath,
          },
          params: {
            steps: { // You can have many Steps. In this case we will just resize any inputs (:original)
              resize: {
                use   : ':original',
                robot : '/image/resize',
                result: true,
                width : 75,
                height: 75,
              },
            },
            // OR if you already created a template, you can use it instead of "steps":
            // template_id: 'YOUR_TEMPLATE_ID',
          },
          waitForCompletion: true,  // Wait for the Assembly (job) to finish executing before returning
        }
    
        const status = await transloadit.createAssembly(options)
    
        if (status.results.resize) {
          console.log('✅ Success - Your resized image:', status.results.resize[0].ssl_url);

        } else {
          console.log("❌ The Assembly didn't produce any output. Make sure you used a valid image file")
        }
      } catch (err) {
        console.error('❌ Unable to process Assembly.', err)
        if (err.assemblyId) {
          console.error(`💡 More info: https://transloadit.com/assemblies/${err.assemblyId}`)
        }
      }

    // if(req.file === undefined) return res.send({status: 0, message: "Please Select a file to Upload"})
    // console.log("req", req.file);

    // console.log(req.body);
    // await placeSchema.findByIdAndDelete({_id: req.params.id}).then(result => {
    //     console.log('result', result);
    //     res.send({status: 1, message: 'Place deleted'})
    // }).catch(error => {
    //     // console.log('error', error.messsage);
    //     res.send({status: 0, message: error.message})
    // })
};