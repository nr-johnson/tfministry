# Toliver Family Ministry

The home webpage for the Toliver Family to share about what the Lord is doing through their lives.

[Live Page](https://www.tfministry.net)

This is a Node.js app using Pug as the template engine.

I created this as a way of helping my friend and the work he is doing to through Global Training Network.

---

## Site Features:
- ### Single Page App:
    This is a bit misleading as the whole app doesn't run off a single plage, but the main four pages (and admin when logged in) use the same HTML page and request data from the server using AJAX each time the client navigates. This provides a what I believe to be a superiorly smooth user experience.

- ### Admin Area:
    A key feature the Tolivers desired was a way to easily add updates and change key sections of the page without having to make constant requests of me. So I created a password locked area with variouse forms that allow them to add photo updates and change the content on the `/home` and `/training` pages.

- ### Geo-Hidden Page:
    One page is only intended for non-U.S. citezens to view. The site checks the location of the user using their IP address and hides the `/training` page if the visitor is located in the U.S. or Canada. Note: This does not work if the visitor is using a VPN, even if the visitor is spoofing a U.S. IP.

- ### Custom Gallery with Touch Screen Support:
    I built a custom photo gallery viewer for the updates. I features captions that operate per the Toliver's requests, as well as swipeing actions when being viewed on a mobile device.

- ### Other Features:
    Custom mobile app-like view when visiting from a mobile device.

    Email Forms.

    Google ReCaptcha on forms to prevent spam.

    Quill Rich Text Editors.

    Subscribe form contains dynamic error checking that changes what gives an error based on if a user has begun to enter a physical address.

---

## Integrations:

### MongoDB
MongoDB is used as the primary database to store user info, sessions, site content and updates.

### Cloudinary
Cloudinary is used to store update images uploaded by the Tolivers.

---

## Copyright:
All content on the page is subject to copyright and may not be copied or redistributed in anyway without prior consent, in writing from Steward Toliver.
