window.addEventListener("scroll", function () {
    const navbar = document.querySelector("#navbar");
    if (!navbar) return;
    if (window.scrollY > 25) {
        navbar.style.backdropFilter = "blur(4px)";
        navbar.style.webkitBackdropFilter = "blur(4px)";
        navbar.style.top = "2.5%";
        navbar.style.width = "97%";
        navbar.style.borderRadius = "25px";
        navbar.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    } else {
        navbar.style.backdropFilter = "";
        navbar.style.webkitBackdropFilter = "";
        navbar.style.top = "";
        navbar.style.width = "";
        navbar.style.borderRadius = "";
        navbar.style.backgroundColor = "";
    }
});

// Background image rotator for hero section
(() => {
    const hero = document.querySelector('.first-sec');
    if (!hero) return;

    // List of background images (relative paths from this JS file).
    // Populated from files under Frontend/Universal/Images
    const images = [
        "url('../../Universal/Images/group-pic-1.jpg')",
        "url('../../Universal/Images/bs128.jpg')",
        "url('../../Universal/Images/bs133.jpg')",
        "url('../../Universal/Images/bs147.jpg')",
        "url('../../Universal/Images/bs158.jpg')",
        "url('../../Universal/Images/bs168.jpg')",
        "url('../../Universal/Images/bs183.jpg')",
        "url('../../Universal/Images/bs188.jpg')",
        "url('../../Universal/Images/bs65.jpg')",
        "url('../../Universal/Images/bs67.jpg')"
    ];

    // Preload images to avoid flicker
    console.log('[hero rotator] preloading images...');
    images.forEach(src => {
        const img = new Image();
        // extract url(...) content
        const m = src.match(/url\(['"]?(.*?)['"]?\)/);
        if (m && m[1]) {
            img.src = m[1];
            console.log('[hero rotator] preloaded:', m[1]);
        }
    });

    let idx = 0;
    const root = hero;

    // Which layer is currently visible: 'a' or 'b'
    let visible = 'a';

    // Utility to set layer background and opacity variables
    function setLayer(layer, imageUrl, opacity) {
        if (layer === 'a') {
            if (imageUrl != null) root.style.setProperty('--bg-a', imageUrl);
            root.style.setProperty('--bg-a-opacity', String(opacity));
        } else {
            if (imageUrl != null) root.style.setProperty('--bg-b', imageUrl);
            root.style.setProperty('--bg-b-opacity', String(opacity));
        }
    }

    // Initialize layers: A visible, B hidden
    console.log('[hero rotator] initializing layers');
    setLayer('a', images[0], 0.42);
    setLayer('b', images[1] || images[0], 0);
    idx = 1; // next will be images[2]
    console.log('[hero rotator] visible=a, next index=', idx, 'nextImage=', images[idx]);

    // Cross-fade to next image by placing it on the hidden layer and toggling opacities
    const TRANSITION_MS = 1000; // should match CSS transition duration
    let isTransitioning = false;
    let transitionTimeout = null;

    function crossFadeTo(nextImage) {
        if (isTransitioning) {
            console.log('[hero rotator] crossFade skipped (in-progress)');
            return;
        }

        const hidden = visible === 'a' ? 'b' : 'a';

        console.log('[hero rotator] crossFadeTo nextImage=', nextImage, 'hidden=', hidden, 'visible=', visible);

        isTransitioning = true;
        if (transitionTimeout) clearTimeout(transitionTimeout);

        // set hidden layer background and ensure it's fully hidden first
        setLayer(hidden, nextImage, 0);

        // force a reflow so the browser registers the new background before transition
        // eslint-disable-next-line no-unused-expressions
        root.offsetWidth;

        // start cross-fade: show hidden layer and hide visible layer in same frame
        requestAnimationFrame(() => {
            setLayer(hidden, nextImage, 0.42);
            setLayer(visible, null, 0);
        });

        // After transition duration, finalize swap
        transitionTimeout = setTimeout(() => {
            visible = hidden;
            isTransitioning = false;
            transitionTimeout = null;
            console.log('[hero rotator] now visible=', visible);
        }, TRANSITION_MS + 80);
    }

    // Start interval (10 seconds)
    setInterval(() => {
        idx = (idx + 1) % images.length;
        console.log('[hero rotator] tick, idx=', idx, 'image=', images[idx]);
        crossFadeTo(images[idx]);
    }, 10000);
})();

// Menu button: track open/closed state and swap icon src
(() => {
    const menuBtn = document.querySelector('.menu-btn');
    const menuContainer = document.querySelector('.menu-container');
    const mBtnContainer = document.querySelector('.m-btn-container');
    if (!menuBtn) return;

    const img = menuBtn.querySelector('img');
    // initial state
    let menuOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');

    const MENU_ICON = "../../Universal/Icons/menu_black.svg";
    const CLOSE_ICON = "../../Universal/Icons/close_black.svg";

    function updateMenu() {
        menuBtn.setAttribute('aria-expanded', String(menuOpen));
        if (menuOpen) {
            document.body.classList.add('menu-open');
            if (img) img.src = CLOSE_ICON;
            menuBtn.style.backgroundColor = 'rgba(59, 131, 246, 0.25)';
            if (menuContainer) menuContainer.classList.add('shown');
            if (mBtnContainer) mBtnContainer.classList.add('shown');
        } else {
            document.body.classList.remove('menu-open');
            if (img) img.src = MENU_ICON;
            menuBtn.style.backgroundColor = '';
            if (menuContainer) menuContainer.classList.remove('shown');
            if (mBtnContainer) mBtnContainer.classList.remove('shown');
        }
    }

    menuBtn.addEventListener('click', () => {
        menuOpen = !menuOpen;
        updateMenu();
        console.log('[menu] toggled, open=', menuOpen);
    });

    // support keyboard activation (Enter / Space)
    menuBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            menuOpen = !menuOpen;
            updateMenu();
        }
    });

    // Close menu when clicking/tapping outside of it (or pressing Escape)
    document.addEventListener('pointerdown', (e) => {
        if (!menuOpen) return;
        const target = e.target;
        // if click is inside menu button or container, do nothing
        if (menuBtn.contains(target)) return;
        if (menuContainer && menuContainer.contains(target)) return;
        // otherwise close
        menuOpen = false;
        updateMenu();
        console.log('[menu] closed by outside click');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) {
            menuOpen = false;
            updateMenu();
            console.log('[menu] closed by Escape');
        }
    });

    // Mobile menu item selection: toggle .selected on .m-btn
    (function setupMobileMenuSelection() {
        if (!mBtnContainer) return;
        const mBtns = Array.from(mBtnContainer.querySelectorAll('.m-btn'));
        if (!mBtns || mBtns.length === 0) return;

        function selectButton(btn) {
            mBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        }

        mBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                selectButton(btn);
                // optional: close menu when an item is chosen
                // Close menu when an item is chosen and scroll for specific IDs
                if (btn.id === 'services-m-btn') {
                    // scroll to 100vh from top smoothly
                    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                }
                menuOpen = false;
                updateMenu();
            });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectButton(btn);
                    if (btn.id === 'services-m-btn') {
                        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                    }
                    menuOpen = false;
                    updateMenu();
                }
            });
        });
    })();
})();

