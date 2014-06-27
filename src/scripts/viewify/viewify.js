if (typeof window.viewify === 'undefined') {
    window.viewify = { id: '?' };
}

(function (window, document) {
    var viewify = window.viewify;
    var body = document.body;
    var knownSessions = {};

    var ERR_CONNECTING = 'Error connecting to viewify server.';
    var DOCS_URL = '//viewify.me/api/1/docs';
    var VIEWER_URL = 'https://s.viewify.me/viewer.html';

    var LOADING_CLASS = 'viewify-overlay-loading',
        ERROR_CLASS = 'viewify-overlay-error',
        HIDDEN_CLASS = 'viewify-overlay-hidden';

    function $(sel, el) {
        return (el || document).querySelector(sel);
    }
    function indexOf(arr, val) {
        if (arr.indexOf) {
            return arr.indexOf(val);
        } else {
            var i, l;
            for (i = 0, l = arr.length; i < l; ++i) {
                if (arr[i] === val) {
                    return i;
                }
            }
            return -1;
        }
    }
    function forEach(arr, fn) {
        var i, l;
        for (i = 0, l = arr.length; i < l; ++i) {
            fn(arr[i]);
        }
    }
    function addClass(el, cls) {
        if (el.classList) {
            el.classList.add(cls);
        } else {
            attr(el, attr(el, 'class') + ' ' + cls);
        }
    }
    function removeClass(el, cls) {
        if (el.classList) {
            el.classList.remove(cls);
        } else {
            var classes = attr(el, 'class') || '';
            classes = classes.trim().split(/\s+/);
            var ind = indexOf(classes, cls);
            if (ind > -1) {
                classes.splice(ind, 1);
            }
            classes = classes.join(' ');
            if (classes) {
                attr(el, 'class', classes);
            }
        }
    }
    function hasClass(el, cls) {
        if (el.classList) {
            return el.classList.contains(cls);
        } else {
            var classes = attr(el, 'class') || '';
            classes = classes.trim().split(/\s+/);
            return indexOf(classes, cls) > -1;
        }
    }
    function create(tag) {
        return document.createElement(tag);
    }
    function remove(el) {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
        return el;
    }
    function replace(oldEl, newEl) {
        oldEl.parentNode.replaceChild(newEl, oldEl);
    }

    function isTopWindow() {
        return window === window.top;
    }

    function tryToParseJSON(json) {
        try {
            return JSON.parse(json);
        } catch (err) {
            return json;
        }
    }

    function attr(el, name, val) {
        if (typeof val !== 'undefined') {
            el.setAttribute(name, val);
        } else {
            return el.getAttribute(name);
        }
    }

    function ajax(method, url, data, callback) {
        var req = new XMLHttpRequest();
        req.open(method || 'GET', url, true);
        req.addEventListener('load', function () {
            var status = req.status;
            if (status === 200) {
                callback.call(req, null, req.responseText);
            } else {
                callback.call(req, req.responseText || req.statusCode || 'unknown error :(');
            }
        });
        req.addEventListener('error', function () {
            callback(ERR_CONNECTING);
        });
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(data);
        return req;
    }

    function json(method, url, data, callback) {
        return ajax(method, url, JSON.stringify(data), function (err, responseText) {
            callback.call(this, tryToParseJSON(err), tryToParseJSON(responseText));
        });
    }

    function getSession(url, cb) {
        return json('POST', DOCS_URL, { id: viewify.id, url: url }, function (err, response) {
            if (err) {
                cb(err, response);
                return;
            }
            if (response.session) {
                cb(null, response.session);
            } else if (response.retry) {
                setTimeout(function () {
                    getSession(url, cb);
                }, response.retry * 1000);
            }
        });
    }

    var currentRequest, currentURL;
    function viewifyLink(a) {
        var url = a.href;
        currentURL = url;
        showOverlay();
        updateOverlay(null, null, url);
        if (knownSessions[url]) {
            updateOverlay(null, knownSessions[url], url);
            return;
        }
        if (currentRequest) {
            currentRequest.abort();
        }
        currentRequest = getSession(url, function (err, session) {
            if (currentURL !== url) {
                return;
            }
            if (err) {
                // show error dialog :(
                updateOverlay(err.error || err, null, url);
                return;
            }
            knownSessions[url] = session;
            updateOverlay(null, session, url);
        });
    }

    function showStatus(overlay, error, originalURL) {
        var statusEl = $('.viewify-status', overlay),
            messageEl = $('.viewify-status-message', statusEl),
            originalLink = $('.viewify-status-link a', statusEl);
        if (error) {
            //console.error(error);
            error = 'Oops! Looks like there was an issue converting this document.';
            messageEl.innerText = error;
            removeClass(overlay, LOADING_CLASS);
            addClass(overlay, ERROR_CLASS);
        } else {
            removeClass(overlay, ERROR_CLASS);
            addClass(overlay, LOADING_CLASS);
            messageEl.innerText = 'Generating preview. Hold tight... it\'ll be done in a jiffy!';
        }
        originalLink.href = originalURL;
        originalLink.dataset.viewifyIgnore = true;
    }

    function showOverlay() {
        var overlay = $('.viewify-overlay');
        if (overlay) {
            overlay.style.display = 'block';
            removeClass(overlay, HIDDEN_CLASS);
            if (!hasClass(body, 'viewify-kill-scrolling')) {
                attr(body, 'data-top', body.scrollTop);
                addClass(body, 'viewify-kill-scrolling');
            }
        } else {
            initOverlay();
            showOverlay();
        }
    }

    function updateOverlay(error, session, originalURL) {
        var overlay = $('.viewify-overlay');
        if (overlay && !hasClass(overlay, HIDDEN_CLASS)) {
            if (session) {
                removeClass(overlay, LOADING_CLASS);
                $('.viewify-content', overlay).src = VIEWER_URL + '?id=' + session.id;
            } else {
                showStatus(overlay, error, originalURL);
            }
        }
    }

    function hideOverlay() {
        var overlay = $('.viewify-overlay');
        if (overlay) {
            addClass(overlay, HIDDEN_CLASS);
            $('.viewify-content', overlay).src = 'about:blank';
            overlay.addEventListener('webkitTransitionEnd', function () {
                overlay.style.display = 'none';
            });
        }
        removeClass(body, 'viewify-kill-scrolling');
        body.scrollTop = parseInt(attr(body, 'data-top') || 0, 10);
    }

    function loadStyles() {
        var css = '<%= inlineTemplate("css/viewify/viewify.css") %>';
        var styleEl = document.createElement('style'),
            cssTextNode = document.createTextNode(css);
        try {
            attr(styleEl, 'type', 'text/css');
            styleEl.appendChild(cssTextNode);
        } catch (err) {
            // uhhh IE < 9
        }
        document.getElementsByTagName('head')[0].appendChild(styleEl);
    }

    function initOverlay() {
        loadStyles();
        var overlayEl = create('div');
        addClass(overlayEl, 'viewify-overlay', HIDDEN_CLASS);
        overlayEl.style.display = 'none';
        overlayEl.innerHTML = '<%= inlineTemplate("html/viewify/overlay.html") %>';
        body.appendChild(overlayEl);
        overlayEl.addEventListener('click', function (event) {
            if (event.target === overlayEl) {
                hideOverlay();
            }
        });
        var closeBtn = $('.viewify-close-btn', overlayEl);
        closeBtn.addEventListener('click', hideOverlay);
    }

    function isDocumentURL(url) {
        return /\.(pdf|doc|docx|ppt|pptx)(\?.*)?(#.*)?$/.test(url);
    }

    function fixLink(a) {
        var clone = a.cloneNode(true);
        clone.removeAttribute('onclick');
        clone.removeAttribute('onmousedown');
        clone.removeAttribute('onmouseup');
        replace(a, clone);
        clone.addEventListener('click', function (event) {
            var a = this;
            if (!a.dataset.viewifyIgnore && isDocumentURL(a.href)) {
                event.preventDefault();
                event.stopPropagation();
                viewifyLink(a);
            }
        });
    }

    function fixLinks() {
        forEach(document.querySelectorAll('a[href]:not([data-viewify-seen]'), function (a) {
            attr(a, 'data-viewify-seen', 1);
            if (isDocumentURL(a.href)) {
                fixLink(a);
            }
        });
    }

    var lastUpdated = 0,
        updateTID;
    function update() {
        var now = new Date().getTime();
        if (now - lastUpdated > 30000) {
            fixLinks();
            lastUpdated = now;
        }
    }

    if (isTopWindow()) {

        document.addEventListener('mousemove', function(event){
            clearTimeout(updateTID);
            updateTID = setTimeout(fixLinks, 50);
        }, true);


        document.addEventListener('keydown', function(event){
            if (event.keyCode === 27) { //esc
                hideOverlay();
            }
        }, true);

        update();

        window.addEventListener('message', function (event) {
            if (event.data === 'close') {
                hideOverlay();
            }
        }, false);
    }
})(window, document);
