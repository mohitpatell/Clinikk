const mongoose = require('mongoose')

const { MONGO_URL } = require('../config/config')

const mongoConnect = () => {
    mongoose.connect(
        MONGO_URL,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    mongoose.Promise = global.Promise
    mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'))
    mongoose.set('useCreateIndex', true)
    mongoose.set('useFindAndModify', false)
}
mongoConnect()
