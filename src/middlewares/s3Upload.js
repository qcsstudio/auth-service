const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

const uploadToS3 = (folder) =>
  multer({
    storage: multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET,
      acl: "public-read",
      key: (req, file, cb) => {
        const companyId = req.user.companyId;
        const ext = file.originalname.split(".").pop();
        cb(
          null,
          `companies/${companyId}/${folder}.${ext}`
        );
      },
    }),
  });

module.exports = uploadToS3;
