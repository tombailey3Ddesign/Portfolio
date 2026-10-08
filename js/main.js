(function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Header border once the page scrolls
    var header = document.querySelector('.site-header');
    if (header) {
        var onScroll = function () {
            header.classList.toggle('is-scrolled', window.scrollY > 8);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // Footer year
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });

    // Fade sections in as they enter the viewport
    var revealItems = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        revealItems.forEach(function (el) { revealObserver.observe(el); });
    } else {
        revealItems.forEach(function (el) { el.classList.add('is-visible'); });
    }

    // Looping videos: play only while on screen; show controls instead when motion is reduced
    var videos = document.querySelectorAll('video[data-autoplay]');
    if (reduceMotion) {
        videos.forEach(function (v) { v.controls = true; });
    } else if ('IntersectionObserver' in window) {
        var videoObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var p = entry.target.play();
                    if (p && p.catch) p.catch(function () {});
                } else {
                    entry.target.pause();
                }
            });
        }, { threshold: 0.15 });
        videos.forEach(function (v) { videoObserver.observe(v); });
    }

    // Lightbox
    var items = Array.prototype.slice.call(document.querySelectorAll('img[data-lightbox]'));
    if (!items.length || typeof HTMLDialogElement === 'undefined') return;

    var dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-label', 'Image viewer');
    dialog.innerHTML =
        '<img alt="">' +
        '<p class="lightbox-caption"></p>' +
        '<p class="lightbox-count"></p>' +
        '<button class="lb-close" type="button" aria-label="Close">&#x2715;</button>' +
        '<button class="lb-prev" type="button" aria-label="Previous image">&#x2190;</button>' +
        '<button class="lb-next" type="button" aria-label="Next image">&#x2192;</button>';
    document.body.appendChild(dialog);

    var lbImg = dialog.querySelector('img');
    var lbCaption = dialog.querySelector('.lightbox-caption');
    var lbCount = dialog.querySelector('.lightbox-count');
    var current = 0;

    function show(index) {
        current = (index + items.length) % items.length;
        var item = items[current];
        var fig = item.closest('figure');
        var cap = fig && fig.querySelector('figcaption');
        lbImg.src = item.getAttribute('data-full') || item.currentSrc || item.src;
        lbImg.alt = item.alt;
        lbCaption.textContent = cap ? cap.textContent : item.alt;
        lbCount.textContent = (current + 1) + ' / ' + items.length;
        // Warm the cache for the next image
        var next = items[(current + 1) % items.length];
        new Image().src = next.getAttribute('data-full') || next.src;
    }

    items.forEach(function (item, i) {
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.addEventListener('click', function () {
            show(i);
            dialog.showModal();
        });
        item.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                show(i);
                dialog.showModal();
            }
        });
    });

    dialog.querySelector('.lb-close').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
    dialog.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });

    // Click on the dark area closes; click on the image goes forward
    dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
        else if (e.target === lbImg) show(current + 1);
    });

    dialog.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') show(current + 1);
        else if (e.key === 'ArrowLeft') show(current - 1);
    });

    var touchX = null;
    dialog.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
        touchX = null;
    }, { passive: true });
})();
