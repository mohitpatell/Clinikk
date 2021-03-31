const jwt = require('jsonwebtoken')
const { isEmpty } = require('lodash')
const { Response } = require('../response-formatter')
const { STATUS_CODE } = require('../helpers/response-code')
const { AUTHENTICATION } = require('../helpers/constant')
const { Admin } = require('../../../db/models')
const { redisClient } = require('./redisClient')
const CryptoJS = require('crypto-js')
const {
    ENCRYPT_SECRET_KEY_ADMIN
} = require('../../../config/config')

const authenticationToken = 'AwerT$&*123PoqweCv'

const validateUser = async (token, userName) => {
    let isExist = await redisClient.getAsync(`${token}`)
    if (isExist) {
        const isUser = await Admin.findOne({ username: `${userName}` })
        isExist = !isEmpty(isUser)
    }
    return isExist
}

const removeToken = async (token) => {
    await redisClient.del(token)
}

const genJWTToken = async (username, expTime) => {
    const token = jwt.sign({ id: username }, authenticationToken, {
        expiresIn: expTime // expires in 30 days 
    })
    await redisClient.setAsync(token, username)
    redisClient.expire(token, expTime)
    return token
}

const isAuthenticate = async (req, res, next) => {
    let response = Response(STATUS_CODE.SUCCESS, AUTHENTICATION.SUCCESS, false, '')

    try {
        const token = req.header('Authorization').replace('Bearer', '').trim()
        if (token) {
            const decoded = jwt.verify(token, authenticationToken)
            const isUser = await validateUser(`${token}`, decoded.id)
            if (!isUser) {
                response.hasError = true
                response.statusCode = STATUS_CODE.INVALID_VALUE
                response.message = AUTHENTICATION.INVALID_TOKEN
            } else {
                // eslint-disable-next-line require-atomic-updates
                req.body.userOwn = decoded.id
            }
        } else {
            response.hasError = true
            response.statusCode = STATUS_CODE.NOT_FOUND
            response.message = AUTHENTICATION.TOKEN_NOT_FOUND
        }
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            response.hasError = true
            response.statusCode = STATUS_CODE.EXPIRED_VALUE
            response.message = AUTHENTICATION.TOKEN_EXPIRED
        } else {
            response.hasError = true
            response.statusCode = STATUS_CODE.SERVER_ERROR
            response.message = AUTHENTICATION.INVALID_TOKEN
        }
    }

    if (response.hasError) {
        res.send(response)
    } else {
        next()
    }
}

const encryptString = (data) => {
    return CryptoJS.AES.encrypt(data, ENCRYPT_SECRET_KEY_ADMIN).toString()
} 

const decryptString = (data) => {
    const bytes = CryptoJS.AES.decrypt(data, ENCRYPT_SECRET_KEY_ADMIN)
    let originalText = bytes.toString(CryptoJS.enc.Utf8)
    return originalText
} 

module.exports = {
    genJWTToken,
    isAuthenticate,
    validateUser,
    removeToken,
    encryptString,
    decryptString
}
