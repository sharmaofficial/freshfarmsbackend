exports.getRoute = (req, res, next) => {
    res.send('get api')
    console.log("get api");
}

exports.postRoute = (req, res, next) => {
    res.send('post api')
    console.log("post api");
}