// This script handles the splash screen effect for all pages.

// Wait until the entire page, including all resources like images and scripts, is fully loaded.
window.addEventListener('load', () => {
    // Find the splash screen element in the HTML.
    const splashScreen = document.getElementById('splash-screen');

    // Check if the splash screen element exists to avoid errors.
    if (splashScreen) {
        // Add the 'splash-hidden' class to the splash screen.
        // This will trigger the fade-out animation defined in style.css.
        splashScreen.classList.add('splash-hidden');

        // To ensure the splash screen doesn't interfere with the page after it's hidden,
        // we set its display to 'none' after the animation is complete (700ms).
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 700); // This duration should match the transition time in style.css
    }
});
