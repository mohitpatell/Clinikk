const { isEmpty } = require('lodash')
const { User, Video, Audio, Blog } = require('../../db/models')
const otpGenerator = require('otp-generator')
const { genJWTToken, removeToken, encryptString, encryptObject, userProfilePicture } = require('../common/helpers/auth')
const fs = require('fs')
const uniqid = require('uniqid')
const logger = require('../common/helpers/logger')
const { STATUS_CODE } = require('../common/helpers/response-code')
const { Response, systemError } = require('../common/response-formatter')
const sendEmail = require('../common/helpers/email')
const { singleImageUpload, audioVideoUpload } = require('../common/helpers/file-upload')
const { encrypt, decrypt } = require('../common/helpers/crypto')
const {
    SIGNUP,
    LOGIN,
    LOGOUT,
    VERIFY_STATUS,
    TYPE_LOG,
    AUTHENTICATION,
    VARIABLE,
    VIDEO,
    AUDIO,
    BLOG,
    COMMENT
} = require('../common/helpers/constant')

/**
 * User Signup API
 * @param {*} req: in body, pass through (email, first name, last name, password)
 * @param {*} res: if signup is successful, return success response
 *                 otherwise return error code as API's document
 */

const signup = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password
    } = req.body

    let isSendEmail = false
    let accountName = `${firstName} ${lastName}`
    let response = Response(STATUS_CODE.SUCCESS, SIGNUP.SUCCESS, '')
    const pinCode = otpGenerator.generate(6, { specialChars: false })
    let validEmail = email.split('+')[0]
    validEmail = validEmail === email ? validEmail : validEmail + '@' + email.split('@')[1]
    try {
        const existedUser = await User.findOne({ email: `${validEmail}` })
        if (isEmpty(existedUser)) {
            const userData = {
                first_name: `${firstName}`,
                last_name: `${lastName}`,
                email: `${validEmail.toLocaleLowerCase()}`,
                profile_picture: userProfilePicture[firstName.toLocaleUpperCase().slice(0, 1)],
                code: pinCode,
                email_status: VERIFY_STATUS.UNVERIFIED,
                password: encrypt(`${password}`),
                expired_at: Date.now()
            }
            await User.create(userData)
            isSendEmail = true
        } else if (existedUser.email_status === VERIFY_STATUS.UNVERIFIED) {
            // accountName = existedUser.account_name
            await User.findOneAndUpdate({ email: `${email}` },
                { code: pinCode, expired_at: Date.now() })

            isSendEmail = true
        } else {
            response.statusCode = STATUS_CODE.EXISTED_VALUE
            response.message = `${SIGNUP.EMAIL_EXIST}`
        }

        if (isSendEmail) {
            const emailParams = {
                name: accountName,
                info: pinCode
            }
            await sendEmail(email.toLocaleLowerCase(),
                emailParams, 'email_verification', 'Confirm your clinikk account!')
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Exeption, user cannot signup: ', err.stack)
        response = systemError(SIGNUP.EXCEPTION)
    }
    res.send(response)
}

/**
 * Resend a `passcode` for verify account
 * @param {*} req: in body, pass through (email, first_name, last_name)
 * @param {*} res: Return error code as API's document
 */
const reSendCode = async (req, res) => {
    const pinCode = otpGenerator.generate(6, { specialChars: false })

    const {
        email,
        isSignup
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, SIGNUP.RESEND_CODE, { email: `${email}` })
    try {
        const existedUser = await User.findOne({ email: `${email.toLocaleLowerCase()}` })
        if (!isEmpty(existedUser)) {
            await User.findOneAndUpdate({ email: `${email.toLocaleLowerCase()}` }, { code: pinCode, expired_at: Date.now() })
            const emailParams = {
                name: `${existedUser.first_name} ${existedUser.last_name}`,
                info: pinCode
            }
            if (isSignup) {
                await sendEmail(email.toLocaleLowerCase(),
                    emailParams, 'email_verification', 'Confirm your clinikk account!')
            } else {
                await sendEmail(email.toLocaleLowerCase(),
                    emailParams, 'reset_password', 'Reset your clinikk password!')
            }
        } else {
            response.statusCode = STATUS_CODE.NOT_FOUND
            response.message = SIGNUP.USER_NOT_EXIST
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, ' Cannot resend PIN code for user: ', err.stack)
        response = systemError(SIGNUP.EXCEPTION)
    }
    res.send(response)
}

