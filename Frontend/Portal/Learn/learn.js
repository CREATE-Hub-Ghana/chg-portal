// Resource Search Filter - Optimized and Robust Implementation
const resourceSearchFilter = document.querySelector('.resource-search-filter');
const rsfContainer = document.querySelector('.rsf-container');
const filterTypes = document.querySelectorAll('.filter-type');
const filterSpan = resourceSearchFilter.querySelector('span');

let isFilterOpen = false;

// Toggle filter dropdown
function toggleFilter(open) {
    const shouldOpen = open !== undefined ? open : !isFilterOpen;

    if (shouldOpen === isFilterOpen) return; // Prevent redundant operations

    isFilterOpen = shouldOpen;
    rsfContainer.classList.toggle('shown', shouldOpen);

    const borderColor = shouldOpen ? '#7c3aed' : '';
    resourceSearchFilter.style.borderColor = borderColor;
    resourceSearchFilter.style.outlineColor = borderColor;

    // Focus management
    if (shouldOpen) {
        // Focus first selected item or first item when opened
        const selectedFilter = rsfContainer.querySelector('.filter-type.selected') || filterTypes[0];
        if (selectedFilter) {
            requestAnimationFrame(() => selectedFilter.focus());
        }
    } else {
        // Return focus to button when closed
        resourceSearchFilter.focus();
    }
}

// Open/close filter
resourceSearchFilter.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFilter();
});

// Optimized filter selection
function selectFilter(filter) {
    if (!filter || filter.classList.contains('selected')) return; // Skip if already selected

    // Batch DOM updates
    requestAnimationFrame(() => {
        // Remove selected class from all filters
        filterTypes.forEach(f => {
            if (f !== filter) f.classList.remove('selected');
        });

        // Add selected class to clicked filter
        filter.classList.add('selected');

        // Update button text
        const filterText = filter.querySelector('span')?.textContent;
        if (filterText) {
            filterSpan.textContent = filterText;
        }

        // Close dropdown
        toggleFilter(false);
    });
}

// Delegated event handling for better performance
rsfContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    const filterType = e.target.closest('.filter-type');
    if (filterType) {
        selectFilter(filterType);
    }
});

// Keyboard navigation with proper ARIA support
rsfContainer.addEventListener('keydown', (e) => {
    const currentFilter = e.target.closest('.filter-type');
    if (!currentFilter) return;

    const currentIndex = Array.from(filterTypes).indexOf(currentFilter);
    let targetIndex = currentIndex;
    let handled = false;

    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            selectFilter(currentFilter);
            handled = true;
            break;

        case 'ArrowDown':
            e.preventDefault();
            targetIndex = Math.min(currentIndex + 1, filterTypes.length - 1);
            handled = true;
            break;

        case 'ArrowUp':
            e.preventDefault();
            targetIndex = Math.max(currentIndex - 1, 0);
            handled = true;
            break;

        case 'Home':
            e.preventDefault();
            targetIndex = 0;
            handled = true;
            break;

        case 'End':
            e.preventDefault();
            targetIndex = filterTypes.length - 1;
            handled = true;
            break;

        case 'Escape':
            e.preventDefault();
            toggleFilter(false);
            handled = true;
            break;

        case 'Tab':
            // Allow natural tab behavior but close dropdown
            toggleFilter(false);
            break;
    }

    // Focus target if index changed
    if (handled && targetIndex !== currentIndex && filterTypes[targetIndex]) {
        filterTypes[targetIndex].focus();
    }
});

// Make search filter keyboard accessible
resourceSearchFilter.setAttribute('role', 'button');
resourceSearchFilter.setAttribute('aria-haspopup', 'listbox');
resourceSearchFilter.setAttribute('aria-expanded', 'false');
resourceSearchFilter.setAttribute('tabindex', '0');

// Update ARIA expanded state
const observer = new MutationObserver(() => {
    const isShown = rsfContainer.classList.contains('shown');
    resourceSearchFilter.setAttribute('aria-expanded', isShown.toString());
});
observer.observe(rsfContainer, { attributes: true, attributeFilter: ['class'] });

resourceSearchFilter.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFilter();
    } else if (e.key === 'ArrowDown' && !isFilterOpen) {
        e.preventDefault();
        toggleFilter(true);
    } else if (e.key === 'Escape' && isFilterOpen) {
        e.preventDefault();
        toggleFilter(false);
    }
});

// Optimized click outside handler with debounce
let closeTimeout;
document.addEventListener('click', (e) => {
    if (!isFilterOpen) return;

    if (!resourceSearchFilter.contains(e.target) && !rsfContainer.contains(e.target)) {
        clearTimeout(closeTimeout);
        closeTimeout = setTimeout(() => toggleFilter(false), 0);
    }
}, true); // Use capture phase for better performance

// Escape key handler
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFilterOpen) {
        e.preventDefault();
        toggleFilter(false);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    observer.disconnect();
    clearTimeout(closeTimeout);
});


// Grid/List Toggle Functionality
const gridBtn = document.querySelector('.grid-btn');
const listBtn = document.querySelector('.list-btn');
const activeGl = document.querySelector('.active-gl');
const activeGlSpan = activeGl.querySelector('span');
const activeGlImg = activeGl.querySelector('img');

// When list button is clicked
listBtn.addEventListener('click', () => {

    // activeGl.style.right = '5px';
    activeGl.style.left = '55px';

    // Change inner span content from Grid to List
    activeGlSpan.textContent = 'List';

    // Set img src
    activeGlImg.src = '../../Universal/Icons/list_purple_1.svg';
});

// When grid button is clicked
gridBtn.addEventListener('click', () => {

    activeGl.style.left = '5px';
    // activeGl.style.right = 'auto';

    // Change inner span content back to Grid
    activeGlSpan.textContent = 'Grid';

    // Set img src
    activeGlImg.src = '../../Universal/Icons/grid_purple.svg';
});

// When hovering over active-gl
activeGl.addEventListener('mouseenter', () => {
    // Set inner span display to none
    activeGlSpan.style.opacity = '0';

    // Set img to flex
    activeGlImg.style.opacity = '1';
});

// When leaving hover on active-gl
activeGl.addEventListener('mouseleave', () => {
    // Set inner span display back to flex
    activeGlSpan.style.opacity = '1';

    // Set img display back to its default (flex)
    activeGlImg.style.opacity = '0';
});