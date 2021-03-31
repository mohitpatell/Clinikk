const { comment, deleteComment } = require('./userController')
module.exports = (io) => {
    io.on('connection', socket => {
        socket.on('join', (id) => {
            console.log('connected', socket.ID)
            socket.join(id)
            socket.broadcast.emit('userJoined', { message: 'New User Connected', id: id })
        })

        /**
         * Comments on video, audio and blog
         * data object keys
         * @param {*} userId 
         * @param {*} id 
         * @param {*} text 
         * @param {*} reply 
         * @param {*} commentId 
         * @param {*} collectionType 
         */

        socket.on('comment', async (data) => {
            let commentResponse = await comment(data)
            io.to(data.notifierId).emit('comment', commentResponse)
        })

        socket.on('deleteComment', async (data) => {
            let commentResponse = await deleteComment(data)
            io.to(data.notifierId).emit('deleteComment', commentResponse)
        })

        socket.on('disconnect', (s) => {
            console.log('disconnected', socket.ID)
            socket.broadcast.emit('userDisconnected', { message: 'User Disconnected', id: socket.ID })
        })
    })
}

// eslint-disable-next-line no-unused-vars
const formatMessage = (userId, text, statusCode) => {
    return {
        statusCode: statusCode,
        userId: userId,
        message: text,
        time: Date.now()
    }
}
