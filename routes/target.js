var express = require('express');
var router = express.Router();
const ops = require('../functions/ops')
const formidable = require('formidable')
const ytdl = require('ytdl-core');

router.get('/home', async function(req, res, next) {
    let introData = await ops.findItem(req.db.db('tfm'), 'siteData', {name: 'Site Intro'})
    let updates = await ops.findMany(req.db.db('tfm'), 'updates', {'Publish': true})
    updates.sort(function(a, b){
        if(new Date(a['Date']) > new Date(b['Date'])) { return -1; }
        if(new Date(a['Date']) < new Date(b['Date'])) { return 1; }
        return 0;
    });
    // req.session.target = 'home'
    res.render('homePages/home', {
        update: updates[0],
        introData: introData,
        pages: req.linkList
    });
})

router.get('/updates', async function(req, res, next) {
    let updates = await ops.findMany(req.db.db('tfm'), 'updates', {'Publish': true})
    updates.sort(function(a, b){
        if(new Date(a['Date']) > new Date(b['Date'])) { return -1; }
        if(new Date(a['Date']) < new Date(b['Date'])) { return 1; }
        return 0;
    });
    // req.session.target = 'updates'
    res.render('homePages/updates', { 
        updates: updates
    });
})

router.get('/subscribe', async function(req, res, next) {
    let fields = {}
    // req.session.target = 'subscribe'
    res.render('homePages/subscribe', { 
        fields: fields
    });
})

router.get('/training', async function(req, res, next) {
    let data = await ops.findItem(req.db.db('tfm'), 'siteData', {name: 'Training Intro'})
    let fields = {}
    // req.session.target = 'training'
    res.render('homePages/training', {
        fields: fields,
        data: data
    })
})

router.get('/contact', async function(req, res, next) {
    res.render('homePages/contact');
})

router.get('/admin', ops.authUser(), async function(req, res, next) {
    // req.session.target = 'admin'
    res.render('homePages/admin');
})


module.exports = router;
