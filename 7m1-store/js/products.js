// Products functionality for 7M1 Store

class ProductsManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentFilters = {
            category: '',
            search: '',
            sortBy: 'name',
            minPrice: null,
            maxPrice: null
        };
        this.currentPage = 0;
        this.productsPerPage = CONFIG.APP.ITEMS_PER_PAGE;
        this.loading = false;
        this.hasMore = true;
        this.init();
    }

    async init() {
        try {
            await this.loadCategories();
            await this.loadProducts();
            this.bindEvents();
            this.renderProducts();
            this.renderCategories();
        } catch (error) {
            console.error('Error initializing products:', error);
        }
    }

    // Load categories from database
    async loadCategories() {
        try {
            // First, try to get categories from Supabase
            const dbCategories = await supabaseService.getCategories();
            
            console.log('🔍 Database categories:', dbCategories);
            console.log('📋 CONFIG categories:', CONFIG.CATEGORIES);
            
            // Always merge CONFIG images with database categories to ensure images display
            if (dbCategories && dbCategories.length > 0 && dbCategories !== CONFIG.CATEGORIES) {
                console.log('🔄 Merging database categories with CONFIG images...');
                
                // Create a map of config categories for easy lookup, including special mapping
                const configCategoryMap = new Map();
                CONFIG.CATEGORIES.forEach(cat => {
                    configCategoryMap.set(cat.name.toLowerCase(), cat);
                });
                
                // Special mapping: "Home & Kitchen" in DB should show as "Food & Beverages" on website
                const categoryMapping = {
                    'home & kitchen': 'food & beverages'
                };
                
                this.categories = dbCategories.map(dbCat => {
                    // Check if this DB category should be renamed for display
                    const displayName = categoryMapping[dbCat.name.toLowerCase()] || dbCat.name.toLowerCase();
                    const configCat = configCategoryMap.get(displayName);
                    
                    console.log(`🔄 Mapping DB category '${dbCat.name}' to display as '${configCat ? configCat.name : dbCat.name}'`);
                    
                    return {
                        ...dbCat,
                        // Use CONFIG name for display if mapping exists
                        name: configCat ? configCat.name : dbCat.name,
                        db_name: dbCat.name, // Keep original DB name for filtering
                        image: configCat ? configCat.image : (dbCat.image || null),
                        icon: configCat ? configCat.icon : (dbCat.icon || 'fas fa-tag')
                    };
                });
                
                // Add any CONFIG categories that aren't in the database
                CONFIG.CATEGORIES.forEach(configCat => {
                    const existsInDb = dbCategories.some(dbCat => {
                        const displayName = categoryMapping[dbCat.name.toLowerCase()] || dbCat.name.toLowerCase();
                        return displayName === configCat.name.toLowerCase();
                    });
                    
                    if (!existsInDb) {
                        console.log(`➕ Adding missing category from CONFIG: ${configCat.name}`);
                        this.categories.push(configCat);
                    }
                });
            } else {
                // Use CONFIG categories directly if no database categories or if they're identical
                console.log('📂 Using CONFIG categories directly');
                this.categories = CONFIG.CATEGORIES;
            }
            
            console.log('✅ Final categories loaded:', this.categories.length);
            console.log('🖼️ Categories with images:', this.categories.filter(cat => cat.image).map(cat => cat.name));
        } catch (error) {
            console.error('❌ Error loading categories:', error);
            this.categories = CONFIG.CATEGORIES;
        }
    }

    // Load products from database
    async loadProducts(append = false) {
        if (this.loading) return;

        try {
            this.loading = true;
            this.showLoading();

            const filters = {
                ...this.currentFilters,
                limit: this.productsPerPage,
                offset: append ? this.currentPage * this.productsPerPage : 0
            };

            const newProducts = await supabaseService.getProducts(filters);

            if (append) {
                this.products = [...this.products, ...newProducts];
            } else {
                this.products = newProducts;
                this.currentPage = 0;
            }

            this.hasMore = newProducts.length === this.productsPerPage;

            if (!append) {
                this.renderProducts();
            } else {
                this.appendProducts(newProducts);
            }

            this.updateLoadMoreButton();

        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Error loading products. Please try again.');
        } finally {
            this.loading = false;
            this.hideLoading();
        }
    }

    // Render categories
    renderCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        const categoryFilter = document.getElementById('category-filter');

        console.log('🎨 Rendering categories:', this.categories);
        console.log('🖼️ Categories with images:', this.categories.filter(cat => cat.image));

        if (categoriesGrid) {
            categoriesGrid.innerHTML = this.categories.map(category => {
                console.log(`Rendering category ${category.name}:`, { image: category.image, icon: category.icon });
                
                return `
                    <div class="category-card" data-category="${category.name}">
                        <div class="category-image">
                            ${category.image ? 
                                `<img src="${category.image}" alt="${category.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" onerror="console.error('Failed to load image for ${category.name}:', this.src);">` : 
                                `<i class="${category.icon}"></i>`
                            }
                        </div>
                        <div class="category-content">
                            <h3>${category.name}</h3>
                            <p>Explore our ${category.name.toLowerCase()} collection</p>
                        </div>
                    </div>
                `;
            }).join('');

            // Bind category card clicks
            categoriesGrid.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', () => {
                    const category = card.dataset.category;
                    this.filterByCategory(category);
                    this.scrollToProducts();
                });
            });
        }

        if (categoryFilter) {
            categoryFilter.innerHTML = `
                <option value="">All Categories</option>
                ${this.categories.map(cat => `
                    <option value="${cat.name}">${cat.name}</option>
                `).join('')}
            `;
        }
    }

    // Render products
    renderProducts() {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <p>${CONFIG.MESSAGES.NO_PRODUCTS}</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
    }

    // Append new products to existing grid
    appendProducts(newProducts) {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;

        const newProductsHTML = newProducts.map(product => this.createProductCard(product)).join('');
        productsGrid.insertAdjacentHTML('beforeend', newProductsHTML);
    }

    // Create product card HTML
    createProductCard(product) {
        const badgeHTML = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
        const imageHTML = product.image 
            ? `<img src="${product.image}" alt="${product.name}">`
            : `<i class="fas fa-image"></i>`;

        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    ${imageHTML}
                    ${badgeHTML}
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${CONFIG.APP.CURRENCY_SYMBOL}${product.price.toFixed(2)}</div>
                    <div class="product-actions">
                        <button class="add-to-cart-btn" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                            Add to Cart
                        </button>
                        <button class="view-product-btn" data-id="${product.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper method to convert display category name to database category name
    getDbCategoryName(displayName) {
        // Reverse mapping: "Food & Beverages" display -> "Home & Kitchen" in DB
        const reverseMapping = {
            'Food & Beverages': 'Home & Kitchen'
        };
        return reverseMapping[displayName] || displayName;
    }

    // Helper method to convert database category name to display category name
    getDisplayCategoryName(dbName) {
        // Forward mapping: "Home & Kitchen" in DB -> "Food & Beverages" display
        const displayMapping = {
            'Home & Kitchen': 'Food & Beverages'
        };
        return displayMapping[dbName] || dbName;
    }

    // Filter products by category
    filterByCategory(category) {
        // Convert display category name to database category name for querying
        const dbCategoryName = this.getDbCategoryName(category);
        console.log(`🔍 Filtering by display category '${category}' -> DB category '${dbCategoryName}'`);
        
        this.currentFilters.category = dbCategoryName;
        this.currentPage = 0;
        this.loadProducts();
        
        // Update filter UI (use display name)
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.value = category;
        }
    }

    // Search products
    searchProducts(query) {
        this.currentFilters.search = query;
        this.currentPage = 0;
        this.loadProducts();
    }

    // Sort products
    sortProducts(sortBy) {
        this.currentFilters.sortBy = sortBy;
        this.currentPage = 0;
        this.loadProducts();
    }

    // Load more products
    loadMore() {
        if (this.hasMore && !this.loading) {
            this.currentPage++;
            this.loadProducts(true);
        }
    }

    // Update load more button visibility
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
        }
    }

    // Show product details modal
    async showProductDetails(productId) {
        try {
            const product = await supabaseService.getProduct(productId);
            if (!product) {
                this.showNotification('Product not found', 'error');
                return;
            }

            this.openProductModal(product);
        } catch (error) {
            console.error('Error loading product details:', error);
            this.showNotification('Error loading product details', 'error');
        }
    }

    // Open product modal
    openProductModal(product) {
        const productModal = document.getElementById('product-modal');
        const modalTitle = document.getElementById('product-modal-title');
        const modalContent = document.getElementById('product-modal-content');

        if (!productModal || !modalTitle || !modalContent) return;

        modalTitle.textContent = product.name;

        const imageHTML = product.image 
            ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; max-width: 300px; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">`
            : `<div style="width: 100%; max-width: 300px; height: 250px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #adb5bd; font-size: 3rem; margin-bottom: 1rem;"><i class="fas fa-image"></i></div>`;

        const badgeHTML = product.badge ? `<span class="product-badge" style="display: inline-block; background: #ff6b6b; color: white; padding: 0.25rem 0.5rem; border-radius: 15px; font-size: 0.8rem; margin-bottom: 1rem;">${product.badge}</span>` : '';

        modalContent.innerHTML = `
            <div style="text-align: center;">
                ${imageHTML}
                ${badgeHTML}
                <div style="text-align: left;">
                    <p style="color: #666; margin-bottom: 1rem; line-height: 1.6;">${product.description}</p>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #667eea; margin-bottom: 1rem;">
                        ${CONFIG.APP.CURRENCY_SYMBOL}${product.price.toFixed(2)}
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong>Category:</strong> ${this.getDisplayCategoryName(product.category)}
                    </div>
                    ${product.stock ? `<div style="margin-bottom: 1rem; color: ${product.stock > 10 ? '#10ac84' : product.stock > 0 ? '#ff9500' : '#ee5a24'};">
                        <strong>Stock:</strong> ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                    </div>` : ''}
                    <button class="add-to-cart-btn primary-btn" data-id="${product.id}" style="width: 100%; padding: 1rem; font-size: 1.1rem; margin-top: 1rem;">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;

        productModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Close product modal
    closeProductModal() {
        const productModal = document.getElementById('product-modal');
        if (productModal) {
            productModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Show loading state
    showLoading() {
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid && this.currentPage === 0) {
            productsGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>${CONFIG.MESSAGES.LOADING}</p>
                </div>
            `;
        }
    }

    // Hide loading state
    hideLoading() {
        // Loading state is hidden when products are rendered
    }

    // Show error message
    showError(message) {
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="primary-btn">Retry</button>
                </div>
            `;
        }
    }

    // Scroll to products section
    scrollToProducts() {
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Use the cart's notification method
        if (window.cart) {
            window.cart.showNotification(message, type);
        }
    }

    // Debounce function for search
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Bind events
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');

        if (searchInput) {
            const debouncedSearch = this.debounce((query) => {
                this.searchProducts(query);
            }, CONFIG.API.SEARCH_DELAY);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value.trim());
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchProducts(e.target.value.trim());
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput ? searchInput.value.trim() : '';
                this.searchProducts(query);
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.sortProducts(e.target.value);
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMore();
            });
        }

        // Product view buttons (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-product-btn') || e.target.closest('.view-product-btn')) {
                const btn = e.target.classList.contains('view-product-btn') ? e.target : e.target.closest('.view-product-btn');
                const productId = parseInt(btn.dataset.id);
                
                if (productId) {
                    this.showProductDetails(productId);
                }
            }
        });

        // Close product modal
        const closeProductBtn = document.getElementById('close-product');
        if (closeProductBtn) {
            closeProductBtn.addEventListener('click', () => {
                this.closeProductModal();
            });
        }

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const productModal = document.getElementById('product-modal');
            if (productModal && e.target === productModal) {
                this.closeProductModal();
            }
        });

        // CTA button in hero section
        const ctaBtn = document.querySelector('.cta-btn');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', () => {
                this.scrollToProducts();
            });
        }

        // Smooth scroll for navigation links
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
                    }
                }
            });
        });
    }

    // Get featured products
    async getFeaturedProducts(limit = 6) {
        try {
            return await supabaseService.getProducts({ 
                featured: true, 
                limit 
            });
        } catch (error) {
            console.error('Error loading featured products:', error);
            return CONFIG.SAMPLE_PRODUCTS.filter(p => p.featured).slice(0, limit);
        }
    }

    // Get products by category
    async getProductsByCategory(category, limit = null) {
        try {
            return await supabaseService.getProducts({ 
                category, 
                limit 
            });
        } catch (error) {
            console.error('Error loading products by category:', error);
            return CONFIG.SAMPLE_PRODUCTS
                .filter(p => p.category.toLowerCase() === category.toLowerCase())
                .slice(0, limit || CONFIG.SAMPLE_PRODUCTS.length);
        }
    }
}

// Create global products manager instance
window.productsManager = new ProductsManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductsManager;
}
