function initViewer(options) {
    'use strict';

    // IE < 10 doesn't get data until the connection is closed
    // by the server, so tell the server to close the connection
    // periodically
    if (Crocodoc.getUtility('browser').ielt10) {
        sseURL += '?shame=true';
    }

    var viewer,
        eventSource,
        currentPage,
        lastCompletedPage = 0,
        numPages = 0,
        viewerConfig = {
            url: options.assetsURL,
            layout: Crocodoc.LAYOUT_VERTICAL_SINGLE_COLUMN,
            plugins: {
                fullscreen: {
                    element: document.documentElement,
                    useFakeFullscreen: false
                },
                realtime: {
                    url: options.realtimeURL
                }
            }
        },
        $body = $('body'),
        $pageInput = $('.page-input'),
        $pageDisplay = $('.page-display'),
        $scrollNextBtn = $('.scroll-next-btn'),
        $scrollPreviousBtn = $('.scroll-previous-btn'),
        $zoomInBtn = $('.zoom-in-btn'),
        $zoomOutBtn = $('.zoom-out-btn'),
        $fullscreenBtn = $('.fullscreen-btn');

    /**
     * Update the controls display (page number, disabled state of buttons)
     * @param   {int} currentPage The current page number
     * @returns {void}
     */
    function updatePageControls(currentPage) {
        $pageDisplay.text(currentPage + ' / ' + numPages);
        $pageInput.val(currentPage).select();
        $scrollPreviousBtn.prop('disabled', currentPage === 1);
        $scrollNextBtn.prop('disabled', currentPage === numPages);
    }

    /**
     * Show error page
     * @returns {void}
     */
    function fail() {
        $body.addClass('fail').removeClass('ready');
    }

    viewer = Crocodoc.createViewer('.viewer', viewerConfig);
    viewer.load();
    viewer.on('ready', function (event) {
        $body.addClass('ready');
        numPages = event.data.numPages;
        updatePageControls(event.data.page);
        currentPage = event.data.page;
    });
    viewer.on('fail', fail);
    viewer.on('realtimeerror', fail);
    viewer.on('pagefocus', function (event) {
        updatePageControls(event.data.page);
        currentPage = event.data.page;
    });
    viewer.on('zoom', function (event) {
        $zoomInBtn.prop('disabled', !event.data.canZoomIn);
        $zoomOutBtn.prop('disabled', !event.data.canZoomOut);
    });
    viewer.on('fullscrenchange', function () {
        $body.toggleClass('fullscreen', viewer.isFullscreen());
    });

    $scrollPreviousBtn.on('click', function () {
        viewer.scrollTo(Crocodoc.SCROLL_PREVIOUS);
    });
    $scrollNextBtn.on('click', function () {
        viewer.scrollTo(Crocodoc.SCROLL_NEXT);
    });
    $zoomInBtn.on('click', function () {
        viewer.zoom(Crocodoc.ZOOM_IN);
    });
    $zoomOutBtn.on('click', function () {
        viewer.zoom(Crocodoc.ZOOM_OUT);
    });
    $fullscreenBtn.on('click', function () {
        if (viewer.isFullscreenSupported()) {
            if (viewer.isFullscreen()) {
                viewer.exitFullscreen();
            } else {
                viewer.enterFullscreen();
            }
        } else {
            window.open(location.href);
        }
    });
    $pageDisplay.on('click focus', function () {
        $pageDisplay.prop('disabled', true);
        function done() {
            var pageNum = parseInt($pageInput.val(), 10);
            viewer.scrollTo(pageNum);
            cleanup();
        }
        function cleanup() {
            $pageDisplay.prop('disabled', false);
            $pageInput.hide()
                .off('blur keydown')
                .val('');
        }
        function keydown(event) {
            if (event.keyCode === 13) { // ENTER
                done();
            } else if (event.keyCode === 27) { // ESC
                cleanup();
                event.preventDefault();
            }
        }
        $pageInput.show()
            .focus()
            .val(currentPage)
            .select()
            .on('blur', done)
            .on('keydown', keydown);
    });

    $(window).on('keydown', function (ev) {
        if (ev.metaKey || ev.ctrlKey) {
            switch (ev.keyCode) {
                case 48: // 0
                    viewer.zoom('auto');
                    break;
                case 173: // - (firefox)
                case 189: // - (chrome, etc?)
                    viewer.zoom('out');
                    break;
                case 61: // = (firefox)
                case 187: // = (chrome, etc?)
                    viewer.zoom('in');
                    break;
                default:
                    return;
            }
            ev.preventDefault();
            return false;
        } else {
            switch (ev.keyCode) {
                case 37: // left
                    viewer.scrollTo(Crocodoc.SCROLL_PREVIOUS);
                    break;
                case 39: // right
                    viewer.scrollTo(Crocodoc.SCROLL_NEXT);
                    break;
            }
        }
    });

    if (!viewer.isFullscreenSupported()) {
        $fullscreenBtn.hide();
    }

    function closeOverlay() {
        window.parent.postMessage('close', '*');
    }
    if (window.parent !== window) {
        $(document).on('keydown', function (event) {
            if (event.keyCode === 27) { //esc
                closeOverlay();
            }
        });

        $('.crocodoc-doc').on('click', function (event) {
            if (event.target === this) {
                closeOverlay();
            }
        });
    }
}
