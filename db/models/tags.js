const mongoose = require('mongoose')
const { Schema } = mongoose

const tagsSchema = new Schema({
    all_tags: { type: Object }
})

module.exports = mongoose.model('Tag', tagsSchema)
