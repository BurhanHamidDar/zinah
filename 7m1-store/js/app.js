// Main application entry point for 7M1 Store

class App {
    constructor() {
        this.initialized = false;
        this.components = {};
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                await this.initialize();
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showErrorMessage('Failed to initialize application');
        }
    }

    async initialize() {
        try {
            console.log('Initializing 7M1 Store...');

            // Initialize security features first (disabled for contact form testing)
            // this.initializeSecurity();
            
            // Initialize core components
            await this.initializeCore();
            
            // Initialize page-specific functionality
            this.initializePageSpecific();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize UI enhancements
            this.initializeUI();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('7M1 Store initialized successfully');
            
            // Trigger custom event for other scripts
            document.dispatchEvent(new CustomEvent('appInitialized'));

        } catch (error) {
            console.error('Error during app initialization:', error);
            this.showErrorMessage('Application failed to start properly');
        }
    }

    async initializeCore() {
        // Core services are initialized by their respective files
        // We just need to wait for them to be ready
        
        await this.waitForGlobal('CONFIG', 5000);
        await this.waitForGlobal('supabaseService', 5000);
        
        // Contact form removed
        
        // Initialize mobile menu
        this.initializeMobileMenu();
        
        // Initialize smooth scrolling
        this.initializeSmoothScrolling();
        
        // Initialize theme handling
        this.initializeTheme();
    }

    initializePageSpecific() {
        const path = window.location.pathname;
        
        // Home page specific initialization
        if (path === '/' || path.includes('index.html') || path === '') {
            this.initializeHomePage();
        }
        
        // Checkout page specific initialization
        if (path.includes('checkout.html')) {
            this.initializeCheckoutPage();
        }
        
        // Admin page specific initialization
        if (path.includes('admin')) {
            this.initializeAdminPage();
        }
    }

    initializeHomePage() {
        // Add any home page specific functionality
        this.setupScrollToTop();
        this.setupNewsletterSubscription();
        this.initializeHeroSlideshow();
    }

    initializeCheckoutPage() {
        // Checkout page is handled by CheckoutManager
        console.log('Checkout page detected');
    }

    initializeAdminPage() {
        // Admin page functionality
        console.log('Admin page detected');
    }


    // Initialize mobile menu
    initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                navMenu.classList.toggle('mobile-open');
                mobileMenuBtn.classList.toggle('active');
                
                // Toggle hamburger icon
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });
            
            // Close mobile menu when clicking on a link
            navMenu.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    navMenu.classList.remove('mobile-open');
                    mobileMenuBtn.classList.remove('active');
                    
                    const icon = mobileMenuBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            });
        }
    }

    // Initialize smooth scrolling for anchor links
    initializeSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.length > 1) {
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        
                        // Update URL without triggering scroll
                        history.pushState(null, null, href);
                    }
                }
            });
        });
    }

    // Initialize theme handling
    initializeTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Add theme toggle if needed
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                this.setTheme(newTheme);
            });
        }
    }

    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icon if present
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }
    
    // Initialize comprehensive security features
    initializeSecurity() {
        // Disable right-click context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Disable text selection
        document.addEventListener('selectstart', (e) => {
            // Allow in input fields and textareas
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return true;
            }
            e.preventDefault();
            return false;
        });
        
        // Disable drag and drop
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Comprehensive keyboard shortcuts blocking
        document.addEventListener('keydown', (e) => {
            // Developer tools shortcuts
            const blockedKeys = [
                'F12',
                'F11' // Disable fullscreen too
            ];
            
            if (blockedKeys.includes(e.key)) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl/Cmd combinations
            if (e.ctrlKey || e.metaKey) {
                const ctrlBlocked = [
                    'u', // View source
                    's', // Save page
                    'p', // Print
                    'j', // Console (Chrome)
                    'r', // Refresh (will allow normal refresh but block hard refresh)
                    'f', // Find in page
                    'g', // Find next
                    'h', // History
                    'y', // Redo
                    'z'  // Undo (except in input fields)
                ];
                
                // Special handling for Shift combinations
                if (e.shiftKey) {
                    const ctrlShiftBlocked = [
                        'I', // Developer tools
                        'J', // Console
                        'C', // Inspect element
                        'K', // Console (Firefox)
                        'R'  // Hard refresh
                    ];
                    
                    if (ctrlShiftBlocked.includes(e.key)) {
                        e.preventDefault();
                        return false;
                    }
                }
                
                // Handle single Ctrl combinations
                if (ctrlBlocked.includes(e.key.toLowerCase())) {
                    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z in input fields
                    if (['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) {
                        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                            return true;
                        }
                    }
                    
                    e.preventDefault();
                    return false;
                }
            }
        });
        
        // Console protection and warnings
        this.setupConsoleProtection();
        
        // DevTools detection
        this.setupDevToolsDetection();
        
        // Image protection
        this.setupImageProtection();
        
        console.log('🔒 Security features initialized');
    }
    
    // Setup console protection
    setupConsoleProtection() {
        // Clear console and show warnings
        console.clear();
        
        const warningStyle = 'color: red; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);';
        const infoStyle = 'color: #3498db; font-size: 14px; font-weight: bold;';
        const alertStyle = 'color: red; font-size: 12px;';
        
        console.log('%c🛡️ SECURITY ALERT!', warningStyle);
        console.log('%c' + '='.repeat(50), 'color: red;');
        console.log('%cThis is a browser feature intended for developers only.', alertStyle);
        console.log('%cIf someone told you to copy-paste something here,', alertStyle);
        console.log('%cit could be a scam to steal your information!', alertStyle);
        console.log('%c' + '='.repeat(50), 'color: red;');
        console.log('%c7M1 Store - Unauthorized access prohibited', infoStyle);
        console.log('%cVisit our website: https://7m1store.in', 'color: green;');
        
        // Override console methods to show warnings
        const originalLog = console.log;
        console.log = function(...args) {
            originalLog('%c⚠️ Console access detected!', 'color: red; font-weight: bold;');
            originalLog(...args);
        };
    }
    
    // Setup DevTools detection
    setupDevToolsDetection() {
        let devtools = { open: false };
        
        // Method 1: Window size detection
        setInterval(() => {
            const heightThreshold = window.outerHeight - window.innerHeight > 200;
            const widthThreshold = window.outerWidth - window.innerWidth > 200;
            
            if ((heightThreshold || widthThreshold) && !devtools.open) {
                devtools.open = true;
                this.handleDevToolsOpen();
            } else if (!heightThreshold && !widthThreshold && devtools.open) {
                devtools.open = false;
            }
        }, 500);
        
        // Method 2: Console detection (Chrome/Firefox)
        let checkElement = new Image();
        Object.defineProperty(checkElement, 'id', {
            get: () => {
                this.handleDevToolsOpen();
                throw new Error('DevTools detected!');
            }
        });
        
        setInterval(() => {
            try {
                console.log(checkElement);
            } catch (e) {
                // DevTools detected
            }
        }, 1000);
    }
    
    // Handle DevTools opening
    handleDevToolsOpen() {
        console.clear();
        console.log('%c🚫 Developer Tools Detected!', 'color: red; font-size: 24px; font-weight: bold;');
        console.log('%cFor security reasons, this action has been logged.', 'color: red; font-size: 14px;');
        console.log('%cUnauthorized access attempts are monitored.', 'color: red; font-size: 14px;');
        
        // Optional: You can add more strict measures here
        // document.body.style.display = 'none';
        // location.href = 'about:blank';
    }
    
    // Setup image protection
    setupImageProtection() {
        // Disable image dragging
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        });
        
        // Apply protection to existing and future images
        const protectImages = () => {
            document.querySelectorAll('img').forEach(img => {
                img.oncontextmenu = () => false;
                img.ondragstart = () => false;
                img.onselectstart = () => false;
                img.onmousedown = () => false;
            });
        };
        
        // Protect existing images
        protectImages();
        
        // Protect dynamically added images
        const observer = new MutationObserver(protectImages);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Setup scroll to top functionality
    setupScrollToTop() {
        // Create scroll to top button
        const scrollBtn = document.createElement('button');
        scrollBtn.id = 'scroll-to-top';
        scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        scrollBtn.className = 'scroll-to-top-btn';
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 1000;
            display: none;
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(scrollBtn);
        
        // Show/hide scroll button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.style.display = 'flex';
                scrollBtn.style.alignItems = 'center';
                scrollBtn.style.justifyContent = 'center';
            } else {
                scrollBtn.style.display = 'none';
            }
        });
        
        // Scroll to top when clicked
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Setup newsletter subscription
    setupNewsletterSubscription() {
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = e.target.querySelector('input[type="email"]').value;
                
                if (!CONFIG.VALIDATION.EMAIL_REGEX.test(email)) {
                    this.showNotification('Please enter a valid email address', 'error');
                    return;
                }
                
                // Simulate newsletter subscription
                this.showNotification('Thank you for subscribing to our newsletter!', 'success');
                e.target.reset();
            });
        }
    }

    // Initialize hero slideshow
    initializeHeroSlideshow() {
        console.log('🎬 Starting slideshow initialization...');
        
        // Wait for DOM elements to be available
        setTimeout(() => {
            this.setupHeroSlideshow();
        }, 100);
    }
    
    setupHeroSlideshow() {
        const slides = document.querySelectorAll('#hero-slideshow .slide');
        const indicators = document.querySelectorAll('#hero-slideshow .indicator');
        
        if (slides.length === 0) {
            console.error('❌ No slideshow slides found!');
            return;
        }
        
        console.log('✅ Found', slides.length, 'slides and', indicators.length, 'indicators');
        
        this.heroSlideshow = {
            currentSlide: 0,
            slides: slides,
            indicators: indicators,
            autoPlayInterval: null,
            autoPlayDelay: 4000 // 4 seconds
        };
        
        // Ensure first slide is active
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === 0);
        });
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === 0);
        });
        
        this.setupSlideshowControls();
        
        // Start slideshow after a short delay
        setTimeout(() => {
            this.startSlideshow();
            console.log('✅ Slideshow auto-play started');
        }, 1000);
        
        console.log('✅ Slideshow setup complete');
    }
    
    // Setup slideshow controls
    setupSlideshowControls() {
        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.goToPreviousSlide();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.goToNextSlide();
            });
        }
        
        // Indicator clicks
        this.heroSlideshow.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });
        
        // Hover pause/resume
        const slideshowContainer = document.getElementById('hero-slideshow');
        if (slideshowContainer) {
            slideshowContainer.addEventListener('mouseenter', () => {
                this.pauseSlideshow();
            });
            
            slideshowContainer.addEventListener('mouseleave', () => {
                this.startSlideshow();
            });
        }
    }
    
    
    // Update slideshow images
    updateSlideshowImages(images) {
        if (!images || images.length === 0) {
            console.warn('No images provided to updateSlideshowImages');
            return;
        }
        
        console.log('Updating slideshow images:', images);
        
        const slideshowContainer = document.querySelector('.slideshow-container');
        const indicatorsContainer = document.querySelector('.slideshow-indicators');
        
        if (!slideshowContainer) {
            console.warn('Slideshow container not found');
            return;
        }
        
        // Clear existing slides
        slideshowContainer.innerHTML = '';
        
        // Create new slides
        images.forEach((imageUrl, index) => {
            const slide = document.createElement('div');
            slide.className = index === 0 ? 'slide active' : 'slide';
            slide.id = `slide-${index + 1}`;
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Product showcase ${index + 1}`;
            img.loading = 'lazy';
            
            slide.appendChild(img);
            slideshowContainer.appendChild(slide);
        });
        
        // Update slides reference
        this.heroSlideshow.slides = document.querySelectorAll('.hero-slideshow .slide');
        
        // Update indicators
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = '';
            
            images.forEach((_, index) => {
                const indicator = document.createElement('span');
                indicator.className = index === 0 ? 'indicator active' : 'indicator';
                indicator.setAttribute('data-slide', index.toString());
                indicator.addEventListener('click', () => this.goToSlide(index));
                indicatorsContainer.appendChild(indicator);
            });
            
            // Update indicators reference
            this.heroSlideshow.indicators = document.querySelectorAll('.hero-slideshow .indicator');
        }
        
        // Reset current slide
        this.heroSlideshow.currentSlide = 0;
        
        console.log('Slideshow updated successfully with', images.length, 'images');
    }
    
    
    // Go to specific slide
    goToSlide(slideIndex) {
        if (!this.heroSlideshow?.slides?.length) {
            console.warn('No slideshow slides available');
            return;
        }
        
        console.log('🎢 Going to slide', slideIndex + 1, 'of', this.heroSlideshow.slides.length);
        
        // Remove active from current
        this.heroSlideshow.slides[this.heroSlideshow.currentSlide]?.classList.remove('active');
        this.heroSlideshow.indicators[this.heroSlideshow.currentSlide]?.classList.remove('active');
        
        // Update current slide
        this.heroSlideshow.currentSlide = slideIndex;
        
        // Add active to new
        this.heroSlideshow.slides[this.heroSlideshow.currentSlide]?.classList.add('active');
        this.heroSlideshow.indicators[this.heroSlideshow.currentSlide]?.classList.add('active');
    }
    
    // Go to next slide
    goToNextSlide() {
        const nextIndex = (this.heroSlideshow.currentSlide + 1) % this.heroSlideshow.slides.length;
        this.goToSlide(nextIndex);
    }
    
    // Go to previous slide
    goToPreviousSlide() {
        const prevIndex = (this.heroSlideshow.currentSlide - 1 + this.heroSlideshow.slides.length) % this.heroSlideshow.slides.length;
        this.goToSlide(prevIndex);
    }
    
    // Start slideshow auto-play
    startSlideshow() {
        if (!this.heroSlideshow?.slides?.length) {
            console.warn('Cannot start slideshow: no slides available');
            return;
        }
        
        console.log('▶️ Starting slideshow auto-play with', this.heroSlideshow.autoPlayDelay + 'ms interval');
        
        this.pauseSlideshow();
        
        this.heroSlideshow.autoPlayInterval = setInterval(() => {
            console.log('⏰ Auto-advancing slideshow...');
            this.goToNextSlide();
        }, this.heroSlideshow.autoPlayDelay);
        
        console.log('✅ Slideshow interval started:', this.heroSlideshow.autoPlayInterval);
    }
    
    // Pause slideshow auto-play
    pauseSlideshow() {
        if (this.heroSlideshow?.autoPlayInterval) {
            clearInterval(this.heroSlideshow.autoPlayInterval);
            this.heroSlideshow.autoPlayInterval = null;
        }
    }

    // Setup global event listeners
    setupGlobalEventListeners() {
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('Connection lost. Some features may not work.', 'warning');
        });
        
        // Handle errors
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            // Don't show error notifications for every JS error as it can be annoying
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    // Initialize UI enhancements
    initializeUI() {
        // Add loading states to buttons
        this.enhanceButtons();
        
        // Add form validation styling
        this.enhanceFormValidation();
        
        // Add intersection observer for animations
        this.setupScrollAnimations();
        
        // Add image lazy loading
        this.setupLazyLoading();
    }

    // Enhance buttons with loading states
    enhanceButtons() {
        document.querySelectorAll('button[type="submit"]').forEach(btn => {
            if (!btn.hasAttribute('data-enhanced')) {
                btn.setAttribute('data-enhanced', 'true');
                
                btn.addEventListener('click', function() {
                    if (this.form && !this.form.checkValidity()) return;
                    
                    const originalText = this.textContent;
                    const originalHTML = this.innerHTML;
                    
                    // Add loading state
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                    
                    // Restore original state after a delay (form submission will handle this normally)
                    setTimeout(() => {
                        if (this.disabled) {
                            this.disabled = false;
                            this.innerHTML = originalHTML;
                        }
                    }, 5000);
                });
            }
        });
    }

    // Enhance form validation styling
    enhanceFormValidation() {
        document.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('invalid', (e) => {
                e.target.classList.add('error');
            });
            
            field.addEventListener('input', (e) => {
                if (e.target.checkValidity()) {
                    e.target.classList.remove('error');
                    e.target.classList.add('valid');
                } else {
                    e.target.classList.remove('valid');
                }
            });
        });
    }

    // Setup scroll animations
    setupScrollAnimations() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, { threshold: 0.1 });
            
            // Observe elements that should animate in
            document.querySelectorAll('.product-card, .category-card, .feature').forEach(el => {
                observer.observe(el);
            });
        }
    }

    // Setup lazy loading for images
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Close all open modals
    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }

    // Wait for a global variable to be available
    waitForGlobal(globalName, timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (window[globalName]) {
                resolve(window[globalName]);
                return;
            }
            
            const startTime = Date.now();
            const check = () => {
                if (window[globalName]) {
                    resolve(window[globalName]);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for ${globalName}`));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (window.cart) {
            window.cart.showNotification(message, type);
        } else {
            // Fallback notification system
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Create simple notification
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.className = `simple-notification ${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 2rem;
                right: 2rem;
                z-index: 10000;
                padding: 1rem;
                border-radius: 8px;
                color: white;
                background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 3000);
        }
    }

    // Show error message
    showErrorMessage(message) {
        console.error('App Error:', message);
        // Only show error notification on non-checkout pages
        if (!window.location.pathname.includes('checkout.html')) {
            this.showNotification(message, 'error');
        }
    }

    // Get app status
    getStatus() {
        return {
            initialized: this.initialized,
            components: Object.keys(this.components),
            pathname: window.location.pathname,
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize the application only if not on checkout page
if (!window.location.pathname.includes('checkout.html')) {
    window.app = new App();
    console.log('✅ App initialized for non-checkout page');
} else {
    console.log('🛍️ Skipping app initialization on checkout page');
    // Create minimal app object for compatibility
    window.app = {
        initialized: false,
        showNotification: function(message, type = 'info') {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
