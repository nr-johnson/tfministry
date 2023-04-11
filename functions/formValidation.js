'use strict'

const ops = require("./ops")
const hash = require('password-hash');
const e = require("express");

module.exports = function() {
    return function(req, res, next) {
        req.validateForm = function(data, params, files) {
            return new Promise(resolve => {
                let errors = []
                Object.keys(params).forEach(par => {
                    if(par != 'files' && data[par] == undefined && params[par].required) {
                        errors.push({
                            field: par,
                            error: par.replace(/-/g, " ") + ' is required.'
                        })
                    }
                })
                Object.entries(data).forEach((entry) => {
                    const [key, value] = entry;
                    if(params[key]) {
                        if(params[key].required && (value.length < 1 || value == 'none')) {
                            errors.push({
                                field: key,
                                error: key.replace(/-/g, " ") + ' is required.'
                            })
                        } else if(params[key].minLength && value.length > 0) {
                            if(value.length < params[key].minLength) {
                                errors.push({
                                    field: key,
                                    error: 'If you fill out ' + key.replace(/-/g, " ") + ', it must be at least ' + params[key].minLength + ' characters long.'
                                })
                            }
                        } else if(params[key].mustLength && value.length > 0) {
                            if(value.length != params[key].mustLength) {
                                errors.push({
                                    field: key,
                                    error: 'If you fill out ' + key.replace(/-/g, " ") + ', it must be exactly ' + params[key].mustLength + ' characters long.'
                                })
                            }
                        }
                        
                        if(params[key].zip && value.length > 0) {
                            let format = /^\d{5}(-\d{4})?$/;
                            if(!format.test(value)) {
                                errors.push({
                                    field: key,
                                    error: 'Zip Code is invalid.'
                                })
                            }
                        }
                        if(params[key].email && value.length > 0) {
                            let format = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                            if(!format.test(value)) {
                                errors.push({
                                    field: key,
                                    error: 'Email is invalid.'
                                })
                            }
                        }
                        if(params[key].phone && value.length > 0) {
                            let format = /^\d{10}$/
                            if(!format.test(value)) {
                                errors.push({
                                    field: key,
                                    error: 'Phone Number is invalid.'
                                })
                            }
                        }
                    }
                })

                if(params.relations) {
                    Object.entries(params.relations).forEach((relation) => {
                        const [key, value] = relation
                        let engaged = false
                        for(let i = 0; i < value[0].length; i++) {
                            let field = value[0][i]
                            if(data[field]) {
                                if(data[field].length > 1) {
                                    engaged = true
                                    break
                                }
                            }
                        }
                        if(engaged) {
                            for(let j = 0; j < value[1].length; j++) {
                                let field = value[1][j]
                                if(data[field]) {
                                    if(data[field].length < 1) {
                                        errors.push({
                                            field: field,
                                            error: 'If you fill out an ' + key + ', ' + field.replace(/-/g, " ") + ' cannot be empty.'
                                        })
                                    }
                                } else {
                                    errors.push({
                                        field: field,
                                        error: 'If you fill out an ' + key + ', ' + field.replace(/-/g, " ") + ' cannot be empty.'
                                    })
                                }
                            }
                        }
                    })
                }
                
                if(params.files) {
                    
                    if (Array.isArray(params.files)) {
                        for(let index in params.files) {
                            let fileReq = params.files[index]
                            if(fileReq.required && !files[fileReq.prefix + '00'] && !files[fileReq.prefix + '00_orig']) {
                                let string = 'At least ' + fileReq.required
                                if(fileReq.required > 1) {
                                    string = string + ' images required.'
                                } else {
                                    string = string + ' image required.'
                                }
                                errors.push({
                                    field: null,
                                    error: string
                                })
                            }
                        }
                    } else {
                        if (params.files.required) {
                            if (!files || files[params.files.name].size <= 0) {
                                errors.push({
                                    field: null,
                                    error: 'Please attach required file(s).'
                                })
                            } else if (files.length < params.files.required) {
                                errors.push({
                                    field: null,
                                    error: `A minimum of ${params.files.required} files are expected. Only ${files.length} were attached.`
                                })
                            } else if (params.files.type) {
                                if (!files[params.files.name].originalFilename.includes(params.files.type)) {
                                    errors.push({
                                        field: null,
                                        error: `Wrong filetype! A file with a type of ${params.files.type} is expected.`
                                    })
                                }
                            }
                        }
                    }
                }
                if(errors.length > 0) resolve(errors)
                else resolve(false)
        
            })
        }
        next()
    }
}