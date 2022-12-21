var express = require('express');
var router = express.Router();
const fs = require('fs');
const ops = require('../functions/ops')
const formidable = require('formidable')
const hash = require('password-hash');
const {ObjectId} = require('mongodb');
const ytdl = require('ytdl-core');

router.get('/', ops.authUser(), async (req, res) => {
    let uri = req.originalUrl

    req.session.target = null

    let pages = req.linkList
    let pageIndex = pages.map(function (page) { return page.id; }).indexOf('admin')

    pageData = {
        title: 'TFM | Admin',
        url: uri,
        pageIndex: pageIndex,
        user: req.session.user,
        target: 'admin',
        pages: pages
    }

    res.render('index', pageData)
})

// Login page
router.get('/login', ops.checkUser(), async function(req, res, next) {
    let err
    err = req.session.errors
    req.session.errors = null

    let succ
    succ = req.session.success
    req.session.success = null

    let fields = {}
    if(req.session.fields) {
        if(Object.keys(req.session.fields).length > 1) {
            fields = req.session.fields
            req.session.fields = {}
        }
    }
    
    

    let links = req.linkList

    res.render('admin/login', {
        title: 'TFM | Login',
        errors: err,
        success: succ,
        fields: fields,
        url: req.originalUrl,
        pages: links,
        user: req.session.user
    })
})

// Logs the user out.
router.get('/logout', ops.authUser(), async function(req, res, next) {
    let user = req.session.user
    await ops.deleteItem(req.db.db('tfm'), 'loginSessions', {_id: ObjectId(user.id)})
    req.session.user = null

    req.session.success = 'You have been logged out.'
    res.redirect('/admin/login')
})


// Routes below are for the admin site editing pages
// -- Intro Pages
router.get('/edit/site-intro', ops.authUser(), async function(req, res, next) {
    let err
    err = req.session.errors
    req.session.errors = null

    let succ
    succ = req.session.success
    req.session.success = null

    let fields = {}
    fields = req.session.fields
    req.session.fields = {}
    
    let introData = await ops.findItem(req.db.db('tfm'), 'siteData', {name: "Site Intro"})
    let links = req.linkList
    res.render('admin/siteIntro', {
        title: 'TFM | Admin',
        success: succ,
        errors: err,
        fields: fields,
        url: req.originalUrl,
        introData: introData,
        pages: links,
        user: req.session.user
    })
})

router.post('/update-intro/:redir', ops.authUser(), async function(req, res, next) {
    let form = new formidable.IncomingForm({multiples: true})
    form.parse(req, async function(err, fields, files) {
        let params = {
            'Title': {required: true},
            'Content': {required: true},
            'Video-Code': {mustLength: 11}
        }
        let errors = await req.validateForm(fields, params)
        if(errors) {
            if(req.params.redir == 'n') {
                res.send({status: 'err', resp: errors})
            } else {
                req.session.fields = fields
                req.session.errors = errors
                res.redirect('/admin/edit/site-intro')
            }
        } else {
            if(fields['Video-Code']) {
                await ytdl.getInfo('https://www.youtube.com/watch?v=' + fields['Video-Code']).then(info => {
                    fields['Video-Title'] = info.videoDetails.title
                })
            } else {
                fields['Video-Code'] = null
            }
            await ops.updateItem(req.db.db('tfm'), 'siteData', {name: "Site Intro"}, {$set: fields})
            if(req.params.redir == 'n') {
                res.send({status: 'success', resp: 'Intro Updated!'})
            } else {
                res.redirect('/admin')
            }
        }
    })
})


// -- Training Pages
router.get('/edit/training-intro', ops.authUser(), async function(req, res, next) {
    let err
    err = req.session.errors
    req.session.errors = null

    let succ
    succ = req.session.success
    req.session.success = null

    let fields = {}
    fields = req.session.fields
    req.session.fields = {}

    let info = await ops.findItem(req.db.db('tfm'), 'siteData', {name: 'Training Intro'})
    let links = req.linkList
    res.render('admin/trainingIntro', {
        title: 'TFM | Admin',
        success: succ,
        errors: err,
        fields: fields,
        url: req.originalUrl,
        introData: info,
        pages: links,
        user: req.session.user
    })
})

