let gal = null // Used to tell the back button to close the gallery rather than go back a page.


// Sets css VH property so that elements are sized appropriatly.
// This is needed because on mobile the address bar is included in the viewport, which messed things up.
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', vh + 'px');
window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + `px`);
});

// This sets event listeners for the movible nav buttons
const mobileLinks = document.querySelectorAll('.mobile-nav-item')
mobileLinks.length > 0 && mobileLinks.forEach(item => {
    item.addEventListener('click', function(event) {
        if(!this.classList.contains('link')) {
            pageChange(event, this.getAttribute('data-page'))
        }
    })
})

// This sets event listeners for the desktop nav buttons
const navLinks = document.querySelectorAll('.nav-link')
navLinks.length > 0 && navLinks.forEach(item => {
    item.addEventListener('click', function(event) {
        if(!this.classList.contains('link')) {
            pageChange(event, this.getAttribute('data-page'))
        }
    })
})

// Adds page state to browser history
function addToHistory(target) {
    const route = target == 'home' ? '/' : "/" + target
    if(history.state != target) history.pushState(target, null, route);
}

// Triggered when nav button is pressed.
    // Set nav button classes then triggers "loadPage"
function pageChange(event, target) {
    let url = window.location.pathname

    let buttons = document.querySelectorAll("[data-page=" + target + "]")
    let body = document.getElementById('body')
    let butIndex = Array.from(buttons[0].parentNode.children).indexOf(buttons[0])

    event.preventDefault()
    window.scrollTo(0,0)        
    
    mobileLinks.forEach((link) => link.classList.remove('active'))
    navLinks.forEach((link) => {link.classList.remove('active')})

    buttons.forEach((but) => but.classList.add('active'))

    body.classList = 'link-' + butIndex

    document.querySelectorAll('.grecaptcha-badge').forEach(badge => {
        if (target == 'subscribe') {
            badge.classList.add('show')
        } else {
            badge.classList.remove('show')
        }
    })

    loadPage(target)
}

// Retirieves the neccessary data from the database, then loads the main page content with the result.
function loadPage(target) {
    let xhttp = new XMLHttpRequest();
    let url = '/target/' + target

    xhttp.onreadystatechange = function() {
        let mainDiv = document.getElementById('pageContent')
        mainDiv.classList.remove('show')
        if (this.readyState == 4) {
            if(this.status == 200) {
                mainDiv.innerHTML = this.response
                document.title = 'TFM | ' + target.substring(0,1).toUpperCase() + target.substring(1)
                let editors = document.getElementsByClassName('richEdit')
                if(editors.length > 0) loadEditors(editors)
            } else if(this.status == 0) {
                let template = document.getElementById('serverErr')
                let newErr = template.content.cloneNode(true).children[0]
                mainDiv.innerHTML = ''
                mainDiv.appendChild(newErr)
            } else {
                document.title = 'Error ' + this.status
                mainDiv.innerHTML = this.responseText
            }
            mainDiv.classList.add('show')
            addToHistory(target)
        }
    }

    xhttp.open("GET", url, true);
    xhttp.send();
}

// Takes over browser back button
window.addEventListener('popstate', function(e) {
    var location = history.state;
    if(gal) {
        e.preventDefault()
        closeSlide(e, gal)
        gal = null
    } else if (location != null) {
        pageChange(e, location);
    } else {
        window.history.back();
    }
});

// Sets the tollbar options for the rich text editors
let toolbarOptions = [
    ['bold', 'italic', 'underline'],
            
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],                       

    [{ 'color': [] }, { 'background': [] }],

['link'] //, 'image'
];

// calls the function that creates rich text editors when the page first loads.
let editors = document.getElementsByClassName('richEdit')
if(editors.length > 0) {
    loadEditors(editors)
}

// This is the function that creates rich text editors.
    // Uses Quill
function loadEditors(edits) {
    for(let i = 0; i < edits.length; i++) {
        let thisEdit = edits[i]
        new Quill(thisEdit, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        image: imageHandler
                    }
                }
            },
            placeholder: thisEdit.getAttribute('data-placeHolder')
        })
        thisEdit.children[0].tabIndex = thisEdit.getAttribute('data-tab')
        let thisInput = document.getElementById(thisEdit.getAttribute('data-name'))
        if(thisInput) {
            thisInput.style.display = 'none'
        }
    }
}

