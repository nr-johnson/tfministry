var express = require('express');
var router = express.Router();
const ops = require('../functions/ops')
const formidable = require('formidable')
const hash = require('password-hash');
const {ObjectId} = require('mongodb');
const axios = require('axios')

function verifyCaptcha(token) {
    return new Promise(async resolve => {
        captchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${token}`
            
        const cap = await axios.get(captchaUrl)
        const score = cap.data.score

        if (cap.data.success) {
            if(score < 0.4) {
                const err = {
                    field: null,
                    error: `Your Captcha score is too low.<br><a href="https://www.google.com/recaptcha/about/" target="_blank">Read about reCaptcha</a>`
                }
                resolve({ok: false, err: err})
            } else {
                resolve({ok: true})
            }
        } else {
            const err = {
                field: null,
                error: `Error resolving Captcha. If this issue persists please contact the site administrator.`
            }
            resolve({ ok: false, err })
        }
    })
}


router.post('/contact/:redir', function(req, res, next) {
    let form = new formidable.IncomingForm()
    form.parse(req, async function(err, fields, files) {
        let params = {
            'Name': {required: true, minLength: 3},
            'Email': {required: true},
            'Message': {required: true, minLength: 10}
        }
        let errors = await req.validateForm(fields, params)


        if (fields.token) {
            const passed = await verifyCaptcha(fields.token)
            if(!passed.ok) {
                errors ? errors.push(passed.err) : errors = [passed.err]
            }
        }

        let redir = req.params.redir

        if(errors) {
            if(redir == 'n') {
                res.send({status: 'err', resp: errors})
            } else {
                req.session.fields = fields
                req.session.errors = errors
                res.redirect('/contact')
            }
        } else {
            fields.emailType = 'Contact'
            let email = await ops.addToDatabase(req.db.db('tfm'), 'emails', [fields])
            let mailOptions = {
                from: 'TFMinistry Contact Form <stoliver@globaltrainingnetwork.org>',
                to: 'stoliver@globaltrainingnetwork.org', //'main.nrjohnson@gmail.com',
                subject: 'Message from: ' + fields['Name'],
                html: ({path: req.emailURL + '/email/' + email.insertedIds['0']})
            };
            
            await req.sendMail(mailOptions)

            if(redir == 'n') {
                res.send({status: 'success', resp: 'Message sent!'})
            } else {
                req.session.success = 'Form submitted!'
                res.redirect('/contact')
            }
            
        }
        
    })
})
  
router.post('/subscribe/:redir', function(req, res, next) {
    let form = new formidable.IncomingForm()
    form.parse(req, async function(err, fields, files) {
        let params = {
            'First-Name': {required: true, minLength: 3},
            'Last-Name': {required: true, minLength: 3},
            'Email': {required: true, email: true},
            'Phone-Number': {phone: true},
            'Address-Line-1': {minLength: 3},
            'Address-Line-2': {minLength: 3},
            'City/Town': {minLength: 3},
            'State': {minLength: 2},
            'Zip-Code': {zip: true},
            'Message': {minLength: 10},
            relations: {
                Address: [
                    ['Address-Line-1', 'Address-Line-2', 'City/Town', 'State', 'Zip-Code'],
                    ['Address-Line-1', 'City/Town', 'State', 'Zip-Code']
                ]
            }
        }
        let errors = await req.validateForm(fields, params)

        if (fields.token) {
            const passed = await verifyCaptcha(fields.token)
            if(!passed.ok) {
                errors ? errors.push(passed.err) : errors = [passed.err]
            }
        }

        let redir = req.params.redir
        if(errors) {
            if(redir == 'n') {
                res.send({status: 'err', resp: errors})
            } else {
                req.session.fields = fields
                req.session.errors = errors
                res.redirect('/subscribe')
            }
        } else {
            let info = {}
            Object.entries(fields).forEach((field) => {
                const [key, value] = field;
                if(value.length > 0) {
                    info[key] = value
                }
            })

            info.emailType = 'Subscription'
            let email = await ops.addToDatabase(req.db.db('tfm'), 'emails', [info])
            let mailOptions = {
                from: 'TFMinistry Subscribe Form <stoliver@globaltrainingnetwork.org>',
                to: 'stoliver@globaltrainingnetwork.org', //'main.nrjohnson@gmail.com',
                subject: 'New Subscriber!',
                html: ({path: req.emailURL + '/email/' + email.insertedIds['0']})
            };
            
            await req.sendMail(mailOptions)
            if(redir == 'n') {
                res.send({status: 'success', resp: 'Information sent!'})
            } else {
                req.session.success = 'Form submitted!'
                res.redirect('/subscribe')
            }
            
        }
        
    })
})
 
router.post('/training/:redir', function(req, res, next) {
    let form = new formidable.IncomingForm()
    form.parse(req, async function(err, fields, files) {
        let params = {
            files: {name: 'Training-Form', required: 1, type: ['docx']}
        }

        let errors = await req.validateForm(fields, params, files)

        console.log('ERRORS ===')
        console.log(errors)

        if (fields.token) {
            const passed = await verifyCaptcha(fields.token)
            if(!passed.ok) {
                errors ? errors.push(passed.err) : errors = [passed.err]
            }
        }

        let redir = req.params.redir
        if(errors) {
            if(redir == 'n') {
                res.send({status: 'err', resp: errors})
            } else {
                req.session.fields = fields
                req.session.errors = errors
                res.redirect('/training')
            }
        } else {

            let mailOptions = {
                from: 'TFMinistry Training Form <stoliver@globaltrainingnetwork.org>',
                to: 'stoliver@globaltrainingnetwork.org', // 'main.nrjohnson@gmail.com',
                subject: 'New Training Request',
                html: `<h1>New training request reveived!</h1>`,
                attachments: [{
                    filename: files['Training-Form'].originalFilename,
                    path: files['Training-Form'].filepath
                }]
            };
            
            await req.sendMail(mailOptions)


            if(req.params.redir == 'n') res.send({status: 'success', resp: 'Information Submitted!'})
            else {
                res.redirect('/home')
            }
        }
    })
})

// Verifies login info
router.post('/validatelogin/:redir', async function(req, res, next) {
    // Failed login attempts are tracked. After 10 failures the IP is locked out until the admin resets the session or the session expires.
    // Creates login attempt variable if one does not axist
    req.session.loginAttempts ? null : req.session.loginAttempts = 0
    let redir = req.params.redir
    // If too many login attempts, send message an prevent login.
    if (req.session.loginAttempts >= 9) {
        const err = [{
            field: null,
            error: 'You have ran out of login attempts. Please contact the site administrator.'
        }]
        if(redir == 'n') {
            res.send({status: 'err', resp: err})
        } else {
            req.session.fields = fields
            req.session.errors = err
            res.redirect('/admin/login')
        }
        return
    }


    let form = new formidable.IncomingForm()
    form.parse(req, async function(err, fields, files) {
        // Form validation
        let params = {
            'Username': {required: true},
            'Password': {required: true},
            login: true
        }
        // Errors (both form and credentials)
        let errors = await req.validateForm(fields, params)      

        // If form errors, send errors to user
        if(errors) {
            if(redir == 'n') {
                res.send({status: 'err', resp: errors})
            } else {
                req.session.fields = fields
                req.session.errors = errors
                res.redirect('/admin/login')
            }            
        } else {
            // Get user from db
            let user = await ops.findItem(req.db.db('tfm'), 'login', {'Username': fields['Username']})
            if(user) {
                // Verify password
                if(!hash.verify(fields['Password'], user['Password'])) {
                    // If password incorrect, add error to errors
                    errors = [{field: null, error: 'Invalid credentials'}]
                } else {
                    req.session.loginAttempts = 0
                    let sessions = await ops.getCollection(req.db.db('tfm'), 'loginSessions', {})
                    if(sessions.length > 0) {
                        console.log('Deleteing previous session(s)')
                        sessions.forEach(async doc => {
                            await ops.deleteItem(req.db.db('tfm'), 'loginSessions', {_id: ObjectId(doc._id)})
                        })
                    }

                    let newID = new ObjectId()
                    let key = (Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000).toString();
                    let thisSession = {
                        _id: newID,
                        name: user['Username'],
                        key: hash.generate(key)
                    }
                    await ops.addToDatabase(req.db.db('tfm'), 'loginSessions', [thisSession])
                    req.session.user = {
                        id: newID.toString(),
                        key: key
                    }

                    if(redir == 'n') {
                        res.send({status: 'success', resp: 'Login successful!'})
                    } else {
                        res.redirect('/admin')
                    }
                }
            } else {
                errors = [{field: null, error: 'Invalid credentials'}]
            }

            if(errors) {
                // If invalid credentials, send error to user and incriment failed login attempt counter
                req.session.loginAttempts++
                console.log(`Login attempt: ${req.session.loginAttempts}`)
                if (req.session.loginAttempts < 10) {
                    // Show remaining login attempts if 5 or less remain.
                    if(req.session.loginAttempts > 6) {
                        errors = [{
                            field: null,
                            error: `You have ${10 - req.session.loginAttempts} login attempts remaining.`
                        }, ...errors]
                    }
                    if(redir == 'n') {
                        res.send({status: 'err', resp: errors})
                    } else {
                        req.session.fields = fields
                        req.session.errors = errors
                        res.redirect('/admin/login')
                    }
                }
            }
        }

    })
    
    
    
    
    // let user = await ops.findItem(req.db.db('tfm'), 'login', {"name": req.body.name})
    // if(user) {
    //     if(hash.verify(req.body.password, user.password)) {
    //         await ops.deleteItem(req.db.db('tfm'), 'loginSessions', {name: user.name})

    //         let newID = new ObjectId()
    //         let key = (Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000).toString();
    //         console.log(key)
   

    //         await ops.addToDatabase(req.db.db('tfm'), 'loginSessions', [thisSession])

    //         req.session.user = {
    //             id: newID.toString(),
    //             key: key
    //         }
    //         console.log(req.session.user)
    //         res.send('success')
    //     } else {
    //         res.send('badPass')
    //     }
    // } else {
    //     res.send('badUser')
    // }
})

router.post('/getupdates/:cnt', async function(req, res, next) {
    let startingIndex = req.params.cnt
    let updates = await ops.findMany(req.db.db('tfm'), 'updates', {'Publish': true})
    let toSend = updates.slice(startingIndex, startingIndex + 5)

    if(toSend.length > 0) {
        res.send({status: 'success', resp: toSend})
    } else {
        res.send({status: 'err', resp: 'End of Updates'})
    }
})

router.post('/renderupdate/:id', async function(req, res, next) {
    let update = await ops.findItem(req.db.db('tfm'), 'updates', {_id: ObjectId(req.params.id)})

    res.render('templates/update', {
        update: update
    })
})

module.exports = router;