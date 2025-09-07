// Admin panel functionality for 7M1 Store

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        this.bindEvents();
        
        // Check authentication first, then load data
        const isAuthenticated = await this.checkAuth();
        if (isAuthenticated) {
            this.loadDashboardData();
        }
    }

    // Check if user is authenticated
    async checkAuth() {
        try {
            // Check if Supabase is connected
            if (supabaseService.isSupabaseConnected()) {
                const user = await supabaseService.getCurrentUser();
                
                if (!user) {
                    // No user logged in, redirect to login
                    this.showLoginForm();
                    return false;
                }
                
                // Check if user is admin (basic check by email)
                const adminEmails = ['burhanhamid912@gmail.com'];
                if (!adminEmails.includes(user.email)) {
                    alert('Access denied. Admin privileges required.');
                    window.location.href = '../index.html';
                    return false;
                }
                
                // Update admin user display
                const adminUserName = document.getElementById('admin-user-name');
                if (adminUserName) {
                    adminUserName.textContent = user.email;
                }
                
                // Show admin interface
                this.showAdminInterface();
                return true;
            } else {
                // Supabase not connected, show demo mode
                console.log('Admin panel loaded in demo mode');
                const adminUserName = document.getElementById('admin-user-name');
                if (adminUserName) {
                    adminUserName.textContent = 'Demo Admin';
                }
                
                // Show admin interface for demo mode
                this.showAdminInterface();
                return true; // Allow demo mode
            }
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }
    
    // Show admin interface after authentication
    showAdminInterface() {
        // Disable security measures when admin panel is active
        if (typeof window.disableSecurity === 'function') {
            window.disableSecurity();
        }
        
        const adminInterface = document.getElementById('admin-interface');
        if (adminInterface) {
            adminInterface.style.display = 'flex';
        }
    }
    
    // Show login form
    showLoginForm() {
        const loginHtml = `
            <div class="login-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="login-form" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                ">
                    <h2 style="margin-bottom: 1.5rem; color: #333;">Admin Login</h2>
                    <form id="admin-login-form">
                        <input type="email" id="admin-email" placeholder="Email" required style="
                            width: 100%;
                            padding: 12px;
                            margin-bottom: 1rem;
                            border: 2px solid #e9ecef;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                        <input type="password" id="admin-password" placeholder="Password" required style="
                            width: 100%;
                            padding: 12px;
                            margin-bottom: 1.5rem;
                            border: 2px solid #e9ecef;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                        <button type="submit" style="
                            width: 100%;
                            padding: 12px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">Login</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loginHtml);
        
        // Bind login form
        const loginForm = document.getElementById('admin-login-form');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }
    
    // Handle admin login
    async handleLogin() {
        try {
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            
            const result = await supabaseService.signIn(email, password);
            
            if (result.success) {
                // Remove login form
                const loginOverlay = document.querySelector('.login-overlay');
                if (loginOverlay) {
                    loginOverlay.remove();
                }
                
                // Reload to check auth
                window.location.reload();
            } else {
                alert('Login failed: ' + result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed');
        }
    }

    // Toast notification system
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add toast styles if not exists
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    padding: 12px 16px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    animation: slideInToast 0.3s ease;
                    border-left: 4px solid #667eea;
                    min-width: 250px;
                }
                .toast-success { border-left-color: #10ac84; }
                .toast-error { border-left-color: #e74c3c; }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 500;
                }
                .toast-success i { color: #10ac84; }
                .toast-error i { color: #e74c3c; }
                .toast-info i { color: #667eea; }
                @keyframes slideInToast {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOutToast {
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOutToast 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Bind event listeners
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Refresh dashboard
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }
        
        // Add manual Supabase test (temporary debug)
        const testSupabaseBtn = document.getElementById('test-supabase-btn');
        if (testSupabaseBtn) {
            testSupabaseBtn.addEventListener('click', () => {
                this.testSupabaseConnection();
            });
        }

        // Add product
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showAddProductModal();
            });
        }

        // Product modal events
        const closeProductModal = document.getElementById('close-product-modal');
        if (closeProductModal) {
            closeProductModal.addEventListener('click', () => {
                this.hideProductModal();
            });
        }

        const cancelProduct = document.getElementById('cancel-product');
        if (cancelProduct) {
            cancelProduct.addEventListener('click', () => {
                this.hideProductModal();
            });
        }

        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

    }

    // Show specific section
    showSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');

        this.currentSection = section;

        // Load section data
        this.loadSectionData(section);
    }

    // Load section-specific data
    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // Load dashboard data
    async loadDashboardData() {
        try {
            // Load real data from database
            const products = await supabaseService.getProducts();
            const orders = await supabaseService.getOrders(); // We'll need to add this method
            
            this.updateDashboardStats({
                totalOrders: Array.isArray(orders) ? orders.length : 0,
                totalProducts: Array.isArray(products) ? products.length : 0
            });

            this.loadRecentOrders();
            this.loadLowStockProducts();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Fallback to zeros on error
            this.updateDashboardStats({
                totalOrders: 0,
                totalProducts: 0
            });
        }
    }

    // Update dashboard statistics
    updateDashboardStats(stats) {
        document.getElementById('total-orders').textContent = stats.totalOrders;
        document.getElementById('total-products').textContent = stats.totalProducts;
    }

    // Load recent orders
    async loadRecentOrders() {
        const recentOrdersEl = document.getElementById('recent-orders');
        if (!recentOrdersEl) return;
        
        try {
            const orders = await supabaseService.getOrders();
            const recentOrders = orders.slice(0, 5); // Get last 5 orders
            
            if (recentOrders.length === 0) {
                recentOrdersEl.innerHTML = `
                    <div class="no-data">
                        <p>No recent orders found</p>
                    </div>
                `;
            } else {
                recentOrdersEl.innerHTML = `
                    <div class="recent-orders-list">
                        ${recentOrders.map(order => `
                            <div class="recent-order-item">
                                <div class="order-info">
                                    <strong>#${order.order_number || order.id}</strong>
                                    <span class="customer-name">${order.customer_name}</span>
                                </div>
                                <div class="order-amount">₹${parseFloat(order.total).toFixed(2)}</div>
                                <div class="order-status status-${order.status || 'pending'}">${order.status || 'pending'}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading recent orders:', error);
            recentOrdersEl.innerHTML = `
                <div class="no-data">
                    <p>Error loading orders</p>
                </div>
            `;
        }
    }

    // Load low stock products
    async loadLowStockProducts() {
        const lowStockEl = document.getElementById('low-stock-products');
        if (!lowStockEl) return;
        
        try {
            const allProducts = await supabaseService.getProducts();
            const lowStockProducts = allProducts.filter(product => {
                const stock = parseInt(product.stock) || 0;
                return stock > 0 && stock <= 10; // Consider products with 10 or fewer items as low stock
            });
            
            if (lowStockProducts.length === 0) {
                lowStockEl.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-check-circle" style="color: #10ac84; font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <p>All products have sufficient stock!</p>
                    </div>
                `;
            } else {
                lowStockEl.innerHTML = `
                    <div class="low-stock-list">
                        ${lowStockProducts.map(product => `
                            <div class="stock-item">
                                <div class="product-info">
                                    <strong>${product.name}</strong>
                                    <small>${this.getDisplayCategoryName(product.category)}</small>
                                </div>
                                <div class="stock-level">
                                    <span class="stock-count ${product.stock <= 5 ? 'stock-critical' : 'stock-low'}">
                                        ${product.stock} left
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading low stock products:', error);
            lowStockEl.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                    <p>Error loading stock information</p>
                </div>
            `;
        }
    }

    // Load products with enhanced loading experience
    async loadProducts() {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        try {
            // Show enhanced loading state with progress indication
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 500;">Loading products...</p>
                                <small style="color: #666;">This may take a few moments</small>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            
            // Reduced timeout for faster failure detection
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 8000)
            );
            
            const products = await Promise.race([
                supabaseService.getProducts(),
                timeoutPromise
            ]);
            
            if (products.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 3rem;">
                            <div style="color: #666; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                                <i class="fas fa-box-open" style="font-size: 3rem; opacity: 0.3;"></i>
                                <div>
                                    <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">No products found</p>
                                    <small>Start building your inventory</small>
                                </div>
                                <button class="primary-btn" onclick="adminPanel.showAddProductModal()" style="margin-top: 0.5rem;">
                                    <i class="fas fa-plus"></i> Add First Product
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Batch render for better performance
            const productRows = products.map(product => `
                <tr style="animation: fadeIn 0.3s ease;">
                    <td>
                        <div class="product-info">
                            <strong>${product.name || 'Unnamed Product'}</strong>
                            <small style="color: #666;">${(product.description || '').substring(0, 60)}${product.description?.length > 60 ? '...' : ''}</small>
                        </div>
                    </td>
                    <td>
                        <span class="category-badge">${this.getDisplayCategoryName(product.category || 'Uncategorized')}</span>
                    </td>
                    <td style="font-weight: 600; color: #10ac84;">${CONFIG.APP.CURRENCY_SYMBOL}${(product.price || 0).toFixed(2)}</td>
                    <td>
                        <span class="stock-indicator ${(product.stock || 0) <= 5 ? 'stock-low' : 'stock-good'}">
                            ${product.stock || 0}
                        </span>
                    </td>
                    <td><span class="status status-active">Active</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-small btn-edit" onclick="adminPanel.editProduct(${product.id})" title="Edit Product">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-small btn-danger" onclick="adminPanel.deleteProduct(${product.id})" title="Delete Product">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tbody.innerHTML = productRows.join('');
            
            // Show success feedback
            this.showToast(`✅ Loaded ${products.length} products`, 'success');
            
        } catch (error) {
            console.error('Error loading products:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div style="color: #e74c3c; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 500;">Failed to load products</p>
                                <small>${error.message === 'Timeout' ? 'Connection timed out after 8 seconds' : 'Database connection error'}</small>
                            </div>
                            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                                <button class="primary-btn" onclick="adminPanel.loadProducts()">
                                    <i class="fas fa-redo"></i> Retry Loading
                                </button>
                                <button class="secondary-btn" onclick="adminPanel.showAddProductModal()">
                                    <i class="fas fa-plus"></i> Add Product Manually
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    // Load orders with enhanced loading experience and debugging
    async loadOrders() {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        
        try {
            // Show enhanced loading state
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 500;">Loading orders...</p>
                                <small style="color: #666;">Checking Supabase connection...</small>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            
            // Debug: Check if Supabase is connected
            console.log('🔍 Supabase connection status:', supabaseService.isSupabaseConnected());
            console.log('🔍 Supabase client exists:', !!supabaseService.client);
            
            // Faster timeout for orders
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 7000)
            );
            
            console.log('📦 Attempting to fetch orders from Supabase...');
            
            const allOrders = await Promise.race([
                supabaseService.getOrders(),
                timeoutPromise
            ]);
            
            console.log('📦 Raw orders data received:', allOrders);
            console.log('📦 Number of orders:', allOrders?.length || 0);
            
            // Filter out delivered orders from main list
            const orders = allOrders.filter(order => order.status !== 'delivered');
            
            if (orders.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 3rem;">
                            <div style="color: #666; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                                <i class="fas fa-shopping-cart" style="font-size: 3rem; opacity: 0.3;"></i>
                                <div>
                                    <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">No pending orders</p>
                                    <small>New orders will appear here automatically</small>
                                </div>
                                <button class="secondary-btn" onclick="adminPanel.loadOrders()" style="margin-top: 0.5rem;">
                                    <i class="fas fa-redo"></i> Refresh Orders
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                const orderRows = orders.map(order => {
                    const orderDate = new Date(order.created_at);
                    const isNew = (Date.now() - orderDate.getTime()) < 24 * 60 * 60 * 1000; // Less than 24 hours
                    
                    return `
                        <tr style="animation: fadeIn 0.3s ease; ${isNew ? 'background: rgba(16, 172, 132, 0.05);' : ''}">
                            <td>
                                <strong>#${order.order_number || order.id}</strong>
                                ${isNew ? '<span class="new-badge">NEW</span>' : ''}
                            </td>
                            <td>
                                <div class="customer-info">
                                    <strong>${order.customer_name || 'N/A'}</strong>
                                    <small style="color: #666;">${order.customer_email || 'N/A'}</small>
                                </div>
                            </td>
                            <td style="color: #666;">${orderDate.toLocaleDateString()}</td>
                            <td>
                                <span class="status status-${order.status || 'pending'}">
                                    ${(order.status || 'pending').toUpperCase()}
                                </span>
                            </td>
                            <td style="font-weight: 600; color: #10ac84;">₹${parseFloat(order.total || 0).toFixed(2)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-small" onclick="adminPanel.viewOrder('${order.id}')" title="View Details">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-small btn-edit" onclick="adminPanel.updateOrderStatus('${order.id}')" title="Update Status">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-small btn-danger" onclick="adminPanel.deleteOrder('${order.id}')" title="Delete Order">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
                
                tbody.innerHTML = orderRows;
                
                // Show success feedback
                this.showToast(`✅ Loaded ${orders.length} active orders`, 'success');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div style="color: #e74c3c; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 500;">Failed to load orders</p>
                                <small>${error.message === 'Timeout' ? 'Connection timed out after 7 seconds' : 'Database connection error'}</small>
                            </div>
                            <button class="primary-btn" onclick="adminPanel.loadOrders()" style="margin-top: 1rem;">
                                <i class="fas fa-redo"></i> Retry Loading
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // Load customers with enhanced loading experience
    async loadCustomers() {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;
        
        try {
            // Show enhanced loading state
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 500;">Loading customers...</p>
                                <small style="color: #666;">Fetching customer data</small>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            
            // Faster timeout for customers
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 6000)
            );
            
            const customers = await Promise.race([
                supabaseService.getCustomers(),
                timeoutPromise
            ]);
            
            if (customers.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 3rem;">
                            <div style="color: #666; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                                <i class="fas fa-users" style="font-size: 3rem; opacity: 0.3;"></i>
                                <div>
                                    <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">No customers yet</p>
                                    <small>Customer profiles will appear after first orders</small>
                                </div>
                                <button class="secondary-btn" onclick="adminPanel.loadCustomers()" style="margin-top: 0.5rem;">
                                    <i class="fas fa-redo"></i> Refresh Customers
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                const customerRows = customers.map(customer => {
                    const totalSpent = parseFloat(customer.total_spent || 0);
                    const isVip = totalSpent > 5000;
                    
                    return `
                        <tr style="animation: fadeIn 0.3s ease; ${isVip ? 'background: rgba(255, 215, 0, 0.05);' : ''}">
                            <td>
                                <div class="customer-info">
                                    <strong>${customer.name || 'N/A'}</strong>
                                    ${isVip ? '<span class="vip-badge">VIP</span>' : ''}
                                </div>
                            </td>
                            <td style="color: #666;">${customer.email || 'N/A'}</td>
                            <td>
                                <span class="order-count">${customer.total_orders || 0} orders</span>
                            </td>
                            <td style="font-weight: 600; color: ${totalSpent > 1000 ? '#10ac84' : '#666'};">
                                ₹${totalSpent.toFixed(2)}
                            </td>
                            <td style="color: #666;">
                                ${customer.first_order ? new Date(customer.first_order).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                                <button class="btn-small" onclick="adminPanel.viewCustomer('${customer.email}')" title="View Profile">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
                
                tbody.innerHTML = customerRows;
                
                // Show success feedback
                this.showToast(`✅ Loaded ${customers.length} customers`, 'success');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div style="color: #e74c3c; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem;"></i>
                            <div>
                                <p style="margin: 0; font-weight: 500;">Failed to load customers</p>
                                <small>${error.message === 'Timeout' ? 'Connection timed out after 6 seconds' : 'Database connection error'}</small>
                            </div>
                            <button class="primary-btn" onclick="adminPanel.loadCustomers()" style="margin-top: 1rem;">
                                <i class="fas fa-redo"></i> Retry Loading
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // Load categories
    async loadCategories() {
        const tbody = document.getElementById('categories-table-body');
        if (!tbody) return;

        try {
            const categories = await supabaseService.getCategories();
            
            tbody.innerHTML = categories.map(category => `
                <tr>
                    <td>${category.name}</td>
                    <td>${category.name.toLowerCase().replace(/\s+/g, '-')}</td>
                    <td>-</td>
                    <td><span class="status-active">Active</span></td>
                    <td>
                        <button class="btn-small">Edit</button>
                        <button class="btn-small btn-danger">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading categories:', error);
            tbody.innerHTML = '<tr><td colspan="5">Error loading categories</td></tr>';
        }
    }


    // Load settings
    loadSettings() {
        // Settings are already in the form, no need to load
        console.log('Settings section loaded');
    }



    // Show add product modal
    async showAddProductModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            // Reset form
            document.getElementById('product-form').reset();
            
            // Load categories for dropdown
            await this.loadCategoriesForForm();
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    // Helper method to get display category name from DB name
    getDisplayCategoryName(dbName) {
        const displayMapping = {
            'Home & Kitchen': 'Food & Beverages'
        };
        return displayMapping[dbName] || dbName;
    }

    // Helper method to get DB category name from display name
    getDbCategoryName(displayName) {
        const dbMapping = {
            'Food & Beverages': 'Home & Kitchen'
        };
        return dbMapping[displayName] || displayName;
    }

    // Load categories for product form
    async loadCategoriesForForm() {
        try {
            const dbCategories = await supabaseService.getCategories();
            const categorySelect = document.getElementById('product-category');
            
            if (categorySelect) {
                // Show display names in dropdown, but store display->DB mapping
                const categoryOptions = dbCategories.map(cat => {
                    const displayName = this.getDisplayCategoryName(cat.name);
                    return `<option value="${displayName}">${displayName}</option>`;
                }).join('');
                
                categorySelect.innerHTML = '<option value="">Select Category</option>' + categoryOptions;
            }
        } catch (error) {
            console.error('Error loading categories for form:', error);
            // Fallback to CONFIG categories (which already have display names)
            const categorySelect = document.getElementById('product-category');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select Category</option>' +
                    CONFIG.CATEGORIES.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            }
        }
    }

    // Hide product modal
    hideProductModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Save product
    async saveProduct() {
        try {
            const form = document.getElementById('product-form');
            const formData = new FormData(form);
            
            const productName = formData.get('name');
            
            // Validate required fields
            if (!productName || !formData.get('category') || !formData.get('price')) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            const baseSlug = this.generateSlug(productName);
            let uniqueSlug = baseSlug;
            
            // Ensure slug is unique (basic implementation)
            // In a production app, you'd check against the database
            let counter = 1;
            while (uniqueSlug === '') {
                uniqueSlug = baseSlug + '-' + counter;
                counter++;
                if (counter > 100) break; // Prevent infinite loop
            }
            
            // If slug is still empty, use a timestamp
            if (!uniqueSlug) {
                uniqueSlug = 'product-' + Date.now();
            }
            
            const selectedCategory = formData.get('category');
            const dbCategoryName = this.getDbCategoryName(selectedCategory);
            
            console.log(`📝 Admin: Saving product with category '${selectedCategory}' -> DB category '${dbCategoryName}'`);
            
            const productData = {
                name: productName,
                slug: uniqueSlug,
                category: dbCategoryName, // Save as DB category name
                description: formData.get('description') || '',
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')) || 0,
                image: formData.get('image') || null,
                featured: formData.get('featured') === 'on',
                badge: formData.get('badge') || null,
                is_active: true
            };

            // Save to Supabase
            const result = await supabaseService.saveProduct(productData);
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                this.hideProductModal();
                
                // Reload products if on products section
                if (this.currentSection === 'products') {
                    this.loadProducts();
                }
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNotification('Error saving product', 'error');
        }
    }

    // Edit product
    editProduct(id) {
        console.log('Edit product:', id);
        // In a real app, load product data and show modal
        this.showAddProductModal();
    }

    // Delete product
    async deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                const result = await supabaseService.deleteProduct(id);
                
                if (result.success) {
                    this.showNotification(result.message, 'success');
                    await this.loadProducts();
                } else {
                    this.showNotification(result.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showNotification('Error deleting product', 'error');
            }
        }
    }

    // Logout
    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                if (supabaseService.isSupabaseConnected()) {
                    await supabaseService.signOut();
                }
                window.location.href = '../index.html';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '../index.html';
            }
        }
    }

    // Generate URL-friendly slug from text
    generateSlug(text) {
        if (!text || typeof text !== 'string') {
            return 'product-' + Date.now();
        }
        
        let slug = text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[àáäâèéëêìíïîòóöôùúüûñç]/g, function(match) {
                // Replace accented characters
                const accents = {
                    'à': 'a', 'á': 'a', 'ä': 'a', 'â': 'a',
                    'è': 'e', 'é': 'e', 'ë': 'e', 'ê': 'e',
                    'ì': 'i', 'í': 'i', 'ï': 'i', 'î': 'i',
                    'ò': 'o', 'ó': 'o', 'ö': 'o', 'ô': 'o',
                    'ù': 'u', 'ú': 'u', 'ü': 'u', 'û': 'u',
                    'ñ': 'n', 'ç': 'c'
                };
                return accents[match] || match;
            })
            .replace(/\s+/g, '-')        // Replace spaces with hyphens
            .replace(/[^a-z0-9\-]+/g, '') // Remove non-alphanumeric chars except hyphens
            .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
            .replace(/^-+/, '')          // Trim hyphens from start
            .replace(/-+$/, '');         // Trim hyphens from end
        
        // If slug is empty after processing, generate a default one
        if (!slug) {
            slug = 'product-' + Date.now();
        }
        
        return slug;
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.textContent = message;
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
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    // Test Supabase connection manually with comprehensive diagnostics
    async testSupabaseConnection() {
        console.log('🔧 === COMPREHENSIVE SUPABASE DIAGNOSTICS ===');
        console.log('- Connected:', supabaseService.isSupabaseConnected());
        console.log('- Client exists:', !!supabaseService.client);
        console.log('- Supabase URL:', CONFIG.SUPABASE.URL);
        console.log('- Has anon key:', !!CONFIG.SUPABASE.ANON_KEY);
        
        if (supabaseService.isSupabaseConnected()) {
            try {
                // Test 1: Check user authentication
                console.log('\n🔒 Testing authentication...');
                const user = await supabaseService.getCurrentUser();
                console.log('Current user:', user ? user.email : 'Not authenticated');
                
                // Test 2: Test orders table access
                console.log('\n📊 Testing direct query to orders table...');
                const ordersQuery = await supabaseService.client
                    .from('orders')
                    .select('*')
                    .limit(5);
                
                console.log('Orders query result:', ordersQuery);
                console.log('Orders found:', ordersQuery.data?.length || 0);
                
                // Test 3: Test products table access
                console.log('\n📱 Testing direct query to products table...');
                const productsQuery = await supabaseService.client
                    .from('products')
                    .select('*')
                    .limit(5);
                
                console.log('Products query result:', productsQuery);
                console.log('Products found:', productsQuery.data?.length || 0);
                
                // Test 4: Test table existence
                console.log('\n📋 Testing table existence...');
                const tablesQuery = await supabaseService.client
                    .from('information_schema.tables')
                    .select('table_name')
                    .eq('table_schema', 'public');
                
                if (tablesQuery.data) {
                    console.log('Available tables:', tablesQuery.data.map(t => t.table_name));
                }
                
                // Summary
                let summary = [];
                if (ordersQuery.error) {
                    summary.push(`❌ Orders: ${ordersQuery.error.message}`);
                } else {
                    summary.push(`✅ Orders: ${ordersQuery.data?.length || 0} found`);
                }
                
                if (productsQuery.error) {
                    summary.push(`❌ Products: ${productsQuery.error.message}`);
                } else {
                    summary.push(`✅ Products: ${productsQuery.data?.length || 0} found`);
                }
                
                this.showToast(summary.join(' | '), ordersQuery.error || productsQuery.error ? 'error' : 'success');
                
            } catch (error) {
                console.error('Connection test failed:', error);
                this.showToast('Connection test failed', 'error');
            }
        } else {
            console.log('Supabase not connected');
            this.showToast('Supabase not connected', 'error');
        }
    }
    
    // Delete order
    async deleteOrder(orderId) {
        if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return;
        }
        
        try {
            console.log('Deleting order:', orderId);
            
            if (!supabaseService.isSupabaseConnected()) {
                this.showToast('Supabase not connected', 'error');
                return;
            }
            
            // First delete associated order items
            const deleteItemsResult = await supabaseService.client
                .from('order_items')
                .delete()
                .eq('order_id', orderId);
            
            if (deleteItemsResult.error) {
                console.error('Error deleting order items:', deleteItemsResult.error);
                this.showToast('Failed to delete order items: ' + deleteItemsResult.error.message, 'error');
                return;
            }
            
            // Then delete the order
            const deleteOrderResult = await supabaseService.client
                .from('orders')
                .delete()
                .eq('id', orderId);
            
            if (deleteOrderResult.error) {
                console.error('Error deleting order:', deleteOrderResult.error);
                this.showToast('Failed to delete order: ' + deleteOrderResult.error.message, 'error');
                return;
            }
            
            this.showToast('Order deleted successfully', 'success');
            
            // Refresh the orders list
            await this.loadOrders();
            
            // Also refresh dashboard if on dashboard
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
            
        } catch (error) {
            console.error('Error deleting order:', error);
            this.showToast('Error deleting order: ' + error.message, 'error');
        }
    }
    
    // View order details
    async viewOrder(orderId) {
        try {
            const orders = await supabaseService.getOrders();
            const order = orders.find(o => o.id == orderId);
            
            if (!order) {
                alert('Order not found');
                return;
            }
            
            this.showOrderDetailsModal(order);
        } catch (error) {
            console.error('Error viewing order:', error);
            alert('Error loading order details');
        }
    }
    
    // Show order details modal
    showOrderDetailsModal(order) {
        const shippingAddress = order.shipping_address || {};
        const customerInfo = shippingAddress.customer_info || {};
        
        const modalHtml = `
            <div class="order-details-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="order-details-content" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                ">
                    <div class="modal-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1.5rem;
                        padding-bottom: 1rem;
                        border-bottom: 2px solid #e9ecef;
                    ">
                        <h2 style="margin: 0; color: #333;">Order Details</h2>
                        <button onclick="this.closest('.order-details-modal').remove()" style="
                            background: none;
                            border: none;
                            font-size: 2rem;
                            cursor: pointer;
                            color: #666;
                        ">&times;</button>
                    </div>
                    
                    <div class="order-info-grid" style="display: grid; gap: 1.5rem;">
                        <!-- Order Summary -->
                        <div class="info-section">
                            <h3 style="color: #667eea; margin-bottom: 1rem; border-left: 4px solid #667eea; padding-left: 1rem;">Order Summary</h3>
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <p><strong>Order Number:</strong> #${order.order_number || order.id}</p>
                                <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                                <p><strong>Status:</strong> <span style="
                                    padding: 0.25rem 0.75rem;
                                    border-radius: 15px;
                                    font-size: 0.8rem;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    background: #fff3cd;
                                    color: #856404;
                                ">${order.status || 'pending'}</span></p>
                                <p><strong>Total Amount:</strong> <span style="color: #10ac84; font-weight: bold; font-size: 1.1rem;">₹${parseFloat(order.total).toFixed(2)}</span></p>
                            </div>
                        </div>
                        
                        <!-- Customer Information -->
                        <div class="info-section">
                            <h3 style="color: #667eea; margin-bottom: 1rem; border-left: 4px solid #667eea; padding-left: 1rem;">Customer Information</h3>
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <p><strong>Name:</strong> ${order.customer_name}</p>
                                <p><strong>Email:</strong> <a href="mailto:${order.customer_email}" style="color: #667eea;">${order.customer_email}</a></p>
                                <p><strong>Phone:</strong> <a href="tel:${order.customer_phone || 'N/A'}" style="color: #667eea;">${order.customer_phone || 'Not provided'}</a></p>
                            </div>
                        </div>
                        
                        <!-- Shipping Information -->
                        <div class="info-section">
                            <h3 style="color: #667eea; margin-bottom: 1rem; border-left: 4px solid #667eea; padding-left: 1rem;">Shipping Information</h3>
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <p><strong>Address:</strong> ${shippingAddress.address || 'Not provided'}</p>
                                <p><strong>City:</strong> ${shippingAddress.city || 'Not provided'}</p>
                                <p><strong>State:</strong> ${shippingAddress.state || 'Not provided'}</p>
                                <p><strong>Pincode:</strong> <span style="background: #e3f2fd; color: #1976d2; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold;">${shippingAddress.zip || 'Not provided'}</span></p>
                                <p><strong>Country:</strong> ${shippingAddress.country || 'India'}</p>
                            </div>
                        </div>
                        
                        <!-- Payment Information -->
                        <div class="info-section">
                            <h3 style="color: #667eea; margin-bottom: 1rem; border-left: 4px solid #667eea; padding-left: 1rem;">Payment Information</h3>
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <p><strong>Payment Method:</strong> <span style="background: #d4edda; color: #155724; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: bold;">Cash on Delivery</span></p>
                                <p><strong>Amount to Collect:</strong> <span style="color: #dc3545; font-weight: bold; font-size: 1.1rem;">₹${parseFloat(order.total).toFixed(2)}</span></p>
                            </div>
                        </div>
                        
                        <!-- Order Breakdown -->
                        <div class="info-section">
                            <h3 style="color: #667eea; margin-bottom: 1rem; border-left: 4px solid #667eea; padding-left: 1rem;">Order Breakdown</h3>
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6;">
                                    <span>Product(s) Total:</span>
                                    <span style="font-weight: 500;">₹${(parseFloat(order.total) - 25).toFixed(2)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6;">
                                    <span>Shipping:</span>
                                    <span style="font-weight: 500;">₹25.00</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6;">
                                    <span>Tax:</span>
                                    <span style="font-weight: 500;">₹0.00</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; font-weight: bold; font-size: 1.1rem; border-top: 2px solid #667eea; color: #10ac84;">
                                    <span>Total:</span>
                                    <span>₹${parseFloat(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="info-section">
                            ${order.status === 'delivered' ? `
                                <div style="text-align: center; padding: 1.5rem; background: #d4edda; border-radius: 10px; color: #155724; margin-bottom: 1rem;">
                                    <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                                    <h4 style="margin: 0;">Order Delivered Successfully!</h4>
                                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">This order has been completed and delivered to the customer.</p>
                                </div>
                            ` : `
                                <!-- Primary Delivered Button -->
                                <div style="text-align: center; margin-bottom: 1.5rem;">
                                    <button onclick="adminPanel.updateOrderStatus('${order.id}', 'delivered')" style="
                                        padding: 1rem 2rem;
                                        background: linear-gradient(135deg, #10ac84 0%, #0fb378 100%);
                                        color: white;
                                        border: none;
                                        border-radius: 30px;
                                        cursor: pointer;
                                        font-weight: 700;
                                        font-size: 1.1rem;
                                        transition: all 0.3s ease;
                                        box-shadow: 0 4px 15px rgba(16, 172, 132, 0.3);
                                        text-transform: uppercase;
                                        letter-spacing: 0.5px;
                                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(16, 172, 132, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(16, 172, 132, 0.3)'">
                                        ✅ Mark as Delivered & Remove from Pending
                                    </button>
                                </div>
                                
                                <!-- Other Status Buttons -->
                                <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
                                    <button onclick="adminPanel.updateOrderStatus('${order.id}', 'processing')" style="
                                        padding: 0.5rem 1rem;
                                        background: #28a745;
                                        color: white;
                                        border: none;
                                        border-radius: 20px;
                                        cursor: pointer;
                                        font-weight: 500;
                                        font-size: 0.9rem;
                                        transition: all 0.3s ease;
                                    ">Processing</button>
                                    <button onclick="adminPanel.updateOrderStatus('${order.id}', 'shipped')" style="
                                        padding: 0.5rem 1rem;
                                        background: #17a2b8;
                                        color: white;
                                        border: none;
                                        border-radius: 20px;
                                        cursor: pointer;
                                        font-weight: 500;
                                        font-size: 0.9rem;
                                        transition: all 0.3s ease;
                                    ">Shipped</button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    // Update order status
    async updateOrderStatus(orderId, newStatus) {
        try {
            // Update status in database
            const result = await supabaseService.updateOrderStatus(orderId, newStatus);
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                
                // Close modal
                const modal = document.querySelector('.order-details-modal');
                if (modal) {
                    modal.remove();
                }
                
                // Refresh orders list and dashboard
                await this.loadOrders();
                await this.loadDashboardData();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showNotification('Error updating order status', 'error');
        }
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Add some basic styles for admin notifications and table elements
const adminStyles = `
    .admin-notification {
        animation: slideInRight 0.3s ease;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    
    .order-item, .stock-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e9ecef;
    }
    
    .status-pending { color: #f39c12; }
    .status-processing { color: #3498db; }
    .status-shipped { color: #27ae60; }
    .status-delivered { color: #2ecc71; }
    .status-cancelled { color: #e74c3c; }
    .status-new { color: #e74c3c; font-weight: bold; }
    .status-active { color: #27ae60; }
    
    .stock-low { color: #e74c3c; font-weight: bold; }
    .stock-critical { color: #c0392b; font-weight: bold; background: #fadbd8; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .stock-count { font-size: 0.9rem; }
    
    .low-stock-list .stock-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #e9ecef;
    }
    
    .low-stock-list .stock-item:last-child {
        border-bottom: none;
    }
    
    .low-stock-list .product-info strong {
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .low-stock-list .product-info small {
        color: #666;
        font-size: 0.8rem;
    }
    
    .btn-small {
        padding: 0.25rem 0.5rem;
        margin: 0 0.125rem;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
    }
    
    .btn-small:hover { background: #f8f9fa; }
    .btn-danger { color: #e74c3c; border-color: #e74c3c; }
    .btn-danger:hover { background: #e74c3c; color: white; }
    
    .product-info strong { display: block; }
    .product-info small { color: #666; }
    
    .dashboard-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .stat-content h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.8rem;
        color: #333;
    }
    
    .stat-content p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
    }
    
    .dashboard-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    
    .table-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    
    .table-controls input,
    .table-controls select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
    
    .developer-credit {
        margin-top: 2rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        text-align: center;
        border-left: 4px solid #667eea;
    }
    
    .developer-credit p {
        margin: 0;
        color: #333;
        font-size: 0.9rem;
    }
    
    .login-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .login-form {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        width: 100%;
        max-width: 400px;
    }
    
    .login-form h2 {
        text-align: center;
        margin-bottom: 1.5rem;
        color: #333;
    }
    
    .login-form input {
        width: 100%;
        padding: 12px;
        margin-bottom: 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
    }
    
    .login-form input:focus {
        outline: none;
        border-color: #667eea;
    }
    
    .login-form button {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .login-form button:hover {
        transform: translateY(-2px);
    }
    
    /* Slideshow Management Styles */
    .preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        padding: 1rem 0;
    }
    
    .slide-item {
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    }
    
    .slide-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .slide-preview {
        position: relative;
        height: 200px;
        overflow: hidden;
    }
    
    .slide-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }
    
    .slide-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .slide-item:hover .slide-overlay {
        opacity: 1;
    }
    
    .slide-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .slide-actions .btn-small {
        background: rgba(255, 255, 255, 0.9);
        color: #333;
        border: none;
        padding: 0.5rem;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }
    
    .slide-actions .btn-small:hover {
        background: white;
        transform: scale(1.1);
    }
    
    .slide-actions .btn-small:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .slide-actions .btn-small:disabled:hover {
        transform: none;
    }
    
    .slide-info {
        padding: 1rem;
        text-align: center;
    }
    
    .slide-number {
        font-weight: 600;
        color: #667eea;
    }
    
    .form-help {
        display: block;
        font-size: 0.8rem;
        color: #666;
        margin-top: 0.25rem;
    }
    
    .image-preview {
        margin-top: 1rem;
        text-align: center;
    }
`;

// Inject admin styles
const styleEl = document.createElement('style');
styleEl.textContent = adminStyles;
document.head.appendChild(styleEl);
