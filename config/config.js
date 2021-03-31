const { config } = require('dotenv')

config()

/*eslint-disable */
module.exports = {
    MONGO_URL: process.env.MONGO_URL || '',
    SERVER_PORT: process.env.PORT,
    REDIS_URL: process.env.REDIS_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
    
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
    SENDGRID_SENDER: process.env.SENDGRID_SENDER,

    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
    BUCKET: process.env.BUCKET,

    ENCRYPT_SECRET_KEY_USER: process.env.ENCRYPT_SECRET_KEY_USER,
    ENCRYPT_SECRET_KEY_ADMIN: process.env.ENCRYPT_SECRET_KEY_ADMIN,

    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
}
