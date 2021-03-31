module.exports = {
    AUTHENTICATION: {
        SUCCESS: 'Token is valid',
        INVALID_TOKEN: 'Invalid token. Please login again',
        TOKEN_EXPIRED: 'Your session has expired. Please login again',
        TOKEN_NOT_FOUND: 'Invalid request No Token Found. Please login again',
        EXCEPTION: 'You cannot do any actions now. Please contact our support team.',
        UNAUTHORIZED: 'Not allowed'
    },
    LOGIN: {
        SUCCESS: 'Login is successful',
        INVALID_ACCOUNT: ' This account doesn\'t exist. Please sign up',
        INVALID_EMAIL: 'You entered an invalid email address',
        UNVERIFIED_MAIL: ' Please veify your email address. Click here to resend verification code ',
        WRONG_PASS_EMAIL: 'Your username or password is wrong',
        EXCEPTION: 'Please contact our support team to help'
    },
    LOGOUT: {
        SUCCESS: 'You have successfully logged out',
        EXCEPTION: 'Oops! Something went wrong. Please contact our support team.'
    },
    SIGNUP: {
        SUCCESS: 'Your account registration is successful',
        EMAIL_EXIST: 'This email already exists. Please login.',
        RESEND_CODE: 'Verification code successfully sent to your email',
        USER_NOT_EXIST: 'This user does not exist',
        PASSWORD_RESET: 'Your password reset successfully',
        EXCEPTION: 'Our system is busy, kindly go back in couple hours for singing up'
    },
    VERIFY_MESSAGE: {
        SUCCESS: 'Your account verificaiton is successful.',
        INVALID_PASSCODE: 'The verification code is wrong. Please try again',
        EXPIRED_PASSCODE: 'The verification code has expired. Click here to resend one',
        EMAIL_NOT_FOUND: 'You will receive an email in your inbox if this email is registered on Platform.',
        EXCEPTION: 'It seems you cannot verify your code now, kindly try in a minute'
    },
    VERIFY_STATUS: {
        VERIFIED: 'verified',
        UNVERIFIED: 'unverified'
    },
    VIDEO: {
        SUCCESS: 'Your request is successfull',
        ADDED: 'Video added successfully',
        FETCH: 'Video fetch successfully',
        APPROVED: 'Video approved',
        REJECTED: 'Video rejected',
        UPDATED: 'Your video updated successfully',
        LIKED: 'Video liked successfully',
        UNLIKED: 'Video unliked successfully',
        COMMENT: 'Commented on Video',
        VIEW: 'View added for Video',
        DELETECOMMENT: 'Comment deleted successfully',
        NOT_EXIST: 'This video does not exist',
        EXCEPTION: 'Oops! Something went wrong. Please contact our support team.'
        
    },
    AUDIO: {
        SUCCESS: 'Your request is successfull',
        ADDED: 'Audio added successfully',
        FETCH: 'Audio fetch successfully',
        APPROVED: 'Audio approved',
        REJECTED: 'Audio rejected',
        UPDATED: 'Your audio updated successfully',
        LIKED: 'Audio liked successfully',
        UNLIKED: 'Audio unliked successfully',
        COMMENT: 'Commented on Audio',
        VIEW: 'View added for Audio',
        DELETECOMMENT: 'Comment deleted successfully',
        NOT_EXIST: 'This audio does not exist',
        EXCEPTION: 'Oops! Something went wrong. Please contact our support team.'
        
    },
    BLOG: {
        SUCCESS: 'Your request is successfull',
        ADDED: 'Blog added successfully',
        FETCH: 'Blog fetch successfully',
        APPROVED: 'Blog approved',
        REJECTED: 'Blog rejected',
        UPDATED: 'Your blog updated successfully',
        LIKED: 'Blog liked successfully',
        UNLIKED: 'Blog unliked successfully',
        COMMENT: 'Commented on Blog',
        VIEW: 'View added for Blog',
        DELETECOMMENT: 'Comment deleted successfully',
        NOT_EXIST: 'This blog does not exist',
        EXCEPTION: 'Oops! Something went wrong. Please contact our support team.'
        
    },
    STATUS: {
        APPROVED: 'Approved successfully',
        REJECTED: 'Rejected successfully',
        EXCEPTION: 'Please contact our support team to help'
    },
    COMMENT: {
        SUCCESS: 'Comment added successfully',
        FAILED: 'Failed to add comment',
        UPVOTED: 'Upvoted to comment',
        DELETED: 'Comment deleted successfuly',
        EXCEPTION: 'Please contact our support team to help'
    },
    ADMIN: {
        SUCCESS: 'Your request is successfull',
        UPDATED: 'Your profile updated successfully',
        NOT_EXIST: 'This admin does not exist',
        EXCEPTION: 'Oops! Something went wrong. Please contact our support team.'
        
    },
    TYPE_LOG: {
        USER: 'USER',
        ADMIN: 'ADMIN'
    },
    VARIABLE: {
        USER_TOKEN_EXPIRED: 60 * 60 * 24 * 30, // 30 days
        baseUrl: 'http:localhost:3000/api'
    }
}