/**
 * User login API
 * @param {*} req: in body, pass through email value
 * @param {*} res: if login is successful, return user's info and token
 *                 otherwise return error code as API's document
 */
const login = async (req, res) => {
    const {
        email,
        password
    } = req.body
    let response = Response(STATUS_CODE.SUCCESS, LOGIN.SUCCESS, '')
    try {
        const existedUser = await User.findOne({ email: `${email}` })

        if (isEmpty(existedUser)) {
            response.statusCode = STATUS_CODE.NOT_FOUND
            response.message = LOGIN.INVALID_EMAIL
        } else if (existedUser.email_status === VERIFY_STATUS.UNVERIFIED) {
            response.statusCode = STATUS_CODE.UNVERIFIED_EMAIL
            response.message = LOGIN.UNVERIFIED_MAIL
        } else if (password !== decrypt(existedUser.password)) {
            response.statusCode = STATUS_CODE.INVALID_VALUE
            response.message = LOGIN.WRONG_PASS_EMAIL
        } else {
            const token = await genJWTToken(`${existedUser._id}`, VARIABLE.USER_TOKEN_EXPIRED)
            let userInfo = {
                firstName: existedUser.first_name,
                id: existedUser._id,
                email: existedUser.email,
                lastVisted: Date.now()
            }
            response.data = {
                usern: userInfo,
                tokenn: token,
                user: encryptObject(userInfo),
                token: encryptString(token)
            }
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'User cannot login: ', err.stack)
        response = systemError(LOGIN.EXCEPTION)
    }
    res.send(response)
}

/**
 * User logout API
 * @param {*} req: in header, pass through Autorization token
 * @param {*} res: if logout is successful, return success response
 *                 otherwise return error code as API's document
 */
const logout = async (req, res) => {
    let response = Response(STATUS_CODE.SUCCESS, LOGOUT.SUCCESS, '')
    const token = req.headers.authorization.split(' ')[1]
    try {
        await removeToken(token)
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'User cannot logout: ', err.stack)
        response = systemError(LOGOUT.EXCEPTION)
    }
    res.send(response)
}

/**
 * Add new video API
 * @param {*} req: in body, pass through (userId, title, thumbnailImage, description, category, adminPost)
 * @param {*} res: if video is added successfully, return success response
 *                 otherwise return error code as API's document
 */
const addVideo = async (req, res) => {
    let {
        userOwn,
        userId,
        title,
        thumbnailImage,
        category,
        description,
        tags,
        adminPost,
        videoPath
    } = req.body
    let response = Response(STATUS_CODE.SUCCESS, VIDEO.ADDED, '')
    try {
        if (userId !== userOwn) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            if (req.file.thumbnailImage[0] && req.file.video[0]) {
                console.log('Video Uploading Started........')
                videoPath = await audioVideoUpload(
                    req.file.video[0],
                    'video',
                    `${title}-${Date.now()}`
                )
                thumbnailImage = await singleImageUpload(
                    req.file.thumbnailImage[0],
                    'video_thumbnail',
                    `${title}-${Date.now()}`
                )
            }
            console.log('Video Uploading Ended........')
            const video = {
                title: title,
                thumbnail_image: thumbnailImage.responsive_breakpoints[0].breakpoints,
                description: description,
                category: category,
                owner_id: userId,
                tags: JSON.parse(tags),
                path: videoPath,
                admin_post: adminPost
            }
            const videoDetails = await Video.create(video)
            await Video.findByIdAndUpdate(videoDetails._id, {
                $set: {
                    video_url: `${VARIABLE.baseUrl}/users/video/play?id=${videoDetails._id}`
                }
            })
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    total_video_added: 1,
                    pending_video_added: 1
                }
            })
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Exeption, user cannot add video: ', err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