// Creates the alert to input image urls for the rich text editors
function imageHandler() {
    var range = this.quill.getSelection();
    var value = prompt('What is the image URL');
    if(value){
        this.quill.insertEmbed(range.index, 'image', value, Quill.sources.USER);
    }
}

// Sets the richtext content with any preloaded text.
function setFields(){
    var boxes = document.getElementsByClassName('richEdit')
    for(var i = 0; i < boxes.length; i++) {
        var textBox = boxes[i].children[0]

        var name = boxes[i].getAttribute('data-name')

        var input = document.getElementsByName(name)[0]
        // var input = boxes[i].parentNode.children[3]
        textBox.innerHTML = input.value
    }
}
setFields() // Called when page is first loaded

// Takes information from the rich text editors and adds the content to the value of the coresponding input
function updateInput() {
    return new Promise(resolve => {
        let editors = document.getElementsByClassName('richEdit')
        for(let i = 0; i < editors.length; i++) {  
            
            let thisEdit = editors[i]
            
            let input = document.getElementById(thisEdit.getAttribute('data-name'))
            // alert(thisEdit.children[0].innerHTML.length)
            if(thisEdit.children[0].innerHTML.length > 12) {
                input.value = thisEdit.children[0].innerHTML
                
            } else {
                input.value = ''
            }
            
        }
        
        resolve()
    })
}

// This toggles video modals.
// It shows or hodes them based on the "show" variable passed to the function.
function toggleModal(event, modalLink, show) {
    event.preventDefault() //This is to prevent targeting the modal when JS is enabled.
    if(show) {
        let  modal = document.getElementById(modalLink.getAttribute("data-target"))
        modal.classList.add('fade')
    } else {
        modalLink.parentNode.classList.remove('fade')
    }
}

// Changes button class to show loading animation
function showButtonLoad(button, show) {
    if(show) button.classList.add('loading')
    else button.classList.remove('loading')
}

function showCaptchaBadge() {
    let int = window.setInterval(() => {
        const badges = document.querySelectorAll('.grecaptcha-badge')
        badges.length > 0 && badges.forEach(bdg => {
            bdg.classList.add('show')
            clearInterval(int)
        })
    }, 100)
}

// Handles all form submissions
async function submitForm(event, form, secure) {
    event.preventDefault() //Stops from from redirection automatically.
    await updateInput() //Gets input from rich text editors.
    let button = form.querySelector('.loader')
    if(button) {
        showButtonLoad(button, true) //Starts loading animation in button.
    }

    let data = new FormData(form)
    let url = form.getAttribute('data-target')

    // Form data is sent to server.
    let submit
    if(secure) {
        submit = await secureAjax('POST', url, data)
    } else {
        submit = await ajaxPost('POST', url, data)
    }
    
    console.log('FORM ===')
    let response = JSON.parse(submit)
    if(response.status == 'err') {
        addErrors(response.resp) //Adds errors to page if server responds with form errors.
    } else {
        let goal = form.getAttribute('data-goal')
        myAlert(response.resp, goal) //Shows success message and sets the myAlert redirect and timer.
    }
    showButtonLoad(button, false) //Stops the button loading animation
}

// Ajax with reCaptcha
function secureAjax(method, url, data) {
    return new Promise(async resolve => {
        grecaptcha.ready(() => {
            grecaptcha.execute('6Ld1_d0iAAAAAL8IaSkszeZdcGiV0RsIY-U7sAt9', {action: 'submit'}).then(async token => {
                data.append('token', token)
                const resp = await ajaxPost(method, url, data)
                resolve(resp)
            });
        });
    })
}

// Used for various server posts.
function ajaxPost(method, url, data) {
    return new Promise(resolve => {
        let ajx = new XMLHttpRequest();
        
        ajx.onreadystatechange = function() {
            if (this.readyState == 4) {
                if(this.status == 200) {
                    resolve(this.response)
                    
                } else if(this.status == 0) {
                    resolve(null)
                } else {
                    resolve(null)
                }
            }
        }

        ajx.open(method, url);
        
        if(data) {
            ajx.send(data)
        } else {
            ajx.send();
        }
    })
}