// Counters: increment .gns-value elements from 0 to data-target on page load
(() => {
    function animateCounters() {
        const counters = document.querySelectorAll('.gns-value');
        if (!counters || counters.length === 0) return;

        counters.forEach(el => {
            // If already animated, skip
            if (el.dataset.animated === 'true') return;

            const target = parseInt(el.getAttribute('data-target') || '0', 10);
            const suffix = el.getAttribute('data-suffix') || '';

            // Set initial display to 0 plus suffix inside the bold tag if present, else directly
            const bold = el.querySelector('b');
            if (bold) bold.textContent = '0' + suffix;
            else el.textContent = '0' + suffix;

            if (target <= 0) {
                el.dataset.animated = 'true';
                return;
            }

            // Duration and step calculation: make it fast but smooth
            const duration = 900; // ms total for counting
            const fps = 60;
            const totalFrames = Math.round((duration / 850) * fps);
            const increment = Math.max(1, Math.floor(target / totalFrames));

            let current = 0;

            const tick = () => {
                current += increment;
                if (current >= target) current = target;

                if (bold) bold.textContent = current + suffix;
                else el.textContent = current + suffix;

                if (current < target) {
                    // schedule next frame
                    requestAnimationFrame(tick);
                } else {
                    el.dataset.animated = 'true';
                }
            };

            // Start the first frame
            requestAnimationFrame(tick);
        });
    }

    // Run on load (defer script already used) and also when coming back via bfcache/navigation
    window.addEventListener('load', animateCounters);
    window.addEventListener('pageshow', (e) => { if (e.persisted) animateCounters(); });
})();
