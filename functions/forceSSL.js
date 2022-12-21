'use strict'

// Checks if the url is localhost or not.
  // If it is not it and the url does not include HTTPS, it redirects to the same url with HTTPS included.
module.exports = () => {
  return function forceSSL (req, res, next) {
    if(req.get('Host').substring(0, 9) !== 'localhost') {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        console.log('Forcing SSL')
        res.redirect(['https://', req.get('Host'), req.url].join(''));
      } else {
        next()
      }
    } else {
      next()
    }
  };
}