router.post('/update-training/:redir', ops.authUser(), async function(req, res, next) {
    let form = new formidable.IncomingForm({multiples: true})
    form.parse(req, async function(err, fields, files) {
        let params = {
            'Content': {required: true},
            'Video-Code': {mustLength: 11}
        }
        let errors = await req.validateForm(fields, params)
        if(errors) {
            if(req.params.redir == 'n') {
                res.send({status: 'err', resp: errors})
            } else {
                req.session.fields = fields
                req.session.errors = errors
                res.redirect('/admin/edit/training-intro')
            }
        } else {
            if(fields['Video-Code']) {
                await ytdl.getInfo('https://www.youtube.com/watch?v=' + fields['Video-Code']).then(info => {
                    fields['Video-Title'] = info.videoDetails.title
                })
            } else {
                fields['Video-Code'] = null
            }
            
            await ops.updateItem(req.db.db('tfm'), 'siteData', {name: "Training Intro"}, {$set: fields})
            if(req.params.redir == 'n') {
                res.send({status: 'success', resp: 'Training Intro Updated!'})
            } else {
                res.redirect('/admin')
            }
        }
    })
})


//-- Updates Pages 
router.get('/updates', ops.authUser(), async function(req, res, next) {
    let updates = await ops.findMany(req.db.db('tfm'), 'updates', {})
    updates.sort(function(a, b){
        if(new Date(a['Date']) > new Date(b['Date'])) { return -1; }
        if(new Date(a['Date']) < new Date(b['Date'])) { return 1; }
        return 0;
    });
    let links = req.linkList
    res.render('admin/updates/updatesList', {
        title: 'TFM | Admin',
        url: req.originalUrl,
        updates: updates,
        pages: links,
        user: req.session.user
    })
})

router.get('/edit/update/:id', ops.authUser(), async function(req, res, next) {
    let err
    err = req.session.errors
    req.session.errors = null

    let succ
    succ = req.session.success
    req.session.success = null

    let fields = {}
    fields = req.session.fields
    req.session.fields = {}

    let update = await ops.findItem(req.db.db('tfm'), 'updates', {_id: ObjectId(req.params.id)}) 
    let links = req.linkList 
    res.render('admin/updates/editUpdate', {
        title: 'TFM | Admin',
        success: succ,
        errors: err,
        fields: fields,
        url: req.originalUrl,
        update: update,
        pages: links,
        user: req.session.user
    })
})

router.post('/edit/update/:id/:redir', ops.authUser(), async function(req, res, next) {
    let form = new formidable.IncomingForm({multiples: true})
    form.parse(req, async function(err, fields, files) {
        let params = {
            'Type': {required: true},
            'Date': {required: true},
            'Location': {required: true},
            'Content': {required: true},
            files: [{prefix: 'image-', required: 1}]
        }
        let errors = await req.validateForm(fields, params, files)
        
        
        if(errors) {
            if(req.params.redir == 'n') {
                res.send({status: 'err', resp: errors})
            } else {
                req.session.fields = fields
                req.session.errors = errors
                res.redirect('/admin/edit/update/' + req.params.id)
            }
        } else {
            
            let update = await ops.findItem(req.db.db('tfm'), 'updates', {_id: ObjectId(req.params.id)})
    
            newSets = []

            update['Type'] = fields['Type']
            update['Date'] = fields['Date']
            update['Content'] = fields['Content']
            update['Location'] = fields['Location']
            
            if(fields['Publish']) update['Publish'] = true
            else update['Publish'] = false

            update.title = await ops.setUpdateTitle(fields['Date']) // Function at bottom of page.
            
            let run = 0
            while(run > -1) {
                if(fields['Set-' + run + 'Cap'] == undefined){ run = -1 }
                else {
                    newSets.push({
                        set: run,
                        caption: fields['Set-' + run + 'Cap'],
                        images: []
                    })
                    for(let file in files) {
                        if(file.substring(file.indexOf('-') + 1, file.length - 1) == run) {
                            let data = files[file]
                            let index = file.substring(file.indexOf('-') + 2)
                            if(data.size == 0) {
                                if(fields[file + '_orig']) {
                                    if(fields[file + '_orig'] != file.substring(file.indexOf('-') + 1)) {
                                        console.log(fields[file + '_orig'] + ' -!- ' + file.substring(file.indexOf('-') + 1))
                                        
                                        let thisIndex = fields[file + '_orig'].substring(1)
                                        
                                        console.log(fields[file + '_orig'] + ',' + thisIndex)
                                        
                                        let thisImage = update.sets[run].images[thisIndex]
    
                                        let newImage = await ops.uploadFile(thisImage.url, {public_id: 'updates/' + update._id + '/' + run + '/' + file, overwrite: true})
                                        
                                        newSets[run].images.push({
                                            name: file,
                                            dataName: file.substring(file.indexOf('-') + 1),
                                            url: newImage.secure_url,
                                            path: newImage.public_id
                                        })
                                    } else {
                                        let oldData = update.sets[run].images[index]
                                        newSets[run].images.push({
                                            name: file,
                                            dataName: file.substring(file.indexOf('-') + 1),
                                            url: oldData.url,
                                            path: oldData.path
                                        })
                                    }
                                }
                            } else {
                                let newImage = await ops.uploadFile(data.filepath, {public_id: 'updates/' + update._id + '/' + run + '/' + file})
                                newSets[run].images.push({
                                    name: file,
                                    dataName: file.substring(file.indexOf('-') + 1),
                                    url: newImage.secure_url,
                                    path: newImage.public_id
                                })
                            }
                        }
                    }
                    run++
                }
            }
            
            update.sets = newSets

            await ops.updateItem(req.db.db('tfm'), 'updates', {_id: ObjectId(req.params.id)}, {$set: update})

            let over = 0
            while(over > -1) {
                let folder = await ops.getFolder('updates/' + update._id + '/' + over)
                let length = folder.resources.length
                if(length > 0) {
                    if(update.sets[over]) {
                        if(length > update.sets[over].images.length) {
                            let del = length - 1
                            while(del > update.sets[over].images.length - 1) {
                                await ops.deleteFile(folder.resources[del].public_id)
                                del--
                            }
                        }
                    } else {
                        await ops.deleteFolder('updates/' + update._id + '/' + over)
                    }
                    
                    over++
                } else {
                    over = -5
                }   
            }
            
            if(req.params.redir == 'n') {
                res.send({status: 'success', resp: 'Update Edited!'})
            } else {
                res.redirect('/admin/updates')
            }
        }
    })
    
})

