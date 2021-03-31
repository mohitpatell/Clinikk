const mongoose = require('mongoose')

const { Schema } = mongoose

const reply = new Schema({
    id: { type: String },
    user_id: { type: String, ref: 'User' },
    text: { type: String },
    up_vote: { type: Number, default: 0 },
    created_at: { type: Date }
}, { _id: false })

const comment = new Schema({
    id: { type: String },
    user_id: { type: String, ref: 'User' },
    text: { type: String },
    reply: [reply],
    up_vote: { type: Number, default: 0 },
    created_at: { type: Date }
}, { _id: false })

const audioSchema = new Schema({
    title: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    path: { type: String, required: true },
    owner_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    admin_post: { type: Boolean, required: true },
    audio_url: { type: String, default: '' },
    tags: { type: Array, default: [] },
    like_count: { type: Number, default: 0 },
    likes: { type: Array, default: [] },
    comments: [comment],
    status: { type: Number, default: 0, enum: [0, 1, 2] } // 0: pending, 1: approved, 2: rejected
},
{
    timestamps: true
}
)
module.exports = mongoose.model('Audio', audioSchema)
