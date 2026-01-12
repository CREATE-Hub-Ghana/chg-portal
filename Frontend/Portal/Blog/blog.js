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
    if (searchInput) searchInput.value = ''; // Ensure search is clear on load
    const emailSub = document.getElementById('blog-subscription-email');
    if (emailSub) emailSub.value = '';

    setActiveFilterButton('filter-all');
    applyFilter('all');

    // Handle "Read Story" button clicks to display blog-container
    const readStoryButtons = document.querySelectorAll('#read-story, .read-story');
    const blogContainer = document.querySelector('.blog-container');
    const blogInner = document.querySelector('.bc-inner');
    const bcNavbar = document.querySelector('.bc-navbar');
    const bciHead = document.querySelector('.bci-head');
    const blogTitle = blogContainer.querySelector('.blog-title');

    // --- Side Navigation Menu Setup ---
    const navMenu = document.querySelector('.bc-nav-menu');
    const navList = document.querySelector('.bcnm-list');
    const navCloseBtn = document.querySelector('.bcnm-close-btn');
    let blogHeaders = [];

    // Generate TOC based on story-chapter-section or h1, h2 in content
    function generateBlogNavigation() {
        if (!navList || !navMenu || !blogInner) return;

        navList.innerHTML = '';
        blogHeaders = [];

        let targets = [];
        const chapterSections = Array.from(blogInner.querySelectorAll('.story-chapter-section'));

        if (chapterSections.length > 0) {
            // Use chapter sections
            targets = chapterSections.map(section => {
                const titleEl = section.querySelector('.chapter-title');
                // fallback to header text if no title span
                const text = titleEl ? titleEl.textContent : (section.querySelector('.chapter-header')?.textContent || 'Section');
                return { element: section, text: text };
            });
            // Force active state if at least one chapter section exists
            // navMenu.classList.add('active'); // Changed: controlled by scroll
        } else {
            // Fallback to H1/H2
            const headers = Array.from(blogInner.querySelectorAll('h1, h2'));
            if (headers.length >= 2) {
                targets = headers.map(h => ({ element: h, text: h.textContent }));
                // navMenu.classList.add('active'); // Changed: controlled by scroll
            } else {
                navMenu.classList.remove('active', 'shown');
                return;
            }
        }

        // Just in case targets is empty despite logic above
        if (targets.length === 0) {
            navMenu.classList.remove('active', 'shown');
            return;
        }

        // Initially hide the expanded menu and ensure not active until scroll
        navMenu.classList.remove('shown');
        navMenu.classList.remove('active');

        blogHeaders = targets.map(t => t.element); // Update global for scroll spy

        targets.forEach((target, idx) => {
            const { element, text } = target;
            if (!element.id) element.id = `blog-section-${idx}`;

            const item = document.createElement('div');
            item.className = 'nm-list-bar';
            if (idx === 0) item.classList.add('selected');

            const left = document.createElement('div');
            left.className = 'nmlb-left';
            const span = document.createElement('span');
            span.textContent = text;
            left.appendChild(span);

            const right = document.createElement('div');
            right.className = 'nmlb-right';

            const rightInner = document.createElement('div');
            rightInner.className = 'nmlbr-inner';
            right.appendChild(rightInner);

            item.appendChild(left);
            item.appendChild(right);

            item.addEventListener('click', (e) => {
                e.stopPropagation();

                // Toggle menu only when clicking the inner handle of the selected item
                if (item.classList.contains('selected') && e.target.closest('.nmlb-right')) {
                    navMenu.classList.toggle('shown');
                    return;
                }

                // Calculate scroll position - account for sticky navbar e.g. 100px
                const offset = 100;
                // Using blogContainer as the scrollable context
                const containerRect = blogContainer.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                const relativeTop = elementRect.top - containerRect.top + blogContainer.scrollTop;

                blogContainer.scrollTo({
                    top: relativeTop - offset,
                    behavior: 'smooth'
                });
            });

            navList.appendChild(item);
        });
    }

    // Highlight menu item on scroll
    function updateNavOnScroll() {
        if (!blogHeaders.length || !navMenu || !navMenu.classList.contains('active')) return;

        const offset = 180; // Distance from top to consider "active"
        const containerTop = blogContainer.getBoundingClientRect().top;
        let activeIdx = 0;

        for (let i = 0; i < blogHeaders.length; i++) {
            const rect = blogHeaders[i].getBoundingClientRect();
            // Check if header is at or above the "reading line"
            if (rect.top < containerTop + offset) {
                activeIdx = i;
            }
        }

        const items = navList.querySelectorAll('.nm-list-bar');
        items.forEach((item, i) => {
            if (i === activeIdx) item.classList.add('selected');
            else item.classList.remove('selected');
        });
    }

    // Event Listeners for Menu Toggle
    if (navMenu) {
        navMenu.addEventListener('click', (e) => {
            // Prevent propagation but do not toggle on generic background clicks
            // Strict Toggle: Only via .nmlb-right of selected item (handled in item click)
            e.stopPropagation();
        });
    }

    if (navCloseBtn) {
        navCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navMenu) navMenu.classList.remove('shown');
        });
    }
    // ----------------------------------

    // Track current blog ID
    let currentBlogId = null;

    async function openBlogStory(btn, updateHistory = true) {
        if (!blogContainer) return;

        // Get the parent story block (handles both standard blocks and featured)
        const storyBlock = btn.closest('.story-block') || btn.closest('.featured-story-container');

        // Reset navbar to initial state
        bcNavbar.style.top = '';
        bcNavbar.style.position = '';

        // Reset sidebar menu
        if (navList) navList.innerHTML = '';
        if (navMenu) navMenu.classList.remove('active', 'shown');

        // Reset blog-inner styles
        blogInner.style.width = '';
        blogInner.style.marginLeft = '';
        blogInner.style.marginRight = '';
        blogInner.style.borderRadius = '';
        blogInner.style.top = '';

        blogContainer.classList.add('shown');
        document.body.style.overflow = 'hidden';

        if (storyBlock) {
            // Get ID
            currentBlogId = storyBlock.dataset.id;

            // Update URL without reloading
            if (currentBlogId) {
                if (updateHistory) {
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('id', currentBlogId);
                    window.history.pushState({ path: newUrl.href }, '', newUrl.href);
                }

                // Load content dynamically
                try {
                    // Simple loader
                    blogInner.innerHTML = '<div style="padding: 100px; text-align: center;">Loading story...</div>';

                    const response = await fetch(`/Portal/Blog/stories/${currentBlogId}.html`);
                    if (response.ok) {
                        const html = await response.text();
                        blogInner.innerHTML = html;

                        // Update download button based on story content
                        const downloadBtnEl = document.getElementById('download-blog-btn');
                        if (downloadBtnEl) {
                            const linkEl = blogInner.querySelector('#story-download-link');
                            if (linkEl && linkEl.dataset.link) {
                                downloadBtnEl.setAttribute('data-link', linkEl.dataset.link);
                                downloadBtnEl.style.display = ''; // Restore default display
                            } else {
                                downloadBtnEl.removeAttribute('data-link');
                                downloadBtnEl.style.display = 'none'; // Hide button
                            }
                        }

                        // Generate Navigation Menu for new content
                        generateBlogNavigation();

                        // Attach event listener to the new bc-arrow-down button
                        const bcArrowDown = blogInner.querySelector('.bc-arrow-down');
                        if (bcArrowDown) {
                            bcArrowDown.addEventListener('click', () => {
                                const rect = blogInner.getBoundingClientRect();
                                if (rect.top > 0) {
                                    blogContainer.scrollBy({ top: rect.top, behavior: 'smooth' });
                                }
                            });
                        }

                        // Retrieve dynamic elements for navbar update
                        const newTitle = blogContainer.querySelector('.blog-title');
                        const navBlogTitle = blogContainer.querySelector('.bcn-blog-title');
                        if (newTitle && navBlogTitle) {
                            navBlogTitle.textContent = newTitle.textContent;
                        }
                    } else {
                        blogInner.innerHTML = '<div style="padding: 100px; text-align: center;">Story content not found.</div>';
                    }
                } catch (err) {
                    console.error(err);
                    blogInner.innerHTML = '<div style="padding: 100px; text-align: center;">Error loading story.</div>';
                }
            }
        }
    }

    readStoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openBlogStory(btn);
        });
    });

    // Make entire story blocks clickable
    if (featured) {
        featured.addEventListener('click', () => openBlogStory(featured));
    }
    storyBlocks.forEach(block => {
        block.addEventListener('click', () => openBlogStory(block));
    });

    // Handle Browser Back/Forward Navigation
    window.addEventListener('popstate', (e) => {
        const p = new URLSearchParams(window.location.search);
        const id = p.get('id');

        if (id) {
            if (currentBlogId !== id) {
                const targetBlock = document.querySelector(`.story-block[data-id="${id}"], .featured-story-container[data-id="${id}"]`);
                if (targetBlock) {
                    const btn = targetBlock.querySelector('#read-story, .read-story') || targetBlock;
                    if (btn) openBlogStory(btn, false);
                }
            }
        } else {
            // No ID -> Close if open
            if (blogContainer.classList.contains('shown')) {
                closeBlogContainer(false);
            }
        }
    });

    // Check for ID parameter on load
    const params = new URLSearchParams(window.location.search);
    const initialId = params.get('id');
    if (initialId) {
        const targetBlock = document.querySelector(`.story-block[data-id="${initialId}"], .featured-story-container[data-id="${initialId}"]`);
        if (targetBlock) {
            // Find the read-story button inside it
            const btn = targetBlock.querySelector('#read-story, .read-story') || targetBlock;
            if (btn) {
                // If it's a featured story, make sure to show the section if it was hidden by search (though on load it should be visible unless filter applied instantly)
                // Just trigger click
                openBlogStory(btn, false);
            }
        }
    }


    // Handle scroll to make blog-container full width when it hits the top
    if (blogInner && blogContainer) {
        const bcNavbar = document.querySelector('.bc-navbar');
        const bcCloseButton = document.querySelector('.bc-close-button');

        let navbarStickyScrollStart = null;

        // Function to update navbar progress bar width based on scroll
        function updateNavbarProgressBar() {
            const bciHead = blogContainer.querySelector('.bci-head');
            if (!bciHead) return;

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

        let isScrollTicking = false;

        blogContainer.addEventListener('scroll', () => {
            if (!isScrollTicking) {
                window.requestAnimationFrame(() => {
                    const bciHead = blogContainer.querySelector('.bci-head');
                    const blogTitle = blogContainer.querySelector('.blog-title');
                    const blogInnerRight = blogContainer.querySelector('.sic-right');

                    // Update navbar progress bar
                    updateNavbarProgressBar();

                    // Update sidebar navigation selection
                    updateNavOnScroll();

                    const rect = blogInner.getBoundingClientRect();
                    if (rect.top <= 0) {
                        // blog-container has reached the top, make it full width
                        blogInner.style.width = '100%';
                        blogInner.style.marginLeft = '0';
                        blogInner.style.marginRight = '0';
                        blogInner.style.borderRadius = '0';
                        if (bciHead) bciHead.style.borderRadius = '0';
                        if (blogTitle) blogTitle.style.fontSize = '3em';
                        if (blogInnerRight) blogInnerRight.classList.add('shown');
                    } else {
                        // blog-container is not at the top, reset to original width
                        blogInner.style.width = '';
                        blogInner.style.marginLeft = '';
                        blogInner.style.marginRight = '';
                        blogInner.style.borderRadius = '';
                        if (bciHead) bciHead.style.borderRadius = '';
                        if (blogTitle) blogTitle.style.fontSize = '';
                        if (blogInnerRight) blogInnerRight.classList.remove('shown');
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

                            // Show side nav if available
                            if (navMenu && typeof blogHeaders !== 'undefined' && blogHeaders.length > 0) {
                                // Only auto-expand if it wasn't already active (first appearance)
                                if (!navMenu.classList.contains('active')) {
                                    navMenu.classList.add('shown');
                                }
                                navMenu.classList.add('active');
                            }
                        } else {
                            // bci-head is still visible, reset navbar
                            bcNavbar.style.top = '-71px';
                            bcNavbar.style.position = 'absolute';
                            bcCloseButton.style.top = '20px';
                            bcCloseButton.style.width = '40px';
                            bcCloseButton.style.height = '40px';

                            // Hide side nav
                            if (navMenu) {
                                navMenu.classList.remove('active', 'shown');
                            }
                        }
                    }

                    isScrollTicking = false;
                });

                isScrollTicking = true;
            }
        });



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
        function closeBlogContainer(updateHistory = true) {
            blogContainer.scrollTop = 0;
            blogContainer.classList.remove('shown');
            document.body.style.overflow = '';

            // Clean up sidebar menu
            if (navMenu) navMenu.classList.remove('active', 'shown');

            // Clean up URL
            currentBlogId = null;
            if (updateHistory) {
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('id');
                window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            }
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
            let blogUrl = window.location.href;

            if (currentBlogId) {
                const urlObj = new URL(window.location.origin + window.location.pathname);
                urlObj.searchParams.set('id', currentBlogId);
                blogUrl = urlObj.toString();
            }

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

    // Handle back-to-top in blog container
    const bcBackToTopBtn = document.getElementById('bc-back-to-top');

    if (blogContainer && bcBackToTopBtn) {
        // Show/hide button on scroll
        blogContainer.addEventListener('scroll', () => {
            // Show only when side nav is active and navbar is visible (sticky)
            const isNavActive = navMenu && navMenu.classList.contains('active');
            const isNavbarSeen = bcNavbar && bcNavbar.style.top === '0';

            if (isNavActive && isNavbarSeen) {
                bcBackToTopBtn.classList.add('visible');
            } else {
                bcBackToTopBtn.classList.remove('visible');
            }
        });

        // Scroll to top on click
        bcBackToTopBtn.addEventListener('click', () => {
            blogContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            blogInner.style.top = '0';
        });
    }
});