const getApprovedVideo = async (req, res) => {
    let {
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, VIDEO.FETCH, '')
    try {
        if (pageSize && pageNo) {
            response.data = await Video.find({ status: 1 }, { title: 1, thumbnail_image: 1, category: 1, likes: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Video.find({ status: 1 }, { title: 1, thumbnail_image: 1, category: 1, likes: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, Cannot fetch all videos`, err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

const getVideoDetails = async (req, res) => {
    let {
        videoId
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, VIDEO.FETCH, '')
    try {
        response.data = await Video.findOne({ _id: videoId }, { status: 0 }).populate('owner_id', { first_name: 1, last_name: 1, profile_picture: 1 })
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, Cannot fetch video details`, err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

const playVideo = async (req, res) => {
    const {
        id
    } = req.query
    let response = Response(STATUS_CODE.SUCCESS, VIDEO.SUCCESS, '')

    try {
        const videoDetails = await Video.findById(id)
        if (videoDetails) {
            const path = videoDetails.path
            const stat = fs.statSync(path)
            const fileSize = stat.size
            const range = req.headers.range
            const parts = range.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0], 10)
            const CHUNK_SIZE = 10 ** 6
            const end = Math.min(start + CHUNK_SIZE, fileSize - 1)
            const chunkSize = end - start + 1
            const file = fs.createReadStream(path, { start, end })
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Range': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4'
            }

            res.writeHead(206, head)
            file.pipe(res)
        } else {
            res.status(404).json('Video file Does not exist')
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Exeption, user cannot play video: ', err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

const likeVideo = async (req, res) => {
    let {
        userId,
        userOwn,
        videoId
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, VIDEO.LIKED, '')
    try {
        if (userOwn !== userId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            await Promise.all([
                Video.findByIdAndUpdate(videoId, {
                    $inc: {
                        like_count: 1
                    },
                    $addToSet: {
                        likes: userId
                    }
                }),
                User.findByIdAndUpdate(userId, {
                    $addToSet: {
                        video_liked: videoId
                    }
                })

            ])
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot like video: `, err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

const unlikeVideo = async (req, res) => {
    let {
        userId,
        userOwn,
        videoId
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, VIDEO.LIKED, '')

    try {
        if (userOwn !== userId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            await Promise.all([
                Video.findByIdAndUpdate(videoId, {
                    $inc: {
                        like_count: -1
                    },
                    $pull: {
                        likes: userId
                    }
                }),
                User.findByIdAndUpdate(userId, {
                    $pull: {
                        video_liked: videoId
                    }
                })

            ])
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot unlike video: `, err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

const searchVideo = async (req, res) => {
    let {
        keyword,
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, VIDEO.SEARCH, '')

    try {
        if (pageSize && pageNo) {
            response.data = await Video.find({ $and: [{ status: 1 }, { $text: { $search: keyword } }] }, { title: 1, category: 1, thumbnail_image: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Video.find({ $and: [{ status: 1 }, { $text: { $search: keyword } }] }, { title: 1, category: 1, thumbnail_image: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot search video for keywork: ${keyword} `, err.stack)
        response = systemError(VIDEO.EXCEPTION)
    }
    res.send(response)
}

/**
 * Add new audio API
 * @param {*} req: in body, pass through (userId, title, description, category, adminPost)
 * @param {*} res: if video is added successfully, return success response
 *                 otherwise return error code as API's document
 */
const addAudio = async (req, res) => {
    let {
        userOwn,
        userId,
        title,
        description,
        category,
        tags,
        adminPost,
        audioPath
    } = req.body
    let response = Response(STATUS_CODE.SUCCESS, AUDIO.ADDED, '')

    try {
        if (userId !== userOwn) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            if (req.file[0]) {
                console.log('Audio Uploading Started........')
                audioPath = await audioVideoUpload(
                    req.file[0],
                    'audio',
                    `${title}-${Date.now()}`
                )
            }
            console.log('Audio Uploading Ended........')
            const audio = {
                title: title,
                description: description,
                category: category,
                owner_id: userId,
                tags: JSON.parse(tags),
                path: audioPath,
                admin_post: adminPost
            }
            const audioDetails = await Audio.create(audio)
            await Audio.findByIdAndUpdate(audioDetails._id, {
                $set: {
                    audio_url: `${VARIABLE.baseUrl}/users/audio/play?id=${audioDetails._id}`
                }
            })
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    total_audio_added: 1,
                    pending_audio_added: 1
                }
            })
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Exeption, user cannot add audio: ', err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

const getAudio = async (req, res) => {
    let {
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, AUDIO.FETCH, '')

    try {
        if (pageSize && pageNo) {
            response.data = await Audio.find({ status: 1 }, { title: 1, category: 1, description: 1, like_count: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Audio.find({ status: 1 }, { title: 1, category: 1, description: 1, like_count: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, Cannot fetch audio: `, err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

const getAudioDetails = async (req, res) => {
    let {
        audioId
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, AUDIO.FETCH, '')
    try {
        response.data = await Audio.findOne({ _id: audioId }, { status: 0 }).populate('owner_id', { first_name: 1, last_name: 1, profile_picture: 1 })
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, Cannot fetch audio details`, err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

const playAudio = async (req, res) => {
    const {
        id
    } = req.query
    let response = Response(STATUS_CODE.SUCCESS, AUDIO.SUCCESS, '')

    try {
        const audioDetails = await Audio.findById(id)
        if (audioDetails) {
            const path = audioDetails.path
            const stat = fs.statSync(path)
            const fileSize = stat.size
            const range = req.headers.range
            const parts = range.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0], 10)
            const CHUNK_SIZE = 10 ** 6
            const end = Math.min(start + CHUNK_SIZE, fileSize - 1)
            const chunkSize = end - start + 1
            const file = fs.createReadStream(path, { start, end })
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Range': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'audio/mpeg'
            }

            res.writeHead(206, head)
            file.pipe(res)
        } else {
            res.status(404).json('Audio file Does not exist')
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Exeption, user cannot play audio: ', err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

const likeAudio = async (req, res) => {
    let {
        userId,
        userOwn,
        audioId
    } = req.body
    let response = Response(STATUS_CODE.SUCCESS, AUDIO.LIKED, '')
    try {
        if (userOwn !== userId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            await Promise.all([
                Audio.findByIdAndUpdate(audioId, {
                    $inc: {
                        like_count: 1
                    },
                    $addToSet: {
                        likes: userId
                    }
                }),
                User.findByIdAndUpdate(userId, {
                    $addToSet: {
                        audio_liked: audioId
                    }
                })

            ])
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot like audio: `, err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

const unlikeAudio = async (req, res) => {
    let {
        userId,
        userOwn,
        audioId
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, AUDIO.LIKED, '')

    try {
        if (userOwn !== userId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            await Promise.all([
                Video.findByIdAndUpdate(audioId, {
                    $inc: {
                        like_count: -1
                    },
                    $pull: {
                        likes: userId
                    }
                }),
                User.findByIdAndUpdate(userId, {
                    $pull: {
                        audio_liked: audioId
                    }
                })

            ])
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot unlike audio: `, err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

const searchAudio = async (req, res) => {
    let {
        keyword,
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, AUDIO.SEARCH, '')

    try {
        response.data = await Audio.find({ $and: [{ status: 1 }, { $text: { $search: keyword } }] }, { title: 1, category: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot search audio for keywork: ${keyword} `, err.stack)
        response = systemError(AUDIO.EXCEPTION)
    }
    res.send(response)
}

/**
 * Add new audio API
 * @param {*} req: in body, pass through (userId, title, thubmnailImage, description, category, adminPost)
 * @param {*} res: if video is added successfully, return success response
 *                 otherwise return error code as API's document
 */
const addBlog = async (req, res) => {
    let {
        userOwn,
        userId,
        title,
        thumbnailImage,
        description,
        category,
        tags,
        adminPost
    } = req.body
    let response = Response(STATUS_CODE.SUCCESS, BLOG.ADDED, '')

    try {
        if (userId !== userOwn) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            if (req.file[0]) {
                thumbnailImage = await singleImageUpload(
                    req.file[0],
                    'blog_thumbnail',
                    `${title}-${Date.now()}`
                )
            }
            const blog = {
                title: title,
                thumbnail_image: thumbnailImage.responsive_breakpoints[0].breakpoints,
                description: description,
                category: category,
                owner_id: userId,
                tags: JSON.parse(tags),
                admin_post: adminPost
            }
            await Blog.create(blog)
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    total_blogs_added: 1,
                    pending_blogs_added: 1
                }
            })
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, 'Exeption, user cannot add blog: ', err.stack)
        response = systemError(BLOG.EXCEPTION)
    }
    res.send(response)
}

const getApprovedBlog = async (req, res) => {
    let {
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, BLOG.FETCH, '')

    try {
        if (pageSize && pageNo) {
            response.data = await Blog.find({ status: 1 }, { title: 1, thumbnailImage: 1, category: 1, like_count: 1 }).populate('owner_id', { first_name: 1, last_name: 1, profile_picture: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        } else {
            pageSize = 50
            pageNo = 1
            response.data = await Blog.find({ status: 1 }, { title: 1, thumbnailImage: 1, category: 1, like_count: 1 }).populate('owner_id', { first_name: 1, last_name: 1, profile_picture: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, Cannot fetch approved blogs: `, err.stack)
        response = systemError(BLOG.EXCEPTION)
    }
    res.send(response)
}

const getBlogDetail = async (req, res) => {
    let {
        blogId
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, BLOG.FETCH, '')

    try {
        response.data = await Blog.find({ _id: blogId }, { status: 0 }).populate('owner_id', { first_name: 1, last_name: 1, profile_picture: 1 })  
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, Cannot fetch blog details: `, err.stack)
        response = systemError(BLOG.EXCEPTION)
    }
    res.send(response)
}

const likeBlog = async (req, res) => {
    let {
        userId,
        userOwn,
        blogId
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, BLOG.LIKED, '')
    try {
        if (userOwn !== userId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            await Promise.all([
                Blog.findByIdAndUpdate(blogId, {
                    $inc: {
                        like_count: 1
                    },
                    $addToSet: {
                        likes: userId
                    }
                }),
                User.findByIdAndUpdate(userId, {
                    $addToSet: {
                        blog_liked: blogId
                    }
                })

            ])
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot like blog: `, err.stack)
        response = systemError(BLOG.EXCEPTION)
    }
    res.send(response)
}

const unlikeBlog = async (req, res) => {
    let {
        userId,
        userOwn,
        blogId
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, BLOG.LIKED, '')

    try {
        if (userOwn !== userId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            await Promise.all([
                Blog.findByIdAndUpdate(blogId, {
                    $inc: {
                        like_count: -1
                    },
                    $pull: {
                        likes: userId
                    }
                }),
                User.findByIdAndUpdate(userId, {
                    $pull: {
                        blog_liked: blogId
                    }
                })

            ])
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot unlike blog: `, err.stack)
        response = systemError(BLOG.EXCEPTION)
    }
    res.send(response)
}

const searchBlog = async (req, res) => {
    let {
        keyword,
        pageSize,
        pageNo
    } = req.body

    let response = Response(STATUS_CODE.SUCCESS, BLOG.SEARCH, '')

    try {
        response.data = await Blog.find({ $and: [{ status: 1 }, { $text: { $search: keyword } }] }, { title: 1, category: 1, thumbnail_image: 1 }).sort({ created_at: 1 }).skip(pageSize * (pageNo - 1)).limit(pageSize)
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user cannot search blog for keywork: ${keyword} `, err.stack)
        response = systemError(BLOG.EXCEPTION)
    }
    res.send(response)
}

const comment = async (req, res) => {
    const {
        userId,
        id,
        text,
        collectionType
    } = req.body

    let mongooseCollection = collectionType === 2 ? Blog : collectionType === 1 ? Video : Audio
    let response = Response(STATUS_CODE.SUCCESS, COMMENT.SUCCESS, '')
    try {
        const commentData = {
            id: uniqid(),
            user_id: userId,
            text: text,
            reply: [],
            upvote: 0,
            created_at: Date.now()
        }
        await mongooseCollection.findByIdAndUpdate(id, {
            $push: {
                comments: commentData
            }
        })
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user ${userId} cannot comment for collection ${collectionType}: `, err.stack)
        response = systemError(COMMENT.EXCEPTION)
    }
    res.send(response)
}

const replyComment = async (req, res) => {
    const {
        userId,
        commentId,
        text,
        collectionType
    } = req.body
    let mongooseCollection = collectionType === 2 ? Blog : collectionType === 1 ? Video : Audio
    let response = Response(STATUS_CODE.SUCCESS, COMMENT.SUCCESS, '')
    try {
        const replyData = {
            id: uniqid(),
            user_id: userId,
            text: text,
            upvote: 0,
            created_at: Date.now()
        }
        await mongooseCollection.findOneAndUpdate({ 'comments.id': commentId }, {
            $push: {
                'comments.$.reply': replyData
            }
        })
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user ${userId} cannot reply comment for collection ${collectionType}: `, err.stack)
        response = systemError(COMMENT.EXCEPTION)
    }
    res.send(response)
}

const upvoteComment = async (req, res) => {
    const {
        userId,
        commentId,
        collectionType
    } = req.body
    let mongooseCollection = collectionType === 2 ? Blog : collectionType === 1 ? Video : Audio
    let response = Response(STATUS_CODE.SUCCESS, COMMENT.UPVOTED, '')
    try {
        await mongooseCollection.findOneAndUpdate({ 'comments.id': commentId }, {
            $inc: {
                'comments.$.up_vote': 1
            }
        })
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user ${userId} cannot upvote comment for collection ${collectionType}: `, err.stack)
        response = systemError(COMMENT.EXCEPTION)
    }
    res.send(response)
}

const deleteComment = async (data) => {
    const {
        userOwn,
        userId,
        projectId,
        commentId,
        replyId,
        reply,
        collectionType
    } = data

    let response = Response(STATUS_CODE.SUCCESS, COMMENT.DELETED, '')
    let mongooseCollection = collectionType === 2 ? Blog : collectionType === 1 ? Video : Audio
    try {
        if (userOwn !== userId) {
            response.statusCode = STATUS_CODE.UNAUTHORIZATION
            response.message = AUTHENTICATION.UNAUTHORIZED
        } else {
            if (!reply) {
                await mongooseCollection.findByIdAndUpdate(projectId, {
                    $pull: { comments: { id: commentId } }
                })
            } else {
                await mongooseCollection.findOneAndUpdate({ 'comments.id': commentId }, {
                    $pull: {
                        'comments.$.reply': { id: replyId }
                    }
                })
            }
        }
    } catch (err) {
        logger.error(TYPE_LOG.USER, `Exeption, user ${userId} cannot delete the comment for collection ${collectionType}: `, err.stack)
        response = systemError(COMMENT.EXCEPTION)
    }
    return data
}

module.exports = {
    signup,
    login,
    logout,
    reSendCode,
    addVideo,
    getApprovedVideo,
    getVideoDetails,
    playVideo,
    likeVideo,
    unlikeVideo,
    searchVideo,
    addAudio,
    getAudio,
    getAudioDetails,
    playAudio,
    likeAudio,
    unlikeAudio,
    searchAudio,
    addBlog,
    getApprovedBlog,
    getBlogDetail,
    likeBlog,
    unlikeBlog,
    searchBlog,
    comment,
    replyComment,
    upvoteComment,
    deleteComment
}
