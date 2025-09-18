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
    function crossFadeTo(nextImage) {
        const hidden = visible === 'a' ? 'b' : 'a';
        console.log('[hero rotator] crossFadeTo nextImage=', nextImage, 'hidden=', hidden, 'visible=', visible);

        // set hidden layer to next image and ensure it's hidden
        setLayer(hidden, nextImage, 0);

        // give the browser a tick to apply background change
        requestAnimationFrame(() => {
            // start cross-fade: bring hidden layer up, hide visible layer
            setLayer(hidden, nextImage, 0.42);
            setLayer(visible, null, 0);

            // after transition completes, swap visible marker
            visible = hidden;
            console.log('[hero rotator] now visible=', visible);
        });
    }

    // Start interval (10 seconds)
    setInterval(() => {
        idx = (idx + 1) % images.length;
        console.log('[hero rotator] tick, idx=', idx, 'image=', images[idx]);
        crossFadeTo(images[idx]);
    }, 10000);
})();