// Adds list of errors to form
function addErrors(errors) {
    let message = document.getElementById('form-message')
    let newP = document.createElement('p')
    let newUL = document.createElement('ul')

    let fields = document.querySelectorAll('.input-field')
    for(let i = 0; i < fields.length; i++) {
        let field = fields[i]
        field.classList.remove('err')
    }

    message.innerHTML = ""

    newP.classList.add('form-message-title')
    newP.innerHTML = 'Oops...'
    message.append(newP)
    for(let j = 0; j < errors.length; j++) {
        let err = errors[j]
        let newLI = document.createElement('li')
        
        if(err.field) {
            document.getElementsByName(err.field)[0].classList.add('err')
        }

        newLI.innerHTML = err.error
        newUL.append(newLI)
    }
    
    message.append(newUL)
    
    message.classList.remove('succ')
    message.classList.add('err')
    message.classList.add('show')
    
    document.getElementById('form-main').scrollIntoView()
}

function addImageSet() {
    let setsMain = document.getElementById('image-sets')
    let template = document.getElementById('imgSetTemplate')
    let newSet = template.content.cloneNode(true);
    let set = newSet.children[0]

    let setNumber = setsMain.children.length

    set.id = 'Set-' + setNumber
    set.setAttribute('data-setNumber', setNumber)

    // Set Title
    set.children[0].innerHTML = 'Set-' + setNumber

    // Caption Label
    set.children[1].children[0].htmlFor = 'Set-' + setNumber + 'Cap'

    // Rich Edit
    set.children[1].children[1].setAttribute('data-name', 'Set-' + setNumber + 'Cap')

    // Rich Edit Input
    set.children[1].children[2].id = 'Set-' + setNumber + 'Cap'
    set.children[1].children[2].name = 'Set-' + setNumber + 'Cap'

    // Loads Rich Edit
    loadEditors([set.children[1].children[1]])

    // Set Images Main
    set.children[3].setAttribute('data-setNumber', setNumber)
    set.children[3].children[0].id = 'Set-' + setNumber + 'Images'

    set.children[3].children[1].children[0].innerHTML = 'Add Image to Set-' + setNumber

    set.children[3].children[2].children[0].innerHTML = 'Remove Set-' + setNumber

    setsMain.appendChild(set)

    setsMain.parentNode.children[5].value = setsMain.children.length

}

function removeImageSet(set) {
    let setsMain = set.parentNode
    setsMain.removeChild(set)
    for(let j = 0; j < setsMain.children.length; j++) {
        let thisSet = setsMain.children[j]

        thisSet.id = 'Set-' + j
        thisSet.setAttribute('data-setnumber', j)

        // Title
        thisSet.children[0].innerHTML = 'Set-' + j

        // Caption Label
        thisSet.children[1].children[0].htmlFor = 'Set-' + j + 'Cap'

        // Rich Text
        thisSet.children[1].children[2].setAttribute('data-name', 'Set-' + j + 'Cap')

        // Rich Edit Input
        thisSet.children[1].children[3].id = 'Set-' + j + 'Cap'
        thisSet.children[1].children[3].name = 'Set-' + j + 'Cap'

        // Images Main
        thisSet.children[3].children[0].id = 'Set-' + j + 'Images'
        
        // Set images info
        setUpdateImagesIndex(thisSet.children[3].children[0], j)

        setsMain.parentNode.parentNode.children[5].value = setsMain.children.length
    }
    


    
}

// This adds an image to the update forms.
//- It first makes sure the image is of the correct size and type, then adds it to the page and form via "addUpdateImageToPage()"
async function addPhotosToUpdateForm(input) {
    let file = input.files[0]
    if(file.type == 'image/jpeg' || file.type == 'image/jpg' || file.type == 'image/png') {
        if(file.size < 1000000) {
            //- This is the more complicated part. Function in main script file\
            addUpdateImageToPage(file, input, input.parentNode.parentNode.parentNode.getAttribute('data-setNumber')) 
        } else {
            myAlert("Image cannot excede 1mb in size.")
        }
    } else {
        myAlert("Image must be JPEG or PNG.")
    }
}

