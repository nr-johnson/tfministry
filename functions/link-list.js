// This is what builds the list used for the nav links.

'use strict'

let geoip = require("geoip-native"); // Module to get the IP country code.

module.exports = (ops) => {
    return async function getLinkList(req, res, next) {
        // Default list of links, will allways be on page.
        let list = [
            {url: '/home', name: 'Home', icon: 'house-door-fill', id: 'home'},
            {url: '/updates', name: 'Updates', icon: 'newspaper', id: 'updates'},
            {url: '/subscribe', name: "Subscribe", icon: 'envelope-plus-fill', id: 'subscribe'}
        ]
        // The two links that may or may not be added to the page.
        let training = {url: '/training', name: 'Training', icon: 'pc-display-horizontal', id: 'training'}
        let admin = {url: '/admin', name: 'Admin', icon: 'gear-fill', id: 'admin'}
        
        // This determins if the visitor has an US or Canada IP. If not it adds the Training link to the array
        let ip ='96.84.57.209' // Default US IP address
        if (typeof req.headers['x-forwarded-for'] !== 'undefined') {
            ip = req.headers['x-forwarded-for'];
            let country = geoip.lookup(ip).code
            if(country != 'US' && country != 'CA') {
                list.push(training)
            }
        }

        // If the user is logged in the Admin link is added to the array
        let loggedIn = await ops.isLoggedIn(req)
        if(loggedIn) {
            list.push(admin)
        }

        // Sets the req variable value to the list array
        req.linkList = list
        next()
    } 
}