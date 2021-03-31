'use strict'

const httpRequest = require('request-promise')
const formidable = require('formidable')

/**
 * Common Form based request to make a call from yensesa app
 * @param req
 * @param simple
 * @param resolveWithFullResponse
 * @returns {Promise<void>}
 * @private
 */
exports._formHttpRequest = async (req, simple = false, resolveWithFullResponse = true) => {
    const options = {
        method: req.action,
        uri: req.url,
        formData: req.body,
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            ...req.headers
        },
        json: true,
        simple,
        resolveWithFullResponse
    }

    return httpRequest(options)
}

/**
 * Common JSON based request to make a call from yensesa app
 * @param req
 * @param simple
 * @param resolveWithFullResponse
 * @returns {Promise<void>}
 * @private
 */
exports._jsonHttpRequest = async (req, simple = false, resolveWithFullResponse = true) => {
    const options = {
        method: req.action,
        uri: req.url,
        body: req.body,
        json: true,
        headers: {
            ...req.headers
        },
        simple,
        resolveWithFullResponse
    }

    return httpRequest(options)
}

const parseBody = (req, res, next) => {
    let fileArray = []
    const form = formidable()
    form.on('file', function (field, file) {
        fileArray.push(file)
    })
    req.file = fileArray
    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err)
            return
        }
        for (let key in fields) {
            req.body[key] = fields[key]
        }
        next()
    })
}

const parseBodyMultipleFile = (req, res, next) => {
    let fileFeildsList = {}
    const form = formidable()
    form.on('file', function (field, file) {
        if (field in fileFeildsList) {
            fileFeildsList[field].push(file)
        } else {
            fileFeildsList[field] = [file]
        }
        req.file = fileFeildsList
    })
    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err)
            return
        }
        for (let key in fields) {
            req.body[key] = fields[key]
        }
        next()
    })
}

module.exports = {
    parseBody,
    parseBodyMultipleFile
}
