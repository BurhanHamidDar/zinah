// Checkout functionality for 7M1 Store

class CheckoutManager {
    constructor() {
        console.log('📄 CheckoutManager constructor called');
        this.currentStep = 1;
        this.maxSteps = 3;
        this.orderData = {
            customerInfo: {},
            shippingAddress: {},
            paymentMethod: null,
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0
        };
        console.log('📄 Initial order data:', this.orderData);
        this.init();
    }

    init() {
        // Only initialize if we're on the checkout page
        if (!window.location.pathname.includes('checkout')) return;

        // Wait for cart to be fully loaded before checking
        console.log('⏳ Waiting for cart to initialize...');
        this.waitForCartAndInit();
    }
    
    // Wait for cart to be available and then initialize
    waitForCartAndInit() {
        let attempts = 0;
        const maxAttempts = 10; // 5 seconds max wait
        
        const checkCart = () => {
            attempts++;
            console.log(`🔍 Cart check attempt ${attempts}/${maxAttempts}`);
            
            // Detailed cart state logging
            console.log('🔍 Current window.cart state:', {
                exists: !!window.cart,
                isEmpty: window.cart ? window.cart.isEmpty() : 'N/A',
                getItems: window.cart && typeof window.cart.getItems === 'function' ? window.cart.getItems() : 'N/A',
                getItemCount: window.cart && typeof window.cart.getItemCount === 'function' ? window.cart.getItemCount() : 'N/A'
            });
            
            if (window.cart && !window.cart.isEmpty()) {
                console.log('✅ Cart found and has items, proceeding with checkout');
                this.proceedWithInit();
                return;
            }
            
            if (window.cart && window.cart.isEmpty()) {
                console.log('❌ Cart is empty, will redirect to products');
                this.redirectToCart();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.log('⏰ Timeout waiting for cart, checking local storage...');
                this.checkLocalStorageCart();
                return;
            }
            
            console.log('⏳ Cart not ready yet, waiting 500ms...');
            setTimeout(checkCart, 500);
        };
        
        checkCart();
    }
    
    // Check if cart data exists in local storage
    checkLocalStorageCart() {
        const cartData = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
        console.log('🗄️ Local storage cart check:', cartData ? 'Found' : 'Not found');
        
        if (cartData) {
            try {
                const items = JSON.parse(cartData);
                if (items && items.length > 0) {
                    console.log('✅ Found cart in local storage, proceeding');
                    this.proceedWithInit();
                    return;
                }
            } catch (error) {
                console.error('❌ Error parsing cart data:', error);
            }
        }
        
        console.log('❌ No cart data found anywhere, redirecting');
        this.redirectToCart();
    }
    
    // Proceed with normal initialization
    proceedWithInit() {
        try {
            this.loadCartData();
            this.bindEvents();
            this.updateOrderSummary();
            this.fillUserData();
        } catch (error) {
            console.error('Error initializing checkout:', error);
            this.redirectToCart();
        }
    }

    // Load cart data
    loadCartData() {
        console.log('🛍 Loading cart data...');
        
        // First check if cart exists and has items
        if (!window.cart) {
            console.error('❌ Cart object not found');
            this.tryLoadFromLocalStorage();
            return;
        }
        
        console.log('🔍 Cart check:', {
            hasCart: true,
            isEmpty: window.cart.isEmpty(),
            itemCount: window.cart.getItemCount(),
            hasGetOrderData: typeof window.cart.getOrderData === 'function'
        });
        
        // If cart is empty, try loading from localStorage first
        if (window.cart.isEmpty()) {
            console.warn('⚠️ Cart appears empty, trying to load from localStorage...');
            this.tryLoadFromLocalStorage();
            return;
        }
        
        // Cart has items, proceed normally
        try {
            const cartData = window.cart.getOrderData();
            console.log('📦 Cart data loaded:', cartData);
            
            // Validate cart data
            if (!cartData || !cartData.items || cartData.items.length === 0) {
                console.error('❌ Invalid cart data received');
                this.redirectToCart();
                return;
            }
            
            this.orderData = {
                ...this.orderData,
                items: cartData.items,
                subtotal: cartData.subtotal || 0,
                tax: cartData.tax || 0,
                shipping: cartData.shipping || 0,
                total: cartData.total || 0
            };
            
            console.log('📝 Updated order data:', this.orderData);
            
        } catch (error) {
            console.error('❌ Error loading cart data:', error);
            this.tryLoadFromLocalStorage();
        }
    }
    
