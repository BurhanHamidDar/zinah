// Temporary debugging version of app.js - NO SECURITY RESTRICTIONS
// Use this ONLY for debugging the checkout issue, then restore the original app.js

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

            // Initialize core components
            await this.initializeCore();
            
            // Initialize page-specific functionality
            this.initializePageSpecific();
            
            // Set up global event listeners (NO SECURITY)
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
        
        // Initialize contact form if present
        this.initializeContactForm();
        
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
    }

    initializeCheckoutPage() {
        // Checkout page is handled by CheckoutManager
        console.log('Checkout page detected');
    }

    initializeAdminPage() {
        // Admin page functionality
        console.log('Admin page detected');
    }

    // Initialize contact form
    initializeContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleContactFormSubmit(e.target);
            });
        }
    }

    // Handle contact form submission
    async handleContactFormSubmit(form) {
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            const formData = new FormData(form);
            const contactData = {
                name: formData.get('contact-name'),
                email: formData.get('contact-email'),
                message: formData.get('contact-message')
            };
            
            // Validate form data
            if (!contactData.name || !contactData.email || !contactData.message) {
                throw new Error('Please fill in all fields');
            }
            
            if (!CONFIG.VALIDATION.EMAIL_REGEX.test(contactData.email)) {
                throw new Error('Please enter a valid email address');
            }
            
            // Submit to Supabase
            const result = await supabaseService.submitContactForm(contactData);
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                form.reset();
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('Error submitting contact form:', error);
            this.showNotification(error.message || CONFIG.MESSAGES.CONTACT_ERROR, 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
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

    // Setup global event listeners (NO SECURITY RESTRICTIONS)
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
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
        
        // Keyboard shortcuts (NO RESTRICTIONS)
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
        this.showNotification(message, 'error');
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

// Initialize the application
window.app = new App();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