router.get('/new/update', ops.authUser(), async function(req, res, next) {
    let err
    err = req.session.errors
    req.session.errors = null

    let succ
    succ = req.session.success
    req.session.success = null

    let fields = {}
    fields = req.session.fields
    req.session.fields = {}

    let links = req.linkList
    res.render('admin/updates/newUpdate', {
        title: 'TFM | Admin',
        success: succ,
        errors: err,
        fields: fields,
        url: req.originalUrl,
        pages: links,
        user: req.session.user
    })
})

router.post('/new/update/:redir', ops.authUser(), async function(req, res, next) {
    let form = new formidable.IncomingForm({multiples: true})
    form.parse(req, async function(err, fields, files) {
        let params = {
            'Type': {required: true},
            'Date': {required: true},
            'Location': {required: true},
            'Content': {required: true},
            files: [{prefix: 'image-', required: 1}]
        }
        let errors = await req.validateForm(fields, params, files)

        if(errors) {
            if(req.params.redir == 'n') {
                res.send({status: 'err', resp: errors})
            } else {
                req.session.fields = fields
                req.session.errors = errors
                res.redirect('/admin/new/update')
            }
        } else {
            let newId = new ObjectId()
            let update = {
                _id: newId,
                sets: []
            }

            update['Type'] = fields['Type']
            update['Date'] = fields['Date']
            update['Content'] = fields['Content']
            update['Location'] = fields['Location']

            if(fields['Publish']) update['Publish'] = true
            else update['Publish'] = false
            
            update.title = await ops.setUpdateTitle(fields['Date']) // Function at bottom of page.

            for(let run = 0; run < parseInt(fields['set-count']); run++) {
                console.log('running')
                update.sets.push({
                    set: run,
                    caption: fields['Set-' + run + 'Cap'],
                    images: []
                })
                for(let file in files) {
                    if(file.substring(file.indexOf('-') + 1, file.length - 1) == run) {
                        let data = files[file]
                        let index = file.substring(file.indexOf('-') + 2)
                        console.log(file)
                        let newImage = await ops.uploadFile(data.filepath, {public_id: 'updates/' + newId + '/' + run + '/' + file})
                        console.log(newImage)
                        update.sets[run].images.push({
                            name: file,
                            dataName: file.substring(file.indexOf('-') + 1),
                            url: newImage.secure_url,
                            path: newImage.public_id
                        })
                    }
                }
                console.log(update.sets[run])
            }
            console.log(update)

            

            await ops.addToDatabase(req.db.db('tfm'), 'updates', [update])
            
            console.log('Update created!')

            if(req.params.redir == 'n') {
                res.send({status: 'success', resp: 'Update Created!'})
            } else {
                res.redirect('/admin/updates')
            }
            
        }

        
        
    })
    
})

router.post('/delete/update/:id', ops.authUser(), async function(req, res, next) {
    let update = await ops.findItem(req.db.db('tfm'), 'updates', {_id: ObjectId(req.params.id)})
    await ops.deleteFolder('updates/' + update._id)
    await ops.deleteItem(req.db.db('tfm'), 'updates', {_id: ObjectId(req.params.id)})
    res.redirect('/admin/updates')
})

// Creates user in database (only works with rest request)
router.post('/create', async function(req, res, next) {
    let data = req.body
    let hashedPass = hash.generate(data.password)
    
    data.password = hashedPass

    let newUser = await ops.addToDatabase(req.db.db('tfm'), 'login', [data])

    if(newUser) {
        res.send('Success!')
    } else {
        res.send('Error...')
    }
})

module.exports = router;