// Transform-based scroll snap system
const scrollContainer = document.getElementById('scroll-container');
const scrollContent = document.getElementById('scroll-content');
const sections = document.querySelectorAll('#scroll-container .section');

let scrollY = 0;
let currentSectionIndex = 0;
let isSnapping = false;
let viewportHeight = 0;

// Initialize viewport height on load
function initializeViewport() {
    viewportHeight = scrollContainer.clientHeight;
}

// Get section heights
function getSectionHeights() {
    return Array.from(sections).map(section => section.offsetHeight);
}

// Get total document height
function getTotalHeight() {
    return getSectionHeights().reduce((a, b) => a + b, 0);
}

// Snap to section
function snapToSection(direction) {
    if (isSnapping) return;
    
    if (direction === 'down') {
        if (currentSectionIndex < sections.length - 1) {
            currentSectionIndex++;
        } else {
            return;
        }
    } else if (direction === 'up') {
        if (currentSectionIndex > 0) {
            currentSectionIndex--;
        } else {
            return;
        }
    }
    
    // Calculate scroll position for current section
    const sectionHeights = getSectionHeights();
    const targetScroll = sectionHeights.slice(0, currentSectionIndex).reduce((a, b) => a + b, 0);
    
    isSnapping = true;
    animateToScroll(targetScroll);
}

// Navigate to section by ID (for external navigation like image clicks)
function navigateToSectionById(sectionId) {
    if (isSnapping) return;
    
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;
    
    // Find the index of the target section
    const sectionArray = Array.from(sections);
    const targetIndex = sectionArray.findIndex(section => section.id === sectionId);
    
    if (targetIndex === -1) return;
    
    currentSectionIndex = targetIndex;
    
    // Calculate scroll position for target section
    const sectionHeights = getSectionHeights();
    const targetScroll = sectionHeights.slice(0, targetIndex).reduce((a, b) => a + b, 0);
    
    isSnapping = true;
    animateToScroll(targetScroll);
}

// Animate scroll to target position
function animateToScroll(targetScroll) {
    const startScroll = scrollY;
    const distance = targetScroll - startScroll;
    const duration = 600;
    const startTime = Date.now();
    
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeInOutCubic(progress);
        
        scrollY = startScroll + distance * easeProgress;
        updateScroll();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            scrollY = targetScroll;
            updateScroll();
            isSnapping = false;
        }
    }
    
    animate();
}

// Update scroll position and transform sections
function updateScroll() {
    // Clamp scroll value to max scrollable area
    const totalHeight = getTotalHeight();
    const maxScroll = Math.max(0, totalHeight - viewportHeight);
    scrollY = Math.max(0, Math.min(scrollY, maxScroll));
    
    // Apply transform to the inner content wrapper (not the fixed container)
    scrollContent.style.transform = `translateY(-${scrollY}px)`;
    
    // Track which section is active
    let currentPosition = scrollY;
    const sectionHeights = getSectionHeights();
    let sectionStart = 0;
    
    sections.forEach((section, index) => {
        const sectionEnd = sectionStart + sectionHeights[index];
        
        if (currentPosition >= sectionStart && currentPosition < sectionEnd) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
        
        sectionStart = sectionEnd;
    });
}

// Handle wheel scroll
document.addEventListener('wheel', (e) => {
    if (isSnapping) {
        e.preventDefault();
        return;
    }
    
    e.preventDefault();
    
    if (e.deltaY > 0) {
        snapToSection('down');
    } else {
        snapToSection('up');
    }
}, { passive: false });

// Handle touch scroll
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (isSnapping) {
        e.preventDefault();
        return;
    }
    
    e.preventDefault();
    const touchEndY = e.touches[0].clientY;
    const delta = touchStartY - touchEndY;
    
    if (Math.abs(delta) > 30) {
        if (delta > 0) {
            snapToSection('down');
        } else {
            snapToSection('up');
        }
        touchStartY = touchEndY;
    }
}, { passive: false });

