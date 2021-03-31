const mongoose = require('mongoose')

const { Schema } = mongoose

const userSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    email_status: { type: String, required: true, default: 'unverified' },
    password: { type: String, required: true },
    profile_picture: { type: String, required: true },

    audio_liked: [{ type: String, ref: 'Audio' }],
    video_liked: [{ type: String, ref: 'Video' }],
    blog_liked: [{ type: String, ref: 'Blog' }],

    total_video_added: { type: Number, default: 0 },
    total_audio_added: { type: Number, default: 0 },
    total_blogs_added: { type: Number, default: 0 },

    pending_video_added: { type: Number, default: 0 },
    pending_audio_added: { type: Number, default: 0 },
    pending_blogs_added: { type: Number, default: 0 },

    approved_video_added: { type: Number, default: 0 },
    approved_audio_added: { type: Number, default: 0 },
    approved_blogs_added: { type: Number, default: 0 },
    
    code: String,
    expired_at: { type: Date, required: true }
},
{
    timestamps: true
}
)
module.exports = mongoose.model('User', userSchema)
