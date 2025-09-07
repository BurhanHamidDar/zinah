// Configuration file for 7M1 Store
const CONFIG = {
    // Supabase Configuration
    SUPABASE: {
        URL: 'https://hielkntaggtwhnbhrrix.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZWxrbnRhZ2d0d2huYmhycml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzk0NTMsImV4cCI6MjA3MjcxNTQ1M30.lxa9yaw_vdgdVkeHgml_nGG4xb_jDwMU9TYp9LmPMVY'
    },
    
    // App Settings
    APP: {
        NAME: '7M1 Store',
        VERSION: '1.0.0',
        CURRENCY: 'INR',
        CURRENCY_SYMBOL: '₹',
        ITEMS_PER_PAGE: 12,
        SHIPPING_COST: 25,
        TAX_RATE: 0, // No tax
        FREE_SHIPPING_THRESHOLD: 999 // Free shipping above ₹999
    },
    
    // Payment Settings (India-specific)
    PAYMENT: {
        METHODS: ['cod'], // Cash on Delivery only
        DEFAULT_METHOD: 'cod'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        CART: 'cart_items',
        USER_PREFERENCES: 'user_preferences',
        RECENT_SEARCHES: 'recent_searches',
        WISHLIST: 'wishlist'
    },
    
    // API Endpoints and Settings
    API: {
        PRODUCTS_LIMIT: 20,
        SEARCH_DELAY: 300, // ms
        CACHE_DURATION: 300000 // 5 minutes
    },
    
    // Categories configuration (India-specific)
    CATEGORIES: [
        { 
            id: 1, 
            name: 'Electronics', 
            icon: 'fas fa-laptop',
            image: 'https://tse1.mm.bing.net/th/id/OIP.DHEr9KDxzTs5f_MOTK4FDAHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'
        },
        { 
            id: 2, 
            name: 'Clothing', 
            icon: 'fas fa-tshirt',
            image: 'https://4.imimg.com/data4/QC/HR/MY-17011330/55.jpg'
        },
        { 
            id: 3, 
            name: 'Books', 
            icon: 'fas fa-book',
            image: 'https://tse1.mm.bing.net/th/id/OIP.n1l-X1i3SqBoBvvhh9zh9QHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'
        },
        { 
            id: 4, 
            name: 'Food & Beverages', 
            icon: 'fas fa-utensils',
            image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        },
        { 
            id: 5, 
            name: 'Sports', 
            icon: 'fas fa-running',
            image: 'https://img.freepik.com/premium-photo/sports-accessories_1031240-6106.jpg'
        }
    ],
    
    // Sample products - empty by default (add products via admin panel)
    SAMPLE_PRODUCTS: [],
    
    // Messages and notifications
    MESSAGES: {
        CART_ADD_SUCCESS: 'Product added to cart successfully!',
        CART_REMOVE_SUCCESS: 'Product removed from cart',
        CART_UPDATE_SUCCESS: 'Cart updated successfully',
        CART_EMPTY: 'Your cart is empty',
        ORDER_SUCCESS: 'Order placed successfully! You will receive a confirmation email shortly.',
        ORDER_ERROR: 'There was an error processing your order. Please try again.',
        CONTACT_SUCCESS: 'Thank you for your message. We will get back to you soon!',
        CONTACT_ERROR: 'There was an error sending your message. Please try again.',
        LOGIN_SUCCESS: 'Welcome back!',
        LOGIN_ERROR: 'Invalid email or password',
        REGISTER_SUCCESS: 'Account created successfully! Please check your email for verification.',
        REGISTER_ERROR: 'There was an error creating your account',
        NETWORK_ERROR: 'Network error. Please check your connection and try again.',
        LOADING: 'Loading...',
        NO_PRODUCTS: 'No products found matching your criteria.',
        SEARCH_PLACEHOLDER: 'Search for products...'
    },
    
    // Validation rules
    VALIDATION: {
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_REGEX: /^[\+]?[6-9]\d{9}$|^[\+]?91[6-9]\d{9}$/,
        CARD_NUMBER_REGEX: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
        CVV_REGEX: /^\d{3,4}$/,
        EXPIRY_REGEX: /^(0[1-9]|1[0-2])\/\d{2}$/,
        MIN_PASSWORD_LENGTH: 8,
        MAX_NAME_LENGTH: 50,
        MAX_MESSAGE_LENGTH: 1000
    },
    
    // Animation and UI settings
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 3000,
        MODAL_ANIMATION: 'slideUp',
        SCROLL_OFFSET: 80,
        DEBOUNCE_DELAY: 500
    }
};

// Utility function to get configuration values safely
window.getConfig = function(path, defaultValue = null) {
    return path.split('.').reduce((obj, key) => obj && obj[key], CONFIG) || defaultValue;
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
