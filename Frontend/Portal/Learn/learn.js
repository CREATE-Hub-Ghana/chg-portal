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

// Resource Search Filter Toggle
const resourceSearchFilter = document.querySelector('.resource-search-filter');
const rsfContainer = document.querySelector('.rsf-container');

resourceSearchFilter.addEventListener('click', () => {
    rsfContainer.classList.toggle('shown');

    if (rsfContainer.classList.contains('shown')) {
        resourceSearchFilter.style.borderColor = '#7c3aed';
        resourceSearchFilter.style.outlineColor = '#7c3aed';
    } else {
        resourceSearchFilter.style.borderColor = '';
        resourceSearchFilter.style.outlineColor = '';
    }
});