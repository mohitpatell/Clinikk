const jwt = require('jsonwebtoken')
const { isEmpty } = require('lodash')
const { Response } = require('../response-formatter')
const { STATUS_CODE } = require('../helpers/response-code')
const { AUTHENTICATION } = require('../helpers/constant')
const { User } = require('../../../db/models')
const { redisClient } = require('./redisClient')
const CryptoJS = require('crypto-js')
const authenticationToken = 'AwerT$&*123PoqweCv'
const {
    ENCRYPT_SECRET_KEY_USER
} = require('../../../config/config')

const validateUser = async (token, userId) => {
    let isExist = await redisClient.getAsync(`${token}`)
    if (isExist) {
        const isUser = await User.findById(userId)
        isExist = !isEmpty(isUser)
    }
    return isExist
}

const removeToken = async (token) => {
    await redisClient.del(token)
}

const genJWTToken = async (userId, expTime) => {
    const token = jwt.sign({ id: userId }, authenticationToken, {
        expiresIn: expTime // expires in 30 days 
    })
    await redisClient.setAsync(token, userId)
    // let isExist = await redisClient.getAsync(`${token}`)
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
    return CryptoJS.AES.encrypt(data, ENCRYPT_SECRET_KEY_USER).toString()
} 

const encryptObject = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPT_SECRET_KEY_USER).toString()
} 

const decryptString = (data) => {
    const bytes = CryptoJS.AES.decrypt(data, ENCRYPT_SECRET_KEY_USER)
    let originalText = bytes.toString(CryptoJS.enc.Utf8)
    return originalText
} 

const decryptObject = (data) => {
    const bytes = CryptoJS.AES.decrypt(data, ENCRYPT_SECRET_KEY_USER)
    let originalObject = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    return originalObject
} 

const userProfilePicture = {
    A: 'https://i0.wp.com/bane-tech.com/wp-content/uploads/2015/10/A.png?w=320&h=320&crop=1&ssl=1', 
    B: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/B1.png?w=320&h=320&crop=1&ssl=1',
    C: 'https://i0.wp.com/bane-tech.com/wp-content/uploads/2015/10/C.png?w=212&h=212&crop=1&ssl=1',
    D: 'https://i0.wp.com/bane-tech.com/wp-content/uploads/2015/10/D.png?w=212&h=212&crop=1&ssl=1',
    E: 'https://i0.wp.com/bane-tech.com/wp-content/uploads/2015/10/E.png?w=212&h=212&crop=1&ssl=1',
    F: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/F.png?w=212&h=212&crop=1&ssl=1',
    G: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/G.png?w=212&h=212&crop=1&ssl=1',
    H: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/H.png?w=212&h=212&crop=1&ssl=1',
    I: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/I.png?w=212&h=212&crop=1&ssl=1',
    J: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/J.png?w=212&h=212&crop=1&ssl=1',
    K: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/K.png?w=212&h=212&crop=1&ssl=1',
    L: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/L.png?w=212&h=212&crop=1&ssl=1',
    M: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/M.png?w=212&h=212&crop=1&ssl=1',
    N: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/N.png?w=212&h=212&crop=1&ssl=1',
    O: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/O.png?w=212&h=212&crop=1&ssl=1',
    P: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/P.png?w=212&h=212&crop=1&ssl=1',
    Q: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/Q.png?w=212&h=212&crop=1&ssl=1',
    R: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/R.png?w=212&h=212&crop=1&ssl=1',
    S: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/S.png?w=212&h=212&crop=1&ssl=1',
    T: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/T.png?w=212&h=212&crop=1&ssl=1',
    U: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/U.png?w=212&h=212&crop=1&ssl=1',
    V: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/V.png?w=212&h=212&crop=1&ssl=1',
    W: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/W.png?w=212&h=212&crop=1&ssl=1',
    X: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/X.png?w=212&h=212&crop=1&ssl=1',
    Y: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/Y.png?w=212&h=212&crop=1&ssl=1',
    Z: 'https://i1.wp.com/bane-tech.com/wp-content/uploads/2015/10/Z.png?w=212&h=212&crop=1&ssl=1'
}

module.exports = {
    genJWTToken,
    isAuthenticate,
    validateUser,
    removeToken,
    encryptString,
    encryptObject,
    decryptString,
    decryptObject,
    userProfilePicture
}
