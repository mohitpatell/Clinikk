module.exports = {
    firstName: {
        in: ['body'],
        errorMessage: '"firstName" field is missing',
        exists: true
    },
    lastName: {
        in: ['body'],
        errorMessage: '"lastName" field is missing',
        exists: true
    },
    email: {
        in: ['body'],
        errorMessage: '"Email" field is missing',
        exists: true,
        isEmail: {
            errorMessage: 'Invalid email format'
        }
    },
    password: {
        in: ['body'],
        errorMessage: '"password" field is missing',
        exists: true
    }
}