//- This creates the image element on the update forms. It uses a template found at the top of each.
function addUpdateImageToPage(file, input, set) {
    let fileMain = document.getElementById('Set-' + set + 'Images')
    let count = fileMain.children.length
    let startTab = (fileMain.children.length * 2) + 4
    let reader  = new FileReader();
    // it's onload event and you forgot (parameters)
    reader.onload = function(e)  {
        let template = document.getElementById('imgTemplate')
        let newImage = template.content.cloneNode(true);
        
        let image = newImage.children[0]
        
        // Main image div
        image.id = 'image-' + set + count
        
        // Image Name
        image.children[0].title = file.name
        image.children[0].innerHTML = file.name

        // IMG element
        image.children[1].children[0].children[0].src = e.target.result

        input.name = 'image-' + set + count
        image.appendChild(input)
        
        fileMain.appendChild(image)
        
        //  A new input is created and value set to cuurent file.
        let newImgInp = document.createElement('input')
        newImgInp.classList.add('d-none')
        newImgInp.type = 'file'
        
        newImgInp.addEventListener('change', function(e) {
            e.preventDefault()
            addPhotosToUpdateForm(this)
        })

        fileMain.parentNode.children[1].append(newImgInp)
        
    }
    reader.readAsDataURL(file);
}

// Changes the input names and id for images when one is removed.
// This is to ensure that the file structure for images remains consistant
function setUpdateImagesIndex(imagesMain, setNumber) {
    let images = imagesMain.children
    for(let i = 0; i < images.length; i++) {
        let image = images[i]
        image.id = 'image-' + setNumber + i

        image.children[4].name = 'image-' + setNumber + i
        if(image.children[5]) {
            image.children[5].name = 'image-' + setNumber + i + '_orig'
        }
        
    }
}

//- Deletes the main element containing the image and all inputs it contains.
function removeUpdateImage(img) {
    let setNumber = img.parentNode.parentNode.parentNode.getAttribute('data-setnumber')
    img.parentNode.removeChild(img)
    setUpdateImagesIndex(document.getElementById('Set-' + setNumber + 'Images'), setNumber)
}

// Promt to confirm dangerous actions.
function myPromt(text, route, post, good) {
    let myPromt = document.getElementById('myPromt')
    let promtText = document.getElementById('promtText')
    let promtForm = document.getElementById('promtForm')

    promtText.innerHTML = text

    promtForm.action = route
    promtForm.method = post
    
    if(good) {
        promtForm.children[0].classList.remove('btn-caution')
        promtForm.children[0].classList.add('btn-submit')
    }

    myPromt.classList.add('show')
}
// Closes prompt
function closePromt() {
    let myPromt = document.getElementById('myPromt')
    myPromt.classList.remove('show')
}

// My alert to communicate with user
function myAlert(text, redir) {
    let myAlert = document.getElementById('myAlert')
    if(!text) {
        text = ''
    }
    myAlert.children[1].children[0].children[0].innerHTML = text

    myAlert.children[1].children[1].children[0].children[0].focus()

    if(redir) {
        myAlert.setAttribute('data-redir', redir)
        window.setTimeout(closeMyAlert, 3000)
    }

    myAlert.classList.add('alert')
}
// Closes alert
function closeMyAlert(event) {
    if(event) {
        event.preventDefault()
    }
    
    let myAlert = document.getElementById('myAlert')

    let redir = myAlert.getAttribute('data-redir')
    if(redir) {
        window.location.href = redir
    }

    myAlert.classList.remove('alert')
}

async function loadMoreUpdates(event, button) {
    event.preventDefault()
    let updates = document.getElementById('updates')
    let currentCount = updates.children.length
    button.classList.add('loading')
    let newUpdates = await ajaxPost('POST', '/connect/getupdates/' + currentCount)
    if(newUpdates) {
        let data = JSON.parse(newUpdates)
        if(data.status == 'success') {
            for(let i = 0; i < data.resp.length; i++) {
                let update = data.resp[i]
                let html = await ajaxPost('POST', '/connect/renderupdate/' + update._id)
                let newArticle = document.createElement('article')
                newArticle.classList = 'row mt-2'
                newArticle.innerHTML = html
                updates.append(newArticle)
            }
        }
        if(data.resp.length < 5 || (data.status == 'err' && data.resp == 'End of Updates')) {
            button.disabled = true
            button.classList.add('disabled')
            button.innerHTML = 'End of Updates'
        }
    }
    button.classList.remove('loading')
}

