const { Router } = require('express')

const { isAuthenticate } = require('../common/helpers/auth')
const {
    signup, 
    reSendCode,
    login, 
    logout, 
    verifyEmail, 
    resetPassword,
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
} = require('../controllers')

const {
    validateSignup,
    validateVerifyEmail,
    validateLogin,
    validateResetPass
} = require('../common/validators')
const { parseBody, parseBodyMultipleFile } = require('../common/helpers/http-request')

const routes = Router()

routes.post('/register', validateSignup, signup)
routes.post('/resend', reSendCode)
routes.post('/login', validateLogin, login)
routes.post('/logout', isAuthenticate, logout)
routes.post('/email/verify', validateVerifyEmail, verifyEmail)
routes.post('/password/reset', validateResetPass, resetPassword)

routes.post('/video/add', isAuthenticate, parseBodyMultipleFile, addVideo)
routes.post('/video/all', getApprovedVideo)
routes.post('/video/detail', getVideoDetails)
routes.get('/video/play', playVideo)
routes.post('/video/like', isAuthenticate, likeVideo)
routes.post('/video/unlike', unlikeVideo)
routes.post('/video/search', searchVideo)

routes.post('/audio/add', isAuthenticate, parseBody, addAudio)
routes.post('/audio/all', getAudio)
routes.post('/audio/detail', getAudioDetails)
routes.get('/audio/play', playAudio)
routes.post('/audio/like', isAuthenticate, likeAudio)
routes.post('/audio/unlike', unlikeAudio)
routes.post('/audio/search', searchAudio)

routes.post('/blog/add', isAuthenticate, parseBody, addBlog)
routes.post('/blog/all', getApprovedBlog)
routes.post('/blog/detail', getBlogDetail)
routes.post('/blog/like', isAuthenticate, likeBlog)
routes.post('/blog/unlike', unlikeBlog)
routes.post('/blog/search', searchBlog)

// Comment on video, audio and blog
routes.post('/comment/add', comment)
routes.post('/comment/reply', replyComment)
routes.post('/comment/upvote', upvoteComment)
routes.post('/comment/delete', deleteComment)

module.exports = routes
