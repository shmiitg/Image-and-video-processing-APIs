const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024;
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__basedir + "/public/upload"));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const uploadFile = multer({
    storage: storage,
    limits: { fileSize: maxSize },
}).single("my_file");

const uploadFileMiddleware = util.promisify(uploadFile);

module.exports = uploadFileMiddleware;
