// This page contains useful backend functions used throughout the site.

const {ObjectId} = require('mongodb');
const hash = require('password-hash');
let fs = require('fs');
let cloudinary = require('cloudinary').v2;

// This is the site's security check.
// All secure pages must pass through this function to continue.
// It first checks if there is a user in the session.
    // Then it checks if there is a matching login session in the database.
    // Then it verifies that the key in the user session matches the database's login session's hashed key.
    // If any of these checks fail, it redirects to the login page with an error message.
function authUser() {
    return async (req, res, next) => {
        // next()
        console.log('Checking user access.')
        let loggedUser = req.session.user
        if(loggedUser) {
            let user = await findItem(req.db.db('tfm'), 'loginSessions', {_id: ObjectId(loggedUser.id)})
            if(user) {
                if(hash.verify(loggedUser.key, user.key)) {
                    next()
                } else {
                    console.log('Key mismatch')
                    req.session.user = null
                    req.session.errors = 'User session keys do not match. Please log in again.'
                    res.redirect('/admin/login')
                }
            } else {
                console.log('No userSession')
                req.session.user = null
                req.session.errors = 'Session Expired, please log in.'
                res.redirect('/admin/login')
            }
        } else {
            console.log('No user.')
            res.redirect('/admin/login')
        }     
    }
}



// Checks if user is logged in. If they are it redirects to /admin, otherwise it continues.
// This function is used to redirect a logged in user away from the login in screen.
function checkUser() {
    return async (req, res, next) => {
        if(!req.session.user) {
            next()
        } else {
            let userSess = await findItem(req.db.db('tfm'), 'loginSessions', {_id: ObjectId(req.session.user.id)})
            if(!userSess) {
                req.session.user = null
                next()
            } else {
                console.log('User already logged in.')
                res.redirect('/admin')
            }
        }
    }
}

// Diffent, but similar to checkUser.
    // It checks to ensure that user is logged in or not.
    // It needs to be different because this function is used within a route rather than before it.
function isLoggedIn(req) {
    return new Promise(async resolve => {
        console.log('Checking if logged in.')
        let loggedUser = req.session.user
        if(loggedUser) {
            let user = await findItem(req.db.db('tfm'), 'loginSessions', {_id: ObjectId(loggedUser.id)})
            if(user) {
                if(hash.verify(loggedUser.key, user.key)) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            } else {
                resolve(false)
            }
        } else {
            resolve(false)
        }    
    })
}

// Adds a document to a desired collection in the database.
function addToDatabase (db, col, data) {
    return new Promise(resolve => {
        console.log('Adding item to database.')
        db.collection(col).insertMany(data, function(err, items) {
            if (err) throw err
            console.log('Item(s) added to database.')
            resolve(items)
        })
    })
}

// Updates a document in the database.
function updateItem (db, col, item, data) {
    return new Promise(resolve => {
        console.log('Updating item in database.')
        db.collection(col).updateMany(item, data, function(err, result) {
            if (err) throw err
            console.log('Item updated.')
            resolve(result)
        })
    })
}

// Retrieves a document from the database.
function findItem(db, col, data, index) {
    return new Promise(async resolve => {
        console.log('Getting Item in database.')
        var info
        if(index) {
            info = await db.collection(col).find(data).collation(index).limit(1).toArray()
        } else {
            info = await db.collection(col).find(data).limit(1).toArray()
        }
        resolve(info[0])
    })   
}

// Finds many documents within a collection in the database based on the query.
function findMany(db, col, query) {
    return new Promise(resolve => {
        console.log('Getting items in database.')
        var info = db.collection(col).find(query).toArray()
        resolve(info)
    })
}

// Retirieves a whole collection in the database.
function getCollection(db, col, data) {
    return new Promise(resolve => {
        console.log('Getting collection in database.')
        var info = db.collection(col).find(data).toArray()
        resolve(info)
    })
}

// Deletes a document in the database.
function deleteItem(db, col, data) {
    return new Promise(resolve => {
        console.log('Deleteing item in database')
        var info = db.collection(col).deleteOne(data)
        resolve(info)
    })
}

function addIndex(db, col, data1, data2) {
    return new Promise(resolve => {
        console.log('Adding DB Index')
        var info = db.collection(col).createIndex(data1, data2);
        resolve(info)
    })
}

// Uploades a file to the media library.
function uploadFile(path, options) {
    console.log('Uploading file')
    return new Promise(resolve => {
        cloudinary.uploader.upload(path, options, function(error, result) {
            if (error) throw error
            resolve(result)
        });
    }) 
}

// Deletes a file from the media library.
function deleteFile(path) {
    console.log('Deleting file')
    return new Promise(resolve => {
        cloudinary.uploader.destroy(path, function(error,result) {
            if (error) throw error
            resolve(result)
        })
    })
}

// Retirieves a file from the media library.
function getFile(path) {
    console.log('Getting file')
    return new Promise(resolve => {
        cloudinary.api.resource(path, function(error, result) {
            if (error) throw error
            resolve(result)
        });
    }) 
}

// Retirieves all files within a folder in the media library.
function getFolder(path) {
    console.log('Getting items in folder')
    return new Promise(resolve => {
        cloudinary.api.resources({
            type: 'upload',
            prefix: path
        }, function(error, result) {
            if (error) throw error
            resolve(result)
        })
    }) 
}

// Deletes a folder and all containing files in the media library.
function deleteFolder(prefix) {
    return new Promise(resolve => {
        console.log('Deleteing folder')
        cloudinary.api.delete_resources_by_prefix(prefix, function(err, res) {
            if  (err) throw error
            console.log('Folder contents deleted.')
            cloudinary.api.delete_folder(prefix, function(error, result) {
                if (error) throw error
                console.log('Folder deleted.')
                resolve(result)
            });
        })
    })
}

// This function creates the titles for updates.
// It creates a string stating the quarter and year the update took place.
function setUpdateTitle(dateString) {
    return new Promise(resolve => {
        let date = new Date(dateString)
        let month = date.getMonth()
        let year = date.getFullYear()
        let string = ' Quarter of ' + year + ''
        
        if(month < 3) resolve("First" + string)
        if(month < 6) resolve("Second" + string)
        if(month < 9) resolve("Third" + string)
        resolve("Fourth" + string)
    })
}



module.exports = {
    addToDatabase,
    updateItem,
    findItem, 
    findMany, 
    getCollection, 
    deleteItem,
    addIndex,
    authUser, 
    isLoggedIn, 
    checkUser, 
    uploadFile, 
    deleteFile, 
    getFile, 
    getFolder, 
    deleteFolder,
    setUpdateTitle
}