function openArchive(event) {
    event.preventDefault()
    let archive = document.getElementById('updateArchive')
    archive.classList.add('active')
}

function closeArchive(event) {
    event.preventDefault()
    let archive = document.getElementById('updateArchive')
    archive.classList.remove('active')
}


// --- Gallery Functions! ---

function disableScroll() {
    // Get the current page scroll position
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
  
        // if any scroll is attempted, set this to the previous value
        window.onscroll = function() {
            window.scrollTo(scrollLeft, scrollTop);
        };
}
  
function enableScroll() {
    window.onscroll = function() {};
}

function scrollThumbToView(gal, thumb, index) {
    let winWidth = gal.offsetWidth
    let thumbWidth = thumb.offsetWidth;
    let thumbsIn = winWidth / thumbWidth

    let thumbPos = (index + 1) - thumbsIn

    if((thumbPos * thumbWidth) - gal.scrollLeft > 0) {
        gal.scrollLeft = (thumbWidth * thumbPos)
    }
    else if(gal.scrollLeft > (thumbsIn + (thumbPos - 1)) * thumbWidth) {
        gal.scrollLeft = (thumbsIn + (thumbPos - 1)) * thumbWidth
    }
}

function cycleCapsOut(deskCaps) {
    for(let j = 0; j < deskCaps.length; j++) {
        let cap = deskCaps[j]
        cap.classList.remove('active')
    }
}

function cycleThumbOut(cycleThumbOut) {
    for(let j = 0; j < cycleThumbOut.length; j++) {
        let cap = cycleThumbOut[j]
        cap.classList.remove('active')
    }
}

function openSlide(event, galleryIndex, index) {
    event.preventDefault()
    const gallery = document.querySelector('#Gallery' + galleryIndex).querySelector('.slide-show')

    let deskGal = gallery.querySelector('.slide-gal')
    let length = deskGal.children.length
    let deskCaps = gallery.querySelector('.captions').children
    let deskThumbs = gallery.querySelector('.slide-footer')
    let newIndex = 0

    cycleCapsOut(deskCaps)
    cycleThumbOut(deskThumbs.children)
    
    for(let i = 0; i < length; i++) {
        let slid = deskGal.children[i]
        let length = deskGal.children.length - 1
        if(i == index) {
            let capIndex = slid.getAttribute('data-cap')
            deskCaps[capIndex].classList.add('active')

            deskThumbs.children[i].classList.add('active')

            newIndex = i

            slid.classList.add('active')
            gallery.setAttribute('data-slide', index)
        } else {
            slid.classList.remove('active')
        }
        if(length > 2) {
            if(i > index) {
                slid.classList.remove('active')
                slid.classList.remove('prev')
                slid.classList.add('next')
            }
            if(i < index) {
                slid.classList.remove('active')
                slid.classList.remove('next')
                slid.classList.add('prev')
            }
            if(index == length && i == 0) {
                slid.classList.remove('active')
                slid.classList.remove('prev')
                slid.classList.add('next')
            }
            if(index == 0 && i == length) {
                slid.classList.remove('active')
                slid.classList.remove('next')
                slid.classList.add('prev')
            }
        }
        
    }
    
    gallery.classList.add('open')
    scrollThumbToView(deskThumbs, deskThumbs.children[newIndex], newIndex)
    disableScroll()
    gal = gallery
}

function closeSlide(event, gallery) {
    event.preventDefault()
    gal = null
    gallery.classList.remove('open')
    enableScroll()
}

function nextSlide(event, gallery) {
    event.preventDefault()
    let curIndex = gallery.getAttribute('data-slide')
    let nxtSlide = parseInt(curIndex) + 1
    let deskGal = gallery.querySelector('.slide-gal')
    let length = deskGal.children.length
    let deskCaps = gallery.querySelector('.captions').children
    let deskThumbs = gallery.querySelector('.slide-footer')

    if(length > 1) {
        cycleCapsOut(deskCaps)
        cycleThumbOut(deskThumbs.children)
        
        if(nxtSlide > length - 1) {
            nxtSlide = 0
        }
        for(let i = 0; i < length; i++) {
            let slid = deskGal.children[i]
            let length = deskGal.children.length - 1
            slid.classList.remove('active')
            if(i == nxtSlide) {
                let capIndex = slid.getAttribute('data-cap')
                deskCaps[capIndex].classList.add('active')

                deskThumbs.children[i].classList.add('active')

                scrollThumbToView(deskThumbs, deskThumbs.children[i], i)

                slid.classList.add('active')
                gallery.setAttribute('data-slide', nxtSlide)
            } 
            if(i > nxtSlide) {
                slid.classList.remove('prev')
                slid.classList.add('next')
            }
            if(i < nxtSlide) {
                slid.classList.remove('next')
                slid.classList.add('prev')
            }
            if(nxtSlide == length && i == 0) {
                slid.classList.remove('prev')
                slid.classList.add('next')
            }
            if(nxtSlide == 0 && i == length) {
                slid.classList.remove('next')
                slid.classList.add('prev')
            }
        }
    }
    
}

function prevSlide(event, gallery) {
    event.preventDefault()
    let curIndex = gallery.getAttribute('data-slide')
    let nxtSlide = parseInt(curIndex) - 1
    let deskGal = gallery.querySelector('.slide-gal')
    let length = deskGal.children.length
    let deskCaps = gallery.querySelector('.captions').children
    let deskThumbs = gallery.querySelector('.slide-footer')

    

    if(length > 1) {
        cycleCapsOut(deskCaps)
        cycleThumbOut(deskThumbs.children)

        if(nxtSlide < 0) {
            nxtSlide = length - 1
        }
        for(let i = 0; i < length; i++) {
            let slid = deskGal.children[i]
            let length = deskGal.children.length - 1
            if(i == nxtSlide) {
                let capIndex = slid.getAttribute('data-cap')
                deskCaps[capIndex].classList.add('active')

                deskThumbs.children[i].classList.add('active')

                scrollThumbToView(deskThumbs, deskThumbs.children[i], i)

                slid.classList.add('active')
                gallery.setAttribute('data-slide', nxtSlide)
            }
            if(i > nxtSlide) {
                slid.classList.remove('active')
                slid.classList.remove('prev')
                slid.classList.add('next')
            }
            if(i < nxtSlide) {
                slid.classList.remove('active')
                slid.classList.remove('next')
                slid.classList.add('prev')
            }
            if(nxtSlide == length && i == 0) {
                slid.classList.remove('active')
                slid.classList.remove('prev')
                slid.classList.add('next')
            }
            if(nxtSlide == 0 && i == length) {
                slid.classList.remove('active')
                slid.classList.remove('next')
                slid.classList.add('prev')
            }
        }
    }
    
}


let touchStartX
let touchStartY
function setTouch(event) {
    if(event.touches.length === 1){
        //just one finger touched
        touchStartX = event.touches.item(0).clientX;
        touchStartY = event.touches.item(0).clientY;
    } else {
        //a second finger hit the screen, abort the touch
        touchStart = null;
    }
}

function touchCloseSlide(event, slideShow) {
    let offsetY = 200;//at least 100px are a swipe
    if(touchStartY) {
        if(touchStartY < 85) {
            let endY = event.changedTouches.item(0).clientY
            if(endY > touchStartY + offsetY) {
                //a top -> down swipe
                closeSlide(event, slideShow)
            }
        }   
        
    }
}

function swipeSlide(event, slideShow) {
    let offsetX = 100;//at least 100px are a swipe
    let index = slideShow.getAttribute('data-slide')
    slideShow.querySelector('.slide-gal').children[index].style = ''
    if(touchStartX) {
        //the only finger that hit the screen left it
        let endX = event.changedTouches.item(0).clientX;
        // let off = slideShow.getBoundingClientRect().left
        if(endX > touchStartX + offsetX){
            //a left -> right swipe
            prevSlide(event, slideShow)
        } 
        if(endX < touchStartX - offsetX){
            //a right -> left swipe
            nextSlide(event, slideShow)
        }
    }
}

function setFileName(input) {
    const fileNameLabel = input.parentNode.querySelector('.file-name')
    const fileName = input.files[0].name || 'Error!'
    fileNameLabel.innerText = fileName
}