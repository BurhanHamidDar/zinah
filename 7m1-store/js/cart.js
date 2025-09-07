// Shopping cart functionality for 7M1 Store

class ShoppingCart {
    constructor() {
        this.items = [];
        this.storageKey = CONFIG.STORAGE_KEYS.CART;
        this.loadFromStorage();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCartDisplay();
    }

    // Load cart from localStorage
    loadFromStorage() {
        try {
            const savedCart = localStorage.getItem(this.storageKey);
            if (savedCart) {
                this.items = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            this.items = [];
        }
    }

    // Save cart to localStorage
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    // Add item to cart
    addItem(product, quantity = 1) {
        try {
            const existingItem = this.items.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity
                });
            }
            
            this.saveToStorage();
            this.updateCartDisplay();
            this.showNotification(CONFIG.MESSAGES.CART_ADD_SUCCESS, 'success');
            
            return true;
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return false;
        }
    }

    // Remove item from cart
    removeItem(productId) {
        try {
            this.items = this.items.filter(item => item.id !== productId);
            this.saveToStorage();
            this.updateCartDisplay();
            this.showNotification(CONFIG.MESSAGES.CART_REMOVE_SUCCESS, 'info');
            return true;
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return false;
        }
    }

    // Update item quantity
    updateQuantity(productId, quantity) {
        try {
            if (quantity <= 0) {
                return this.removeItem(productId);
            }

            const item = this.items.find(item => item.id === productId);
            if (item) {
                item.quantity = quantity;
                this.saveToStorage();
                this.updateCartDisplay();
                this.showNotification(CONFIG.MESSAGES.CART_UPDATE_SUCCESS, 'info');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating item quantity:', error);
            return false;
        }
    }

    // Clear entire cart
    clearCart() {
        try {
            this.items = [];
            this.saveToStorage();
            this.updateCartDisplay();
            this.showNotification('Cart cleared', 'info');
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return false;
        }
    }

    // Get cart items
    getItems() {
        return this.items;
    }

    // Get total number of items in cart
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    // Get cart subtotal
    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Calculate tax
    getTax() {
        return this.getSubtotal() * CONFIG.APP.TAX_RATE;
    }

    // Get shipping cost
    getShipping() {
        return this.getSubtotal() > CONFIG.APP.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.APP.SHIPPING_COST; // Free shipping over ₹999
    }

    // Get cart total
    getTotal() {
        return this.getSubtotal() + this.getTax() + this.getShipping();
    }

    // Check if cart is empty
    isEmpty() {
        return this.items.length === 0;
    }

    // Update cart display in UI
    updateCartDisplay() {
        this.updateCartBadge();
        this.updateCartModal();
        this.updateCheckoutSummary();
    }

    // Update cart badge in navigation
    updateCartBadge() {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            const totalItems = this.getTotalItems();
            console.log('🛒 Updating cart badge - Total items:', totalItems);
            cartCountElement.textContent = totalItems;
            cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
        } else {
            console.warn('⚠️ Cart count element not found');
        }
    }

    // Update cart modal content
    updateCartModal() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        
        if (!cartItemsContainer) return;

        if (this.isEmpty()) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>${CONFIG.MESSAGES.CART_EMPTY}</p>
                </div>
            `;
            if (cartTotalElement) {
                cartTotalElement.textContent = '0.00';
            }
            return;
        }

        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<i class="fas fa-image"></i>'}
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${CONFIG.APP.CURRENCY_SYMBOL}${item.price.toFixed(2)}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <button class="remove-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        if (cartTotalElement) {
            cartTotalElement.textContent = `${CONFIG.APP.CURRENCY_SYMBOL}${this.getTotal().toFixed(2)}`;
        }

        // Bind quantity control events
        this.bindQuantityControls();
    }

    // Update checkout summary
    updateCheckoutSummary() {
        const checkoutItemsContainer = document.getElementById('checkout-items');
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
        const shippingElement = document.getElementById('shipping-cost');
        const orderTotalElement = document.getElementById('order-total');

        if (checkoutItemsContainer && !this.isEmpty()) {
            checkoutItemsContainer.innerHTML = this.items.map(item => `
                <div class="checkout-item">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-quantity">Qty: ${item.quantity}</div>
                    </div>
                    <div class="item-price">${CONFIG.APP.CURRENCY_SYMBOL}${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `).join('');
        }

        if (subtotalElement) subtotalElement.textContent = `${CONFIG.APP.CURRENCY_SYMBOL}${this.getSubtotal().toFixed(2)}`;
        if (taxElement) taxElement.textContent = `${CONFIG.APP.CURRENCY_SYMBOL}${this.getTax().toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = `${CONFIG.APP.CURRENCY_SYMBOL}${this.getShipping().toFixed(2)}`;
        if (orderTotalElement) orderTotalElement.textContent = `${CONFIG.APP.CURRENCY_SYMBOL}${this.getTotal().toFixed(2)}`;
    }

    // Bind quantity control events
    bindQuantityControls() {
        // Decrease quantity buttons
        document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                const item = this.items.find(item => item.id === productId);
                if (item && item.quantity > 1) {
                    this.updateQuantity(productId, item.quantity - 1);
                }
            });
        });

        // Increase quantity buttons
        document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                const item = this.items.find(item => item.id === productId);
                if (item) {
                    this.updateQuantity(productId, item.quantity + 1);
                }
            });
        });

        // Quantity input fields
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const productId = parseInt(e.target.dataset.id);
                const quantity = parseInt(e.target.value);
                if (quantity > 0) {
                    this.updateQuantity(productId, quantity);
                }
            });
        });

        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                this.removeItem(productId);
            });
        });
    }

    // Bind main cart events
    bindEvents() {
        // Cart button click
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.openCartModal();
            });
        }

        // Clear cart button
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your cart?')) {
                    this.clearCart();
                }
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.isEmpty()) {
                    this.showNotification(CONFIG.MESSAGES.CART_EMPTY, 'warning');
                    return;
                }
                this.goToCheckout();
            });
        }

        // Close cart modal
        const closeCartBtn = document.getElementById('close-cart');
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => {
                this.closeCartModal();
            });
        }

        // Add to cart buttons (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
                const btn = e.target.classList.contains('add-to-cart-btn') ? e.target : e.target.closest('.add-to-cart-btn');
                const productId = parseInt(btn.dataset.id);
                
                if (productId) {
                    this.handleAddToCart(productId);
                }
            }
        });
    }

    // Handle add to cart button click
    async handleAddToCart(productId) {
        try {
            const product = await supabaseService.getProduct(productId);
            if (product) {
                this.addItem(product);
            } else {
                this.showNotification('Product not found', 'error');
            }
        } catch (error) {
            console.error('Error adding product to cart:', error);
            this.showNotification('Error adding product to cart', 'error');
        }
    }

    // Open cart modal
    openCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            this.updateCartModal();
            cartModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    // Close cart modal
    closeCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Go to checkout page
    goToCheckout() {
        if (this.isEmpty()) {
            this.showNotification(CONFIG.MESSAGES.CART_EMPTY, 'warning');
            return;
        }
        
        this.closeCartModal();
        window.location.href = 'checkout.html';
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `notification ${type} show`;

        // Auto hide notification
        setTimeout(() => {
            notification.classList.remove('show');
        }, CONFIG.UI.TOAST_DURATION);
    }

    // Get order data for checkout
    getOrderData() {
        if (this.isEmpty()) {
            return null;
        }

        return {
            items: this.items,
            subtotal: this.getSubtotal(),
            tax: this.getTax(),
            shipping: this.getShipping(),
            total: this.getTotal(),
            itemCount: this.getTotalItems()
        };
    }
}

// Create global cart instance
window.cart = new ShoppingCart();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}
