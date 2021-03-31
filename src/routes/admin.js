const { Router } = require('express')

const { isAuthenticate } = require('../common/helpers/admin-auth')
const {
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
} = require('../controllers/adminController')

const {
    validateSignup,
    validateVerifyEmail,
    validateLogin,
    validateResetPass
} = require('../common/validators')

const routes = Router()

routes.post('/register', register)
routes.post('/login', login)
routes.post('/logout', logout)

routes.post('/status', isAuthenticate, changeStatus)

routes.post('/video/all', isAuthenticate, getAllVideo)
routes.post('/video/pending', isAuthenticate, getPendingVideo)

routes.post('/audio/all', isAuthenticate, getAllAudio)
routes.post('/audio/pending', isAuthenticate, getPendingAudio)

routes.post('/blog/all', isAuthenticate, getAllBlog)
routes.post('/blog/pending', isAuthenticate, getPendingBlog)

routes.post('/tags/add', isAuthenticate, addTag)
routes.post('/tags/all', getAllTags)

routes.post('/users/all', isAuthenticate, getAllUsers)
module.exports = routes
