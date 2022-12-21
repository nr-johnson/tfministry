var express = require('express');
var router = express.Router();
const formidable = require('formidable')
const fs = require('fs');
const ops = require('../functions/ops')
const {ObjectId} = require('mongodb');
const url = require('url')

/* GET home page. */
router.get(['/', '/home', '/updates', '/subscribe'], async function(req, res, next) {
  let uri = req.originalUrl
  let target = req.session.target

  const parsedUrl = url.parse(req.url)
  let route = parsedUrl.pathname

  if(!target) {
    if (route == '/') {
      target = 'home'
    } else {
      target = route.substring(1)
    }
  }

  req.session.target = null

  let pages = req.linkList
  let pageIndex = pages.map(function (page) { return page.id; }).indexOf(target)

  pageData = {
      title: 'TFM | Home',
      url: uri,
      pageIndex: pageIndex,
      user: req.session.user,
      target: target,
      pages: pages
  }

  pageData.success = null
  if(req.session.success) pageData.success = req.session.success
  req.session.success = null

  pageData.errors = null
  if(req.session.errors) pageData.errors = req.session.errors
  req.session.errors = null
  
  pageData.fields = {}
  if(req.session.fields) pageData.fields = req.session.fields
  req.session.fields = {}

  switch (target) {
    case 'updates':
      let updates = await ops.findMany(req.db.db('tfm'), 'updates', {'Publish': true})
      updates.sort(function(a, b){
        if(new Date(a['Date']) > new Date(b['Date'])) { return -1; }
        if(new Date(a['Date']) < new Date(b['Date'])) { return 1; }
        return 0;
      });
      pageData.updates = updates
      pageData.title = 'TFM | Updates'
      pageData.pageDescription = "Ministry Updates"
      break
    
    case 'subscribe':
      pageData.title = 'TFM | Subscribe'
      pageData.pageDescription = "Subscribe to Our Newsletter"
      break

    case 'training':
      let data = await ops.findItem(req.db.db('tfm'), 'siteData', {name: 'Training Intro'})
      pageData.data = data
      pageData.fields = {}
      pageData.title = 'TFM | Training'
      pageData.pageDescription = "Sign up for Training"
      break
    
    default:
      let introData = await ops.findItem(req.db.db('tfm'), 'siteData', {name: 'Site Intro'})
      let ups = await ops.findMany(req.db.db('tfm'), 'updates', {'Publish': true})
      ups.sort(function(a, b){
        if(new Date(a['Date']) > new Date(b['Date'])) { return -1; }
        if(new Date(a['Date']) < new Date(b['Date'])) { return 1; }
        return 0;
      });
      pageData.update = ups[0]
      pageData.introData = introData
      pageData.pageDescription = introData['Content'].replace( /(<([^>]+)>)/ig, '')
  }
  
  res.render('index', pageData)
    
});

router.get('/training', async function(req, res, next) {
  if(req.linkList.some(link => link.id =='training')) {
    req.session.target = 'training'
    res.redirect('/')
  } else {
    let data = await ops.findItem(req.db.db('tfm'), 'siteData', {name: 'Training Intro'})
    let suc = null
    if(req.session.success) suc = req.session.success
    req.session.success = null

    let errs = null
    if(req.session.errors) errs = req.session.errors
    req.session.errors = null
    
    let fields = {}
    if(req.session.fields) fields = req.session.fields
    req.session.fields = {}

    res.render('index', {
      title: 'TFM | Training',
      url: req.originalUrl,
      data: data,
      pageIndex: req.linkList.map(function (page) { return page.id; }).indexOf('training'),
      user: req.session.user,
      target: 'training',
      pages: req.linkList,
      fields: fields,
      pageDescription: "Sign up for Training"
    })
  }
})

router.get('/contact', async function(req, res, next) {
  let succ = null
  if(req.session.success) succ = req.session.success
  req.session.success = null

  let errs = null
  if(req.session.errors) errs = req.session.errors
  req.session.errors = null
  
  let fields = {}
  if(req.session.fields) fields = req.session.fields
  req.session.fields = {}
  


  let url = req.originalUrl
  let pages = req.linkList
  res.render('contact', {
    title: 'TFM | Contact Me',
        url: url,
        success: succ,
        errors: errs,
        fields: fields,
        user: req.session.user,
        pages: pages
  })
})

// router.get('/admin', ops.authUser(), async function(req, res, next) {
//   req.session.target = 'admin'
//   res.redirect('/')
// })

router.get('/email/:id', async function(req, res, next) {
  let fields = await ops.findItem(req.db.db('tfm'), 'emails', {_id: ObjectId(req.params.id)})
  let keys = []
  Object.entries(fields).forEach((field) => {
    const [key, value] = field;
    if(key != '_id' && key != 'emailType') {
      keys.push(key)
    }
  })
  await ops.deleteItem(req.db.db('tfm'), 'emails', {_id: ObjectId(req.params.id)})
  res.render('email', {
    keys: keys,
    values: fields
  })
})

router.get('/update/:id', async function(req, res, next) {
  let update = await ops.findItem(req.db.db('tfm'), 'updates', {_id: ObjectId(req.params.id)})
  res.render('update', {
    update: update,
    title: 'TFM | Update',
    user: req.session.user,
    pages: req.linkList,
    pageDescription: update['Content'].replace( /(<([^>]+)>)/ig, '')
  })
})

module.exports = router;
