const { isEmpty } = require('lodash')
const { Admin, User, Audio, Video, Blog, Tag } = require('../../db/models')
const { genJWTToken, removeToken, encryptString } = require('../common/helpers/admin-auth')
const logger = require('../common/helpers/logger')
const { STATUS_CODE } = require('../common/helpers/response-code')
const { encrypt, decrypt } = require('../common/helpers/crypto')
const { Response, systemError } = require('../common/response-formatter')

const ADMIN_TOKEN_EXPIRED = 60 * 60 * 1 // expires in 30 days
const {
    AUTHENTICATION,
    LOGIN,
    LOGOUT,
    ADMIN,
    STATUS,
    VIDEO,
    AUDIO,
    BLOG,
    TYPE_LOG
} = require('../common/helpers/constant')

const register = async (req, res) => {
    const {
        username,
        password
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, ADMIN.SUCCESS, '')
    try {
        const existedAdmin = await Admin.findOne({ username: username })
        if (isEmpty(existedAdmin)) {
            const adminData = {
                username: username,
                password: encrypt(password)
            }
            await Admin.create(adminData)
        } else {
            response.statusCode = STATUS_CODE.EXISTED_VALUE
            response.message = ADMIN.EMAIL_EXIST
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Exeption, admin cannot register: ', err.stack)
        response = systemError(ADMIN.EXCEPTION)
    }
    res.send(response)
}

/**
 * User login API
 * @param {*} req: in body, pass through (email, password)
 * @param {*} res: if login is successful, return user's info and token
 *                 otherwise return error code as API's document
 */
const login = async (req, res) => {
    const {
        username,
        password
    } = req.body
    let response = Response(STATUS_CODE.SUCCESS, LOGIN.SUCCESS, '')

    try {
        const existedAdmin = await Admin.findOne({ username: `${username}` })

        if (isEmpty(existedAdmin)) {
            response.statusCode = STATUS_CODE.NOT_FOUND
            response.message = LOGIN.INVALID_ACCOUNT
        } else if (password !== decrypt(existedAdmin.password)) {
            response.statusCode = STATUS_CODE.INVALID_VALUE
            response.message = LOGIN.WRONG_PASS_EMAIL
        } else {
            const token = await genJWTToken(`${username}`, ADMIN_TOKEN_EXPIRED)

            response.data = {
                usern: existedAdmin.username,
                tokenn: token,
                user: encryptString(existedAdmin.username),
                token: encryptString(token)
            }
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Admin cannot login: ', err.stack)
        response = systemError(LOGIN.EXCEPTION)
    }
    res.send(response)
}

const logout = async (req, res) => {
    let response = Response(STATUS_CODE.SUCCESS, LOGOUT.SUCCESS, '')
    const token = req.headers.authorization.split(' ')[1]
    try {
        await removeToken(token)
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Admin cannot logout: ', err.stack)
        response = systemError(LOGOUT.EXCEPTION)
    }
    res.send(response)
}

const changeStatus = async (req, res) => {
    let {
        id,
        status,
        adminId,
        ownerId,
        userOwn,
        collectionType
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, status === 1 ? STATUS.APPROVED : STATUS.REJECTED, '')

    let mongooseCollection = collectionType === 2 ? Blog : collectionType === 1 ? Video : Audio
    try {
        if (userOwn !== adminId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            await mongooseCollection.findByIdAndUpdate(id, {
                $set: {
                    status: status
                }
            })

            if (status === 2) {
                await User.findByIdAndUpdate(ownerId, {
                    $inc: {
                        approved_blogs_added: 1
                    }
                })
            } else if (status === 1) {
                await User.findByIdAndUpdate(ownerId, {
                    $inc: {
                        approved_video_added: 1
                    }
                })
            } else {
                await User.findByIdAndUpdate(ownerId, {
                    $inc: {
                        approved_audio_added: 1
                    }
                })
            }
            const project = await mongooseCollection.findById(id)
            let tags = project.tags
            let allTags = await Tag.find()

            allTags = allTags[0]
            for (let i = 0; i < tags.length; i++) {
                if (allTags.all_tags[tags[i]]) {
                    allTags.all_tags[tags[i]]++
                } else {
                    allTags.all_tags[tags[i]] = 1
                }
            }
            await Tag.findByIdAndUpdate(allTags._id, {
                $set: {
                    all_tags: allTags.all_tags
                }
            })
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, `Exeption, cannot change status of ${collectionType} : `, err.stack)
        response = systemError(STATUS.EXCEPTION)
    }
    res.send(response)
}

const getPendingVideo = async (req, res) => {
    let {
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, VIDEO.FETCH, '')
    try {
        if (pageSize && pageNo) {
            response.data = await Video.find({ status: 0 }, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Video.find({ status: 0 }, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, `Exeption, Cannot fetch pending videos`, err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

const getAllVideo = async (req, res) => {
    let {
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, VIDEO.FETCH, '')
    try {
        if (pageSize && pageNo) {
            response.data = await Video.find({}, { title: 1, thubmnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Video.find({}, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, `Exeption, Cannot fetch all videos`, err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

const getPendingAudio = async (req, res) => {
    let {
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, AUDIO.FETCH, '')
    try {
        if (pageSize && pageNo) {
            response.data = await Audio.find({ status: 0 }, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Audio.find({ status: 0 }, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, `Exeption, Cannot fetch pending audio`, err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

const getAllAudio = async (req, res) => {
    let {
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, AUDIO.FETCH, '')
    try {
        if (pageSize && pageNo) {
            response.data = await Audio.find({}, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Audio.find({}, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, `Exeption, Cannot fetch all audio`, err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

const getPendingBlog = async (req, res) => {
    let {
        userOwn,
        adminId,
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, BLOG.FETCH, '')
    try {
        if (userOwn !== adminId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            if (pageSize && pageNo) {
                response.data = await Blog.find({ status: 0 }, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
            } else {
                pageSize = 50
                pageNo = 1
                response.data = await Blog.find({ status: 0 }, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
            }
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, `Exeption, Cannot fetch pending blog`, err.stack)
        response = systemError(BLOG.EXCEPTION)
    }
    res.send(response)
}

const getAllBlog = async (req, res) => {
    let {
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, BLOG.FETCH, '')
    try {
        if (pageSize && pageNo) {
            response.data = await Blog.find({}, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Blog.find({}, { title: 1, thumbnail_image: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, `Exeption, Cannot fetch all blog`, err.stack)
        response = systemError(BLOG.EXCEPTION)
    }
    res.send(response)
}

const addTag = async (req, res) => {
    const {
        adminId,
        userOwn,
        tagName
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, ADMIN.SUCCESS, '')

    try {
        if (userOwn !== adminId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            const tag = await Tag.find()
            tag[0].all_tags[tagName] = 0
            await Tag.findByIdAndUpdate(tag[0]._id, {
                $set: {
                    all_tags: tag[0].all_tags
                }
            })
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, 'Exeption, cannot add tag: ', err.stack)
        response = systemError(ADMIN.EXCEPTION)
    }
    res.send(response)
}

const getAllTags = async (req, res) => {
    const {
        adminId,
        userOwn
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, ADMIN.SUCCESS, '')

    try {
        if (userOwn !== adminId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            response.data = await Tag.find()
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, 'Exeption, cannot get tags: ', err.stack)
        response = systemError(ADMIN.EXCEPTION)
    }
    res.send(response)
}

const getAllUsers = async (req, res) => {
    const {
        adminId,
        userOwn,
        pageNo,
        pageSize
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, ADMIN.SUCCESS, '')
    try {
        if (adminId !== userOwn) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            response.data = await User.find({}, { code: 0 }).sort({ createdAt: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.ADMIN, 'Exeption, cannot get users: ', err.stack)
        response = systemError(ADMIN.EXCEPTION)
    }
    res.send(response)
}
module.exports = {
    register,
    login,
    logout,
    changeStatus,
    getPendingVideo,
    getAllVideo,
    getPendingAudio,
    getAllAudio,
    getPendingBlog,
    getAllBlog,
    addTag,
    getAllTags,
    getAllUsers
}