// Handle keyboard scroll
document.addEventListener('keydown', (e) => {
    if (isSnapping) return;
    
    if (e.key === 'ArrowDown') {
        snapToSection('down');
    } else if (e.key === 'ArrowUp') {
        snapToSection('up');
    }
}, { passive: true });

// Initialize
window.addEventListener('load', () => {
    initializeViewport();
    updateScroll();
    initializeBackToTopButton();
});

window.addEventListener('resize', () => {
    initializeViewport();
    updateScroll();
});

// Back to top button functionality
function initializeBackToTopButton() {
    const backToTopButton = document.getElementById('back-to-top');
    if (!backToTopButton) return;
    
    // Show/hide button based on scroll position
    function updateBackToTopVisibility() {
        if (currentSectionIndex > 0) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    }
    
    // Handle back to top button click
    backToTopButton.addEventListener('click', () => {
        currentSectionIndex = 0;
        const targetScroll = 0;
        isSnapping = true;
        animateToScroll(targetScroll);
    });
    
    // Update button visibility whenever scroll changes
    const originalUpdateScroll = window.updateScroll;
    window.updateScroll = function() {
        originalUpdateScroll.call(this);
        updateBackToTopVisibility();
    };
}

// Track which image currently has popup open
let currentHoveredImage = null;
let popupDebounce = false;
let mouseLeaveTimeout = null;

// Image popup functionality
function createImagePopup(imageSrc, galleryItem) {
    console.log('createImagePopup called with:', imageSrc);
    if (popupDebounce) return;
    
    // Remove any existing popup
    const existingPopup = document.getElementById('image-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Get gallery item's position
    const rect = galleryItem.getBoundingClientRect();
    
    // Create popup container anchored to gallery item
    const popup = document.createElement('div');
    popup.id = 'image-popup';
    popup.style.cssText = `
        position: fixed;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 20px;
        padding: 10px;
        max-width: 95vw;
        max-height: 95vh;
        z-index: 999999;
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        pointer-events: auto;
        min-width: 300px;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 16px;
        pointer-events: none;
    `;
    
    popup.appendChild(img);
    document.body.appendChild(popup);
    
    // Set debounce flag immediately
    popupDebounce = true;
    
    // Wait for image to load before positioning
    function positionPopup() {
        // Get image dimensions
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        // Calculate aspect ratio
        const aspectRatio = imgWidth / imgHeight;
        
        // Calculate max available space (95% of viewport minus padding)
        const maxWidth = window.innerWidth * 0.45 ; // 10px padding on each side
        const maxHeight = window.innerHeight * 0.45 ; // 10px padding on each side
        
        let popupWidth = maxWidth;
        let popupHeight = popupWidth / aspectRatio;
        
        // If height exceeds max, scale down by height instead
        if (popupHeight > maxHeight) {
            popupHeight = maxHeight;
            popupWidth = popupHeight * aspectRatio;
        }
        
        // Center in bottom left corner
        const heroHeight = window.innerHeight * 0.5; // Hero section is 50% height
        const availableHeight = window.innerHeight - heroHeight; // Remaining space below hero
        const topPosition = heroHeight + (availableHeight - popupHeight) / 2;
        const leftPosition = (window.innerWidth * 0.5 - popupWidth) / 2; // Center in left half
        
        popup.style.width = `${popupWidth}px`;
        popup.style.height = `${popupHeight}px`;
        popup.style.top = `${topPosition}px`;
        popup.style.left = `${leftPosition}px`;
        popup.style.opacity = '1';
        popup.style.visibility = 'visible';
    }
    
    // If image is already cached/loaded
    if (img.complete) {
        positionPopup();
    } else {
        // Wait for image to load
        img.addEventListener('load', positionPopup);
        img.addEventListener('error', () => {
            // If image fails to load, still position popup
            positionPopup();
        });
    }
    
    // Temporarily disable pointer-events on gallery item
    galleryItem.style.pointerEvents = 'none';
    
    // Re-enable pointer-events and reset debounce quickly
    setTimeout(() => {
        if (galleryItem && document.body.contains(galleryItem)) {
            galleryItem.style.pointerEvents = 'auto';
        }
        popupDebounce = false;
    }, 50);
    
    // Close popup on click
    popup.addEventListener('click', () => {
        popup.remove();
        currentHoveredImage = null;
    });
    
    // Close popup on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && document.getElementById('image-popup')) {
            document.getElementById('image-popup').remove();
            currentHoveredImage = null;
            galleryItem.style.pointerEvents = 'auto';
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Initialize immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeViewport();
        updateScroll();
        // Attach gallery hover listeners after DOM is ready
        attachGalleryListeners();
    });
} else {
    initializeViewport();
    updateScroll();
    // Attach gallery hover listeners immediately
    attachGalleryListeners();
}

