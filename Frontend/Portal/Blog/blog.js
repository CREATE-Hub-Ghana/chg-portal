document.addEventListener('DOMContentLoaded', () => {
    // Collect filter buttons and story nodes
    const filterButtons = Array.from(document.querySelectorAll('.lu-filter'));
    const storyBlocks = Array.from(document.querySelectorAll('.story-block'));
    const secondSec = document.querySelector('.second-sec');
    const featured = document.querySelector('.featured-story-container');
    const searchButton = document.getElementById('filter-search-btn');
    const searchInput = document.getElementById('filter-search');

    // Helper: extract category text from a story-block
    function getCategory(el) {
        const cat = el.querySelector('.sb-category');
        return cat ? cat.textContent.trim() : '';
    }

    // Helper: find a calendar sd-block span text inside a container
    function extractDateText(container) {
        if (!container) return null;
        // find any .sd-block that contains an img with alt containing 'Calendar'
        const sdBlocks = container.querySelectorAll('.sd-block');
        for (const sd of sdBlocks) {
            const img = sd.querySelector('img');
            const span = sd.querySelector('span');
            if (img && /calendar/i.test(img.alt || '') && span) {
                return span.textContent.trim();
            }
        }
        // Fallback: any span that looks like a date (contains 4-digit year)
        const spans = container.querySelectorAll('span');
        for (const s of spans) {
            if (/\b\d{4}\b/.test(s.textContent)) return s.textContent.trim();
        }
        return null;
    }

    // Parse a human-readable date string to a Date object; return null if invalid
    function parseDate(dateStr) {
        if (!dateStr) return null;
        // Try native parsing first
        const d = new Date(dateStr);
        if (!isNaN(d)) return d;

        // Try common fallback formats (e.g., 'October 21, 2024') - native should handle it
        // If still invalid, try to massage common unicode spaces
        const cleaned = dateStr.replace(/[\u00A0\u202F]/g, ' ').trim();
        const d2 = new Date(cleaned);
        return isNaN(d2) ? null : d2;
    }

    // Build dataset for each story element (date, category, popularity fallback)
    // Only include story blocks inside .third-sec (do not include featured .second-sec)
    const allStoryNodes = storyBlocks.slice();

    allStoryNodes.forEach((node, idx) => {
        // category
        const cat = getCategory(node) || '';
        node.dataset.category = cat.toLowerCase();

        // date
        const dateText = extractDateText(node);
        const parsed = parseDate(dateText);
        node.dataset.dateIso = parsed ? parsed.toISOString() : '';

        // popularity: allow authors to set data-popularity in HTML; otherwise fall back to DOM order
        if (!node.dataset.popularity) node.dataset.popularity = String(allStoryNodes.length - idx);
    });

    // Utility: show/hide node
    function showNode(node) {
        node.style.display = '';
        node.setAttribute('aria-hidden', 'false');
    }

    function hideNode(node) {
        node.style.display = 'none';
        node.setAttribute('aria-hidden', 'true');
    }

    // Helper to set which filter button is visually active
    function setActiveFilterButton(btnOrId) {
        filterButtons.forEach(b => b.classList.remove('active-filter'));
        if (!btnOrId) return;
        const btn = typeof btnOrId === 'string' ? document.getElementById(btnOrId) : btnOrId;
        if (btn && btn.classList) btn.classList.add('active-filter');
    }

    // Apply a filter: type can be 'all' | 'category' | 'latest' | 'popular' | 'search'
    function applyFilter(type, value) {
        // NOTE: active button is managed separately via setActiveFilterButton

        if (type === 'all') {
            allStoryNodes.forEach(showNode);
            return;
        }

        if (type === 'search') {
            const query = (value || '').toLowerCase().trim();
            if (!query) {
                // empty search -> show all and display featured story
                allStoryNodes.forEach(showNode);
                const isMobile = window.innerWidth < 630 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (!isMobile) {
                    if (featured) featured.style.display = '';
                    if (secondSec) secondSec.style.paddingBottom = '';
                }
                return;
            }
            // hide featured story when search is active
            if (featured) featured.style.display = 'none';
            if (secondSec) secondSec.style.paddingBottom = '5px';

            allStoryNodes.forEach(node => {
                // get story title and category text
                const titleEl = node.querySelector('.story-title span');
                const categoryEl = node.querySelector('.sb-category');
                const title = titleEl ? titleEl.textContent.toLowerCase() : '';
                const category = categoryEl ? categoryEl.textContent.toLowerCase() : '';

                // match against title or category
                if (title.includes(query) || category.includes(query)) {
                    showNode(node);
                } else {
                    hideNode(node);
                }
            });
            return;
        }

        if (type === 'category') {
            const wanted = (value || '').toLowerCase();
            allStoryNodes.forEach(node => {
                // featured story doesn't have a category; hide it for category-specific filters
                if (!node.dataset.category) return hideNode(node);
                if (node.dataset.category === wanted) showNode(node);
                else hideNode(node);
            });
            return;
        }

        if (type === 'latest') {
            // Find newest date among nodes
            const dates = allStoryNodes.map(n => n.dataset.dateIso).filter(Boolean).map(s => new Date(s));
            if (dates.length === 0) {
                // no dates -> show all
                allStoryNodes.forEach(showNode);
                return;
            }
            const newest = new Date(Math.max(...dates.map(d => d.getTime())));
            const cutoff = new Date(newest.getTime() - 30 * 24 * 60 * 60 * 1000);
            allStoryNodes.forEach(node => {
                const iso = node.dataset.dateIso;
                if (!iso) return hideNode(node);
                const nd = new Date(iso);
                if (nd >= cutoff) showNode(node); else hideNode(node);
            });
            return;
        }

        if (type === 'popular') {
            // show top 3 by data-popularity (number descending), fallback to first 3 DOM order
            const ranked = allStoryNodes.slice().sort((a, b) => Number(b.dataset.popularity || 0) - Number(a.dataset.popularity || 0));
            const top = new Set(ranked.slice(0, 3));
            allStoryNodes.forEach(node => top.has(node) ? showNode(node) : hideNode(node));
            return;
        }
    }

    // Wire filter button clicks
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.id || '';
            // set active class
            setActiveFilterButton(btn);

            switch (id) {
                case 'filter-all':
                    applyFilter('all');
                    break;
                case 'filter-latest':
                    applyFilter('latest');
                    break;
                case 'filter-popular':
                    applyFilter('popular');
                    break;
                case 'filter-programs':
                case 'filter-tech':
                case 'filter-education':
                case 'filter-success':
                    // map id to human category label
                    const labelMap = {
                        'filter-programs': 'Programs',
                        'filter-tech': 'Technology',
                        'filter-education': 'Education',
                        'filter-success': 'Success stories'
                    };
                    applyFilter('category', labelMap[id]);
                    break;
                default:
                    applyFilter('all');
            }
        });

        // keyboard accessibility
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // Wire mobile menu buttons (if present) to trigger the same filters
    const mobileButtons = Array.from(document.querySelectorAll('.m-btn'));
    mobileButtons.forEach(mb => {
        mb.addEventListener('click', () => {
            const txt = (mb.textContent || '').trim().toLowerCase();
            // remove 's' differences e.g., 'Programs' -> 'programs'
            if (txt === 'blog' || txt === 'home' || txt === 'about' || txt === 'contact' || txt === 'services') {
                // these don't filter blog stories; show all
                setActiveFilterButton('filter-all');
                applyFilter('all');
                return;
            }
            if (txt === 'programs') return applyFilter('category', 'Programs');
            if (txt === 'programmes' || txt === 'program') return applyFilter('category', 'Programs');
            if (txt === 'technology' || txt === 'tech') return applyFilter('category', 'Technology');
            if (txt === 'education') return applyFilter('category', 'Education');
            if (txt.includes('success')) return applyFilter('category', 'Success stories');
            // fallback
            setActiveFilterButton('filter-all');
            applyFilter('all');
        });
    });

    // Initialize: show all
    // Make sure "All" is visually active on load and featured section is unaffected
    setActiveFilterButton('filter-all');
    applyFilter('all');

    // Handle "Read Story" button clicks to display blog-container
    const readStoryButtons = document.querySelectorAll('#read-story');
    const blogContainer = document.querySelector('.blog-container');
    const blogInner = document.querySelector('.bc-inner');
    const bcNavbar = document.querySelector('.bc-navbar');
    const bciHead = document.querySelector('.bci-head');
    const blogTitle = blogContainer.querySelector('.blog-title');
    const blogInnerRight = document.querySelector('.sic-right');
    readStoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (blogContainer) {
                // Get the parent story block
                const storyBlock = btn.closest('.story-block');
                if (storyBlock) {
                    // Extract title and category
                    const titleEl = storyBlock.querySelector('.story-title span');
                    const title = titleEl ? titleEl.textContent : '';
                    const categoryEl = storyBlock.querySelector('.sb-category');
                    const category = categoryEl ? categoryEl.textContent : '';

                    // Extract author, date, and read time
                    const authorEl = storyBlock.querySelector('.sd-block:nth-child(1) span');
                    const dateEl = storyBlock.querySelector('.sd-block:nth-child(2) span');
                    const readTimeEl = storyBlock.querySelector('.sb-min-read');

                    const author = authorEl ? authorEl.textContent : '';
                    const date = dateEl ? dateEl.textContent : '';
                    const readTime = readTimeEl ? readTimeEl.textContent : '';

                    // Populate blog container
                    const navBlogTitle = blogContainer.querySelector('.bcn-blog-title');
                    const blogDetails = blogContainer.querySelector('.blog-details');

                    if (blogTitle) blogTitle.textContent = title;
                    if (blogDetails) blogDetails.textContent = `${date} | ${category}`;
                    if (navBlogTitle) navBlogTitle.textContent = title;

                    // Set background-image for bci-head::before
                    const sbImageEl = storyBlock.querySelector('.sb-image img');
                    const bciHead = blogContainer.querySelector('.bci-head');
                    if (bciHead) {
                        // Add .dummy class if sb-image has .dummy
                        const sbImage = storyBlock.querySelector('.sb-image');
                        if (sbImage && sbImage.classList.contains('dummy')) {
                            bciHead.classList.add('dummy');
                        } else {
                            bciHead.classList.remove('dummy');
                        }

                        if (sbImageEl && sbImageEl.src) {
                            bciHead.style.setProperty('--bg-image-url', `url("${sbImageEl.src}")`);
                        }
                    }
                }

                // Reset navbar to initial state
                bcNavbar.style.top = '';
                bcNavbar.style.position = '';

                // Reset blog-inner styles
                blogInner.style.width = '';
                blogInner.style.marginLeft = '';
                blogInner.style.marginRight = '';
                blogInner.style.borderRadius = '';

                // Reset bci-head styles
                if (bciHead) bciHead.style.borderRadius = '';

                // Reset bci-head styles
                blogTitle.style.fontSize = '';

                blogContainer.classList.add('shown');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Handle scroll to make blog-container full width when it hits the top
    if (blogInner && blogContainer) {
        const bcNavbar = document.querySelector('.bc-navbar');
        const bciHead = document.querySelector('.bci-head');
        const bcCloseButton = document.querySelector('.bc-close-button');
        const blogTitle = blogContainer.querySelector('.blog-title');

        let navbarStickyScrollStart = null;

        // Function to update navbar progress bar width based on scroll
        function updateNavbarProgressBar() {
            const headRect = bciHead.getBoundingClientRect();

            // Only show progress when navbar is sticky (headRect.bottom <= 0)
            if (headRect.bottom <= 0) {
                // Capture the scroll position when navbar first becomes sticky
                if (navbarStickyScrollStart === null) {
                    navbarStickyScrollStart = blogContainer.scrollTop;
                }

                const scrollTop = blogContainer.scrollTop;
                const scrollHeight = blogContainer.scrollHeight - blogContainer.clientHeight;

                // Calculate progress from when navbar became sticky to the end
                const remainingScroll = scrollHeight - navbarStickyScrollStart;
                if (remainingScroll > 0) {
                    const scrollSinceSticky = scrollTop - navbarStickyScrollStart;
                    const scrollPercent = (scrollSinceSticky / remainingScroll) * 100;
                    const progressWidth = Math.max(1, Math.min(100, scrollPercent));
                    bcNavbar.style.setProperty('--navbar-progress', `${progressWidth}%`);
                }
            } else {
                // Before navbar is sticky, reset the capture point and keep progress at 0%
                navbarStickyScrollStart = null;
                bcNavbar.style.setProperty('--navbar-progress', '0%');
            }
        }

        blogContainer.addEventListener('scroll', () => {
            // Update navbar progress bar
            updateNavbarProgressBar();

            const rect = blogInner.getBoundingClientRect();
            if (rect.top <= 0) {
                // blog-container has reached the top, make it full width
                blogInner.style.width = '100%';
                blogInner.style.marginLeft = '0';
                blogInner.style.marginRight = '0';
                blogInner.style.borderRadius = '0';
                bciHead.style.borderRadius = '0';
                blogTitle.style.fontSize = '3em';
                blogInnerRight.classList.add('shown');
            } else {
                // blog-container is not at the top, reset to original width
                blogInner.style.width = '';
                blogInner.style.marginLeft = '';
                blogInner.style.marginRight = '';
                blogInner.style.borderRadius = '';
                bciHead.style.borderRadius = '';
                blogTitle.style.fontSize = '';
                blogInnerRight.classList.remove('shown');
            }

            // Check if bci-head is no longer in view
            if (bciHead && bcNavbar && bcCloseButton) {
                const headRect = bciHead.getBoundingClientRect();
                if (headRect.bottom <= 0) {
                    // bci-head is no longer visible, move navbar to top
                    bcNavbar.style.top = '0';
                    bcNavbar.style.position = 'sticky';
                    bcCloseButton.style.top = '15px';
                    bcCloseButton.style.width = '36px';
                    bcCloseButton.style.height = '36px';
                } else {
                    // bci-head is still visible, reset navbar
                    bcNavbar.style.top = '-71px';
                    bcNavbar.style.position = 'absolute';
                    bcCloseButton.style.top = '20px';
                    bcCloseButton.style.width = '40px';
                    bcCloseButton.style.height = '40px';
                }
            }
        });

        // Handle bc-arrow-down click to scroll down until rect.top <= 0
        const bcArrowDown = document.querySelector('.bc-arrow-down');
        if (bcArrowDown) {
            bcArrowDown.addEventListener('click', () => {
                // Scroll until rect.top <= 0
                const scrollStep = () => {
                    const rect = blogInner.getBoundingClientRect();
                    if (rect.top > 0) {
                        blogContainer.scrollBy({ top: rect.top, behavior: 'smooth' });
                    }
                };
                scrollStep();
            });
        }

        // Handle bc-close-button click to close the blog container
        if (bcCloseButton) {
            bcCloseButton.addEventListener('click', () => {
                // Reset scroll position BEFORE hiding the container
                blogContainer.scrollTop = 0;

                // Then hide the container
                blogContainer.classList.remove('shown');
                document.body.style.overflow = '';
            });
        }

        // Helper function to close the blog container
        function closeBlogContainer() {
            blogContainer.scrollTop = 0;
            blogContainer.classList.remove('shown');
            document.body.style.overflow = '';
        }

        // Handle click outside .bc-inner to close the blog container
        if (blogContainer) {
            blogContainer.addEventListener('click', (e) => {
                // Only close if the click is directly on the blogContainer (the backdrop)
                // and not on .bc-inner or its children
                if (e.target === blogContainer) {
                    closeBlogContainer();
                }
            });
        }
    }

    //SEARCH INPUT EXPAND/CONTRACT

    if (searchButton && searchInput) {
        // ensure smooth width transition
        if (!searchInput.style.transition) searchInput.style.transition = 'all 250ms ease-out';

        // Track current search state
        let isSearchActive = false;

        // Helper: update search active state based on input value
        function updateSearchActiveState() {
            const hasValue = searchInput.value.trim().length > 0;
            if (hasValue !== isSearchActive) {
                isSearchActive = hasValue;
                if (isSearchActive) {
                    searchButton.classList.add('active-filter');
                    searchInput.dataset.hasContent = 'true';
                } else {
                    searchButton.classList.remove('active-filter');
                    searchInput.dataset.hasContent = 'false';
                }
            }
        }

        // Handle search input on every keystroke
        searchInput.addEventListener('input', (e) => {
            const query = searchInput.value.trim();

            // Apply search filter in real-time
            applyFilter('search', query);

            // Update active state
            updateSearchActiveState();
        });

        // Handle search input on Enter key (submit)
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                applyFilter('search', query);
                updateSearchActiveState();
            }
            // Allow ESC to clear search
            if (e.key === 'Escape') {
                e.preventDefault();
                searchInput.value = '';
                applyFilter('search', '');
                updateSearchActiveState();
            }
        });

        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            const isExpanded = searchInput.dataset.expanded === 'true';
            const img = searchButton.querySelector('img');
            const searchContainer = document.querySelector('.filter-search-container');
            const isMobile = window.innerWidth < 630 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (!isExpanded) {
                searchButton.style.padding = '6.5px 10px';
                searchButton.style.marginRight = '6px';
                searchButton.style.backgroundColor = '#2563eb';
                if (img) img.src = '../../Universal/Icons/search_white.svg';
                if (img) img.style.opacity = '1';
                if (img) img.style.width = '18px';
                if (img) img.style.height = '18px';

                filterButtons.forEach(b => b.style.opacity = '0');

                searchContainer.style.marginRight = '-10px';

                // searchInput.style.width = '892px';
                searchInput.style.width = 'calc(100% - 80px)';

                searchInput.style.height = '42px';
                searchInput.style.padding = '0 55px 0 25px';
                searchInput.dataset.expanded = 'true';
                searchButton.setAttribute('aria-expanded', 'true');
                searchInput.focus();

                if (isMobile) {
                    // Mobile: make the search input take most of the width and hide filter buttons for clarity
                    searchContainer.style.position = 'relative';
                    searchContainer.style.zIndex = '999';
                    searchContainer.style.width = '100%';
                    searchContainer.style.marginRight = '0';

                    filterButtons.forEach(b => {
                        b.style.opacity = '0';
                        b.style.display = 'none';
                        b.style.pointerEvents = 'none';
                    });

                    // Expand input to full width (account for the search button)
                    searchInput.style.width = '100%';
                    searchInput.style.boxSizing = 'border-box';
                    searchInput.style.padding = '0 55px 0 16px';
                    searchInput.style.height = '48px';

                    // Hide featured on mobile
                    if (featured) featured.style.display = 'none';
                    if (secondSec) secondSec.style.paddingBottom = '5px';
                }


            } else {
                searchButton.style.padding = '';
                searchButton.style.marginRight = '0';
                searchButton.style.backgroundColor = '';
                if (img) img.src = '../../Universal/Icons/search_black.svg';
                if (img) img.style.opacity = '';
                if (img) img.style.width = '';
                if (img) img.style.height = '';

                filterButtons.forEach(b => b.style.opacity = '');
                searchContainer.style.marginRight = '';

                searchInput.style.width = '';
                searchInput.style.height = '';
                searchInput.style.padding = '';
                searchInput.dataset.expanded = 'false';
                searchButton.setAttribute('aria-expanded', 'false');

                // Clear search when collapsing
                searchInput.value = '';
                applyFilter('search', '');
                updateSearchActiveState();

                searchInput.blur();

                if (isMobile) {
                    searchContainer.style.position = '';
                    searchContainer.style.zIndex = '';
                    searchContainer.style.width = '';
                    searchContainer.style.marginRight = '';

                    filterButtons.forEach(b => {
                        b.style.opacity = '';
                        b.style.display = '';
                        b.style.pointerEvents = '';
                    });

                    searchInput.style.width = '';
                    searchInput.style.boxSizing = '';
                    searchInput.style.padding = '';
                    searchInput.style.height = '';

                    // Keep featured hidden on mobile even when search is cleared
                    // Only show on desktop
                    if (featured) featured.style.display = '';
                    if (secondSec) secondSec.style.paddingBottom = '';
                }
            }
        });
    }

    // Handle share-blog-btn click
    const shareBlogBtn = document.getElementById('share-blog-btn');
    if (shareBlogBtn) {
        shareBlogBtn.addEventListener('click', () => {
            const blogTitle = document.querySelector('.bcn-blog-title')?.textContent || 'Check out this blog post';
            const blogUrl = window.location.href;

            // Check if Web Share API is available
            if (navigator.share) {
                navigator.share({
                    title: 'Create Hub Ghana - Blog',
                    text: blogTitle,
                    url: blogUrl,
                }).catch(err => {
                    if (err.name !== 'AbortError') {
                        console.error('Error sharing:', err);
                        fallbackShare(blogTitle, blogUrl);
                    }
                });
            } else {
                // Fallback: copy to clipboard and show notification
                fallbackShare(blogTitle, blogUrl);
            }
        });
    }

    // Fallback share function - copy URL to clipboard
    function fallbackShare(title, url) {
        const textToCopy = `${title}\n${url}`;

        navigator.clipboard.writeText(url).then(() => {
            // Show success message
            const btn = document.getElementById('share-blog-btn');
            const originalText = btn.querySelector('span').textContent;
            btn.querySelector('span').textContent = 'Copied!';

            setTimeout(() => {
                btn.querySelector('span').textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Share: ' + url);
        });
    }

    // Handle download-blog-btn click
    const downloadBlogBtn = document.getElementById('download-blog-btn');
    if (downloadBlogBtn) {
        downloadBlogBtn.addEventListener('click', () => {
            const downloadLink = downloadBlogBtn.getAttribute('data-link');

            if (downloadLink) {
                // Open the download link in a new tab
                window.open(downloadLink, '_blank');
            } else {
                console.error('No download link provided');
                alert('Download link not available');
            }
        });
    }
});

