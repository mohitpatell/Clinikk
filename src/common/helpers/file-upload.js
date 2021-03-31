const cloudinary = require('cloudinary').v2

const logger = require('./logger')
const { TYPE_LOG } = require('./constant')

const fs = require('fs')
const path = require('path')
const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
} = require('../../../config/config')

cloudinary.config({ 
    cloud_name: CLOUDINARY_CLOUD_NAME, 
    api_key: CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET 
})

const fileUpload = (file, fileType, fileName) => {
    return new Promise((resolve, reject) => {
        var oldPath = file.path
        // eslint-disable-next-line no-undef
        var newPath = path.join(__dirname, `../../../uploads/${fileType}`) + '/' + `${fileName}.${file.type.split('/')[1]}`
        var rawData = fs.readFileSync(oldPath)

        fs.writeFile(newPath, rawData, function (err, data) {
            if (err) reject(err)
            resolve(`/uploads/${fileType}/${fileName}.${file.type.split('/')[1]}`)
        })
    })
}

async function cloudinaryImageUpload (file, filePath, name) {
    try {
        // const data = await cloudinary.uploader.upload(file.path)
        const data = await cloudinary.uploader.upload(file.path, { public_id: `${filePath}/${name}`, responsive_breakpoints: { create_derived: true, bytes_step: 35000, min_width: 40, max_width: 1500, max_images: 5 } })
        return data
    } catch (err) {
        logger.error(TYPE_LOG.UPLOAD, 'Exception: Failed to upload ', err.stack)
        return err
    }
}

const singleImageUpload = async (file, filePath, fileName) => {
    const res = await cloudinaryImageUpload(file, filePath, fileName)
    return res
}

const audioVideoUpload = async (file, filePath, fileName) => {
    const res = await fileUpload(file, filePath, fileName)
    return res
}

const multipleImageUpload = async (files, filePath, fileName) => {
    let i = 0
    const res = await Promise.all(
        files.map(async file => {
            let uploaded_res = await cloudinaryImageUpload(file, filePath, `${fileName}-${i++}`)
            return uploaded_res.responsive_breakpoints[0].breakpoints
        })
    )
    return res
}

module.exports = {
    singleImageUpload,
    multipleImageUpload,
    audioVideoUpload
}