    // Try to load cart from localStorage as fallback
    tryLoadFromLocalStorage() {
        console.log('🗄️ Attempting to load cart from localStorage...');
        
        try {
            const cartData = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
            if (!cartData) {
                console.error('❌ No cart data in localStorage');
                this.redirectToCart();
                return;
            }
            
            const items = JSON.parse(cartData);
            if (!items || items.length === 0) {
                console.error('❌ Empty cart data in localStorage');
                this.redirectToCart();
                return;
            }
            
            console.log('✅ Found cart items in localStorage:', items);
            
            // Calculate totals manually
            let subtotal = 0;
            const processedItems = items.map(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                return {
                    ...item,
                    total: itemTotal
                };
            });
            
            const shipping = CONFIG.APP.SHIPPING_COST || 99;
            const tax = subtotal * (CONFIG.APP.TAX_RATE || 0);
            const total = subtotal + shipping + tax;
            
            this.orderData = {
                ...this.orderData,
                items: processedItems,
                subtotal: subtotal,
                tax: tax,
                shipping: shipping,
                total: total
            };
            
            console.log('✅ Successfully loaded cart from localStorage:', this.orderData);
            
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            this.redirectToCart();
        }
    }

    // Fill user data if logged in
    fillUserData() {
        if (window.authManager && window.authManager.isUserAuthenticated()) {
            window.authManager.fillCheckoutForm();
        }
    }

    // Update order summary
    updateOrderSummary() {
        if (window.cart) {
            window.cart.updateCheckoutSummary();
        }
    }

    // Redirect to cart if no items
    redirectToCart() {
        console.log('🚨 REDIRECTING TO CART! Reason: Empty cart or initialization failure');
        console.log('🔍 Current order data:', this.orderData);
        console.log('🔍 Stack trace:');
        console.trace();
        
        // Add a small delay to see the redirect reason in console
        setTimeout(() => {
            window.location.href = 'index.html#products';
        }, 2000); // 2 second delay to see logs
    }

    // Go to next step
    nextStep() {
        if (this.currentStep < this.maxSteps) {
            if (this.validateCurrentStep()) {
                this.currentStep++;
                this.updateStepDisplay();
            }
        }
    }

    // Go to previous step
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    // Go to specific step
    goToStep(step) {
        if (step >= 1 && step <= this.maxSteps && step <= this.currentStep + 1) {
            this.currentStep = step;
            this.updateStepDisplay();
        }
    }

    // Update step display
    updateStepDisplay() {
        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Show/hide step content
        document.querySelectorAll('.checkout-step').forEach((stepContent, index) => {
            const stepNumber = index + 1;
            if (stepNumber === this.currentStep) {
                stepContent.classList.add('active');
            } else {
                stepContent.classList.remove('active');
            }
        });
    }

    // Validate current step
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateShippingInfo();
            case 2:
                return this.validatePaymentInfo();
            case 3:
                return true; // Review step doesn't need validation
            default:
                return false;
        }
    }

    // Validate shipping information
    validateShippingInfo() {
        const form = document.getElementById('shipping-form');
        if (!form) {
            console.error('🚨 Shipping form not found!');
            return false;
        }

        const formData = new FormData(form);
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
        
        // Debug log all form data
        console.log('📋 Form data check:', {
            formExists: !!form,
            formData: Object.fromEntries(formData.entries())
        });
        
        // Log each field individually for debugging
        console.log('🔍 Individual field check:');
        for (const field of requiredFields) {
            const value = formData.get(field);
            console.log(`   ${field}: "${value}" (${value ? 'VALID' : 'MISSING'})`);
        }

        for (const field of requiredFields) {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                this.showNotification(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                return false;
            }
        }

        // Validate email format
        const email = formData.get('email');
        if (!CONFIG.VALIDATION.EMAIL_REGEX.test(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        // Validate phone format
        const phone = formData.get('phone');
        if (!CONFIG.VALIDATION.PHONE_REGEX.test(phone)) {
            this.showNotification('Please enter a valid phone number', 'error');
            return false;
        }

        // Validate state and pincode restrictions
        const state = formData.get('state');
        const pincode = formData.get('zip');
        
        // Only allow Jammu & Kashmir (more flexible matching)
        if (!state || (!state.toLowerCase().includes('jammu') && !state.toLowerCase().includes('kashmir'))) {
            this.showNotification('Sorry, we don\'t ship to this location. We only deliver to Jammu & Kashmir.', 'error');
            return false;
        }
        
        // Check if pincode is allowed in Jammu & Kashmir
        const allowedPincodes = ['192231', '192233'];
        if (!allowedPincodes.includes(pincode)) {
            this.showNotification('Sorry, this pincode is out of stock. We only deliver to pincodes 192231 and 192233 in Jammu & Kashmir.', 'error');
            return false;
        }

        // Save shipping info
        this.orderData.customerInfo = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };

        this.orderData.shippingAddress = {
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip: formData.get('zip'),
            country: formData.get('country')
        };

        return true;
    }

    // Validate payment information
    validatePaymentInfo() {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        
        if (!paymentMethod) {
            this.showNotification('Please select a payment method', 'error');
            return false;
        }

        this.orderData.paymentMethod = paymentMethod.value;

        // If card payment, validate card details
        if (paymentMethod.value === 'card') {
            const cardNumber = document.getElementById('card-number').value;
            const expiry = document.getElementById('expiry').value;
            const cvv = document.getElementById('cvv').value;
            const cardName = document.getElementById('card-name').value;

            if (!cardNumber || !CONFIG.VALIDATION.CARD_NUMBER_REGEX.test(cardNumber.replace(/\s/g, ''))) {
                this.showNotification('Please enter a valid card number', 'error');
                return false;
            }

            if (!expiry || !CONFIG.VALIDATION.EXPIRY_REGEX.test(expiry)) {
                this.showNotification('Please enter a valid expiry date (MM/YY)', 'error');
                return false;
            }

            if (!cvv || !CONFIG.VALIDATION.CVV_REGEX.test(cvv)) {
                this.showNotification('Please enter a valid CVV', 'error');
                return false;
            }

            if (!cardName || cardName.trim().length < 2) {
                this.showNotification('Please enter the name on the card', 'error');
                return false;
            }

            // Save payment info (don't save sensitive data in production)
            this.orderData.paymentInfo = {
                method: 'card',
                lastFour: cardNumber.slice(-4),
                cardName: cardName,
                // Don't save full card number, expiry, or CVV in production
            };
        }

        return true;
    }

    // Update review step
    updateReviewStep() {
        // Update shipping summary
        const shippingSummary = document.getElementById('shipping-summary');
        if (shippingSummary && this.orderData.shippingAddress) {
            const addr = this.orderData.shippingAddress;
            const customer = this.orderData.customerInfo;
            shippingSummary.innerHTML = `
                <p><strong>${customer.firstName} ${customer.lastName}</strong></p>
                <p>${addr.address}</p>
                <p>${addr.city}, ${addr.state} ${addr.zip}</p>
                <p>${addr.country}</p>
                <p>Email: ${customer.email}</p>
                <p>Phone: ${customer.phone}</p>
            `;
        }

        // Update payment summary
        const paymentSummary = document.getElementById('payment-summary');
        if (paymentSummary && this.orderData.paymentMethod) {
            let paymentText = '';
            switch (this.orderData.paymentMethod) {
                case 'card':
                    paymentText = `<i class="fas fa-credit-card"></i> Credit/Debit Card`;
                    if (this.orderData.paymentInfo?.lastFour) {
                        paymentText += ` ending in ${this.orderData.paymentInfo.lastFour}`;
                    }
                    break;
                case 'paypal':
                    paymentText = `<i class="fab fa-paypal"></i> PayPal`;
                    break;
                case 'apple':
                    paymentText = `<i class="fab fa-apple"></i> Apple Pay`;
                    break;
                default:
                    paymentText = this.orderData.paymentMethod;
            }
            paymentSummary.innerHTML = `<p>${paymentText}</p>`;
        }
    }

    // Place order
    async placeOrder() {
        try {
            this.setOrderButtonLoading(true);
            console.log('🛒 Starting order placement...');
            console.log('🔄 Current checkout step:', this.currentStep);
            console.log('📋 Current order data state:', {
                hasCustomerInfo: !!this.orderData.customerInfo,
                hasShippingAddress: !!this.orderData.shippingAddress,
                hasPaymentMethod: !!this.orderData.paymentMethod,
                hasItems: !!(this.orderData.items && this.orderData.items.length > 0)
            });

            // Force validation of all steps before placing order
            console.log('🔍 Forcing validation of all checkout steps...');
            
            // Validate shipping step
            if (!this.validateShippingInfo()) {
                console.error('❌ Shipping validation failed');
                this.showNotification('Please complete shipping information first', 'error');
                this.goToStep(1);
                return;
            }
            
            // Validate payment step
            if (!this.validatePaymentInfo()) {
                console.error('❌ Payment validation failed');
                this.showNotification('Please complete payment information first', 'error');
                this.goToStep(2);
                return;
            }
            
            // Validate final order data with detailed logging
            console.log('🔍 Detailed order data validation:', {
                hasItems: !!(this.orderData.items && this.orderData.items.length > 0),
                itemCount: this.orderData.items ? this.orderData.items.length : 0,
                hasCustomerInfo: !!this.orderData.customerInfo,
                customerInfo: this.orderData.customerInfo,
                hasShippingAddress: !!this.orderData.shippingAddress,
                shippingAddress: this.orderData.shippingAddress,
                hasPaymentMethod: !!this.orderData.paymentMethod,
                paymentMethod: this.orderData.paymentMethod,
                hasTotal: !!(this.orderData.total && this.orderData.total > 0),
                total: this.orderData.total
            });
            
            if (!this.orderData.items || this.orderData.items.length === 0) {
                console.error('❌ Cart is empty');
                this.showNotification('Your cart is empty', 'error');
                return;
            }

            if (!this.orderData.customerInfo || !this.orderData.customerInfo.email) {
                console.error('❌ Missing customer information:', this.orderData.customerInfo);
                this.showNotification('Missing customer information', 'error');
                return;
            }

            // Debug log order data
            console.log('📦 Order data:', {
                customerInfo: this.orderData.customerInfo,
                shippingAddress: this.orderData.shippingAddress,
                paymentMethod: this.orderData.paymentMethod,
                itemCount: this.orderData.items.length,
                total: this.orderData.total
            });
            
            // Validate order data completeness
            if (!this.orderData.customerInfo || !this.orderData.customerInfo.firstName || !this.orderData.customerInfo.lastName) {
                this.showNotification('Please complete the shipping information first', 'error');
                this.goToStep(1);
                return;
            }
            
            if (!this.orderData.shippingAddress || !this.orderData.shippingAddress.address) {
                this.showNotification('Please complete the shipping address', 'error');
                this.goToStep(1);
                return;
            }
            
            if (!this.orderData.paymentMethod) {
                this.showNotification('Please select a payment method', 'error');
                this.goToStep(2);
                return;
            }

            // Place order
            console.log('📡 Calling createOrder...');
            const result = await supabaseService.createOrder(this.orderData);
            console.log('📧 Order result:', result);

            if (result.success) {
                console.log('✅ Order placed successfully!', result.orderNumber);
                
                // Clear cart
                window.cart.clearCart();
                
                // Show success message
                this.showOrderConfirmation(result.orderNumber, this.orderData.total);
                
                // Track order placement (analytics)
                this.trackOrderPlacement();

            } else {
                console.error('❌ Order failed:', result.message);
                this.showNotification(result.message, 'error');
            }

        } catch (error) {
            console.error('💥 Error placing order:', error);
            this.showNotification(error.message || CONFIG.MESSAGES.ORDER_ERROR, 'error');
        } finally {
            this.setOrderButtonLoading(false);
        }
    }

    // Show order confirmation
    showOrderConfirmation(orderNumber, total) {
        const confirmationModal = document.getElementById('order-confirmation');
        const orderNumberElement = document.getElementById('order-number');
        const confirmationTotalElement = document.getElementById('confirmation-total');

        if (confirmationModal) {
            if (orderNumberElement) {
                orderNumberElement.textContent = orderNumber;
            }
            if (confirmationTotalElement) {
                confirmationTotalElement.textContent = `${CONFIG.APP.CURRENCY_SYMBOL}${total.toFixed(2)}`;
            }
            
            confirmationModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    // Track order placement (for analytics)
    trackOrderPlacement() {
        // Implement analytics tracking if needed
        console.log('Order placed successfully', {
            total: this.orderData.total,
            items: this.orderData.items.length,
            paymentMethod: this.orderData.paymentMethod
        });
    }

    // Set order button loading state
    setOrderButtonLoading(loading) {
        const placeOrderBtn = document.getElementById('place-order');
        if (placeOrderBtn) {
            if (loading) {
                placeOrderBtn.disabled = true;
                placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';
            } else {
                placeOrderBtn.disabled = false;
                placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order';
            }
        }
    }

    // Apply promo code
    applyPromoCode(code) {
        // Implement promo code logic
        const validCodes = {
            'SAVE10': { type: 'percentage', value: 0.1 },
            'FREESHIP': { type: 'shipping', value: 0 },
            'WELCOME20': { type: 'percentage', value: 0.2 }
        };

        const promo = validCodes[code.toUpperCase()];
        
        if (promo) {
            let discount = 0;
            if (promo.type === 'percentage') {
                discount = this.orderData.subtotal * promo.value;
                this.orderData.total -= discount;
            } else if (promo.type === 'shipping') {
                this.orderData.shipping = promo.value;
                this.orderData.total = this.orderData.subtotal + this.orderData.tax + this.orderData.shipping;
            }

            this.showNotification(`Promo code applied! You saved ${CONFIG.APP.CURRENCY_SYMBOL}${discount.toFixed(2)}`, 'success');
            this.updateOrderSummary();
        } else {
            this.showNotification('Invalid promo code', 'error');
        }
    }

    // Format card number with spaces
    formatCardNumber(input) {
        const value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = value.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            input.value = parts.join(' ');
        } else {
            input.value = value;
        }
    }

    // Format expiry date
    formatExpiry(input) {
        const value = input.value.replace(/\D/g, '');
        const month = value.substring(0, 2);
        const year = value.substring(2, 4);
        
        if (value.length >= 2) {
            input.value = month + (year ? '/' + year : '');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Use the cart's notification method
        if (window.cart) {
            window.cart.showNotification(message, type);
        }
    }

    // Bind checkout events
    bindEvents() {
        // Step navigation
        const continuePaymentBtn = document.getElementById('continue-payment');
        if (continuePaymentBtn) {
            continuePaymentBtn.addEventListener('click', () => {
                this.nextStep();
            });
        }

        const backShippingBtn = document.getElementById('back-shipping');
        if (backShippingBtn) {
            backShippingBtn.addEventListener('click', () => {
                this.previousStep();
            });
        }

        const continueReviewBtn = document.getElementById('continue-review');
        if (continueReviewBtn) {
            continueReviewBtn.addEventListener('click', () => {
                if (this.validateCurrentStep()) {
                    this.updateReviewStep();
                    this.nextStep();
                }
            });
        }

        const backPaymentBtn = document.getElementById('back-payment');
        if (backPaymentBtn) {
            backPaymentBtn.addEventListener('click', () => {
                this.previousStep();
            });
        }

        // Edit buttons in review step
        const editShippingBtn = document.getElementById('edit-shipping');
        if (editShippingBtn) {
            editShippingBtn.addEventListener('click', () => {
                this.goToStep(1);
            });
        }

        const editPaymentBtn = document.getElementById('edit-payment');
        if (editPaymentBtn) {
            editPaymentBtn.addEventListener('click', () => {
                this.goToStep(2);
            });
        }

        // Place order button
        const placeOrderBtn = document.getElementById('place-order');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => {
                this.placeOrder();
            });
        }

        // Payment method selection
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('.payment-method').forEach(method => {
                    method.classList.remove('active');
                });
                e.target.closest('.payment-method').classList.add('active');

                // Show/hide card details
                const cardDetails = document.getElementById('card-details');
                if (cardDetails) {
                    cardDetails.style.display = e.target.value === 'card' ? 'block' : 'none';
                }
            });
        });

        // Card number formatting
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                this.formatCardNumber(e.target);
            });
        }

        // Expiry date formatting
        const expiryInput = document.getElementById('expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                this.formatExpiry(e.target);
            });
        }

        // CVV input (numbers only)
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }

        // Promo code
        const applyPromoBtn = document.getElementById('apply-promo');
        const promoInput = document.getElementById('promo-input');
        if (applyPromoBtn && promoInput) {
            applyPromoBtn.addEventListener('click', () => {
                const code = promoInput.value.trim();
                if (code) {
                    this.applyPromoCode(code);
                }
            });

            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const code = promoInput.value.trim();
                    if (code) {
                        this.applyPromoCode(code);
                    }
                }
            });
        }

        // Same address checkbox
        const sameAddressCheckbox = document.getElementById('same-address');
        if (sameAddressCheckbox) {
            sameAddressCheckbox.addEventListener('change', (e) => {
                // Implement billing address toggle if needed
                console.log('Same address:', e.target.checked);
            });
        }
    }
}

// Initialize checkout manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckoutManager;
}