// Function to attach gallery hover listeners
function attachGalleryListeners() {
    if (!scrollContent) return;
    
    console.log('Gallery listeners attached');
    
    // Create wrapper divs for each gallery item
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'gallery-item-wrapper';
        wrapper.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 16px;
        `;
        item.parentElement.insertBefore(wrapper, item);
        wrapper.appendChild(item);
    });
    
    // Get all gallery containers
    const galleryContainers = document.querySelectorAll('.gallery-container');
    
    galleryContainers.forEach(container => {
        container.addEventListener('mouseleave', (e) => {
            console.log('mouseleave on gallery container');
            if (mouseLeaveTimeout) {
                clearTimeout(mouseLeaveTimeout);
            }
            mouseLeaveTimeout = setTimeout(() => {
                const popup = document.getElementById('image-popup');
                if (popup) {
                    console.log('Removing popup - mouse left gallery container');
                    popup.remove();
                }
                if (currentHoveredImage) {
                    // Restore image opacity and remove overlay
                    currentHoveredImage.style.opacity = '1';
                    const overlay = currentHoveredImage.parentElement.querySelector('.gallery-item-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                    currentHoveredImage.style.pointerEvents = 'auto';
                    currentHoveredImage = null;
                }
                mouseLeaveTimeout = null;
            }, 200);
        });
    });
    
    // Mouseenter on individual items
    const itemsToAttachListeners = document.querySelectorAll('.gallery-item');
    
    itemsToAttachListeners.forEach(item => {
        item.addEventListener('mouseenter', (e) => {
            console.log('mouseenter on gallery item:', e.target.src);
            if (mouseLeaveTimeout) {
                clearTimeout(mouseLeaveTimeout);
                mouseLeaveTimeout = null;
            }
            
            // Clear all existing overlays and reset opacity
            document.querySelectorAll('.gallery-item-overlay').forEach(overlay => {
                overlay.remove();
            });
            document.querySelectorAll('.gallery-item').forEach(img => {
                img.style.opacity = '1';
            });
            
            // Grey out the image at 20% opacity and show alt text
            const altText = e.target.getAttribute('alt') || 'Image';
            e.target.style.opacity = '0.2';
            e.target.style.position = 'relative';
            
            // Create overlay with alt text
            const overlay = document.createElement('div');
            overlay.className = 'gallery-item-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.4);
                color: white;
                font-size: 0.875rem;
                font-weight: 500;
                text-align: center;
                padding: 1rem;
                border-radius: 16px;
                pointer-events: none;
                word-wrap: break-word;
                overflow: hidden;
            `;
            overlay.textContent = altText;
            e.target.parentElement.appendChild(overlay);
            e.target.dataset.overlay = 'true';
            
            currentHoveredImage = e.target;
            createImagePopup(e.target.src, e.target);
        });
    });
    
    // Keep popup open when mouse is over it
    document.addEventListener('mouseover', (e) => {
        if (e.target.id === 'image-popup' || e.target.closest('#image-popup')) {
            if (mouseLeaveTimeout) {
                clearTimeout(mouseLeaveTimeout);
                mouseLeaveTimeout = null;
            }
        }
    });
}

