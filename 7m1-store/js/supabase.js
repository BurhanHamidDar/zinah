// Supabase client setup and database functions for 7M1 Store

class SupabaseService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.init();
    }

    // Initialize Supabase client
    init() {
        try {
            // Check if Supabase is configured
            if (CONFIG.SUPABASE.URL === 'YOUR_SUPABASE_URL' || CONFIG.SUPABASE.ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
                console.warn('Supabase not configured. Using local storage fallback.');
                this.isConnected = false;
                return;
            }

            // Initialize Supabase client
            this.client = supabase.createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
            this.isConnected = true;
            console.log('Supabase client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
            this.isConnected = false;
        }
    }

    // Check if Supabase is connected
    isSupabaseConnected() {
        return this.isConnected && this.client !== null;
    }

    // Products CRUD operations with enhanced admin access
    async getProducts(filters = {}) {
        if (!this.isSupabaseConnected()) {
            // Return sample products if Supabase is not connected
            return this.getSampleProducts(filters);
        }

        try {
            console.log('📱 Fetching products from Supabase...');
            let query = this.client.from('products').select('*');

            // Apply filters
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            
            if (filters.featured) {
                query = query.eq('featured', true);
            }
            
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }
            
            if (filters.minPrice) {
                query = query.gte('price', filters.minPrice);
            }
            
            if (filters.maxPrice) {
                query = query.lte('price', filters.maxPrice);
            }

            // Apply sorting
            if (filters.sortBy) {
                switch (filters.sortBy) {
                    case 'price-low':
                        query = query.order('price', { ascending: true });
                        break;
                    case 'price-high':
                        query = query.order('price', { ascending: false });
                        break;
                    case 'newest':
                        query = query.order('created_at', { ascending: false });
                        break;
                    default:
                        query = query.order('name', { ascending: true });
                }
            }

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
            }

            // Execute query with RLS handling
            let { data, error } = await query;
            
            // Handle RLS issues for admin access
            if (error && (error.message.includes('RLS') || error.message.includes('permission') || error.code === 'PGRST116')) {
                console.log('⚠️ RLS detected for products, trying simpler query...');
                
                // Try basic query without complex filters
                const simpleQuery = await this.client
                    .from('products')
                    .select('id, name, description, price, category, stock, image, featured, badge, is_active, created_at')
                    .order('name', { ascending: true });
                
                data = simpleQuery.data;
                error = simpleQuery.error;
            }

            if (error) {
                console.error('❌ Products query error:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                console.log('📊 This might be an RLS policy issue. Check your Supabase RLS policies for the products table.');
                return this.getSampleProducts(filters);
            }
            
            console.log('✅ Successfully fetched products:', data?.length || 0);
            if (data && data.length > 0) {
                console.log('📱 First product sample:', data[0]);
            }
            return data || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            return this.getSampleProducts(filters);
        }
    }

    // Get sample products (fallback when Supabase is not connected)
    getSampleProducts(filters = {}) {
        let products = [...CONFIG.SAMPLE_PRODUCTS];

        // Apply filters
        if (filters.category) {
            products = products.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
        }
        
        if (filters.featured) {
            products = products.filter(p => p.featured);
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filters.minPrice) {
            products = products.filter(p => p.price >= filters.minPrice);
        }
        
        if (filters.maxPrice) {
            products = products.filter(p => p.price <= filters.maxPrice);
        }

        // Apply sorting
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'price-low':
                    products.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    products.sort((a, b) => b.price - a.price);
                    break;
                case 'newest':
                    // For sample data, reverse order to simulate newest first
                    products.reverse();
                    break;
                default:
                    products.sort((a, b) => a.name.localeCompare(b.name));
            }
        }

        // Apply pagination
        if (filters.offset || filters.limit) {
            const start = filters.offset || 0;
            const end = start + (filters.limit || products.length);
            products = products.slice(start, end);
        }

        return products;
    }

    // Get single product by ID
    async getProduct(id) {
        if (!this.isSupabaseConnected()) {
            return CONFIG.SAMPLE_PRODUCTS.find(p => p.id == id) || null;
        }

        try {
            const { data, error } = await this.client
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching product:', error);
            return CONFIG.SAMPLE_PRODUCTS.find(p => p.id == id) || null;
        }
    }

    // Delete product by ID with foreign key constraint handling
    async deleteProduct(id) {
        if (!this.isSupabaseConnected()) {
            console.log('Product delete simulated:', id);
            return { success: true, message: 'Product deleted (simulated)' };
        }

        try {
            // First, check if this product has any order items
            const { data: orderItems, error: checkError } = await this.client
                .from('order_items')
                .select('id')
                .eq('product_id', id)
                .limit(1);

            if (checkError) {
                console.log('Could not check order items, proceeding with delete:', checkError);
            }

            // If product has orders, use soft delete instead of hard delete
            if (orderItems && orderItems.length > 0) {
                console.log(`Product ${id} has existing orders, using soft delete...`);
                
                const { error: updateError } = await this.client
                    .from('products')
                    .update({ 
                        is_active: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (updateError) throw updateError;

                return { 
                    success: true, 
                    message: 'Product deactivated successfully (has existing orders)' 
                };
            } else {
                // No orders, safe to hard delete
                const { error } = await this.client
                    .from('products')
                    .delete()
                    .eq('id', id);

                if (error) {
                    // If still fails due to foreign key, fall back to soft delete
                    if (error.message.includes('foreign key') || error.message.includes('violates')) {
                        console.log('Foreign key constraint detected, using soft delete fallback...');
                        
                        const { error: updateError } = await this.client
                            .from('products')
                            .update({ 
                                is_active: false,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', id);

                        if (updateError) throw updateError;

                        return { 
                            success: true, 
                            message: 'Product deactivated successfully (foreign key constraint)' 
                        };
                    }
                    throw error;
                }

                return { success: true, message: 'Product deleted successfully' };
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            return { 
                success: false, 
                message: 'Error deleting product: ' + error.message 
            };
        }
    }

    // Slideshow Images CRUD operations
    async getSlideshowImages() {
        if (!this.isSupabaseConnected()) {
            // Fallback to localStorage if Supabase is not connected
            try {
                const saved = localStorage.getItem('hero_slideshow_images');
                return JSON.parse(saved || '[]');
            } catch {
                return [];
            }
        }

        try {
            const { data, error } = await this.client
                .from('slideshow_images')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching slideshow images:', error);
            // Fallback to localStorage
            try {
                const saved = localStorage.getItem('hero_slideshow_images');
                return JSON.parse(saved || '[]');
            } catch {
                return [];
            }
        }
    }

    // Add slideshow image
    async addSlideshowImage(imageData) {
        if (!this.isSupabaseConnected()) {
            // Fallback to localStorage
            try {
                let saved = JSON.parse(localStorage.getItem('hero_slideshow_images') || '[]');
                saved.push(imageData.image_url);
                localStorage.setItem('hero_slideshow_images', JSON.stringify(saved));
                return { success: true, message: 'Image added successfully (localStorage)' };
            } catch (error) {
                return { success: false, message: 'Error saving to localStorage: ' + error.message };
            }
        }

        try {
            // Get current max order
            const { data: maxOrder } = await this.client
                .from('slideshow_images')
                .select('display_order')
                .order('display_order', { ascending: false })
                .limit(1);

            const nextOrder = (maxOrder && maxOrder[0]) ? maxOrder[0].display_order + 1 : 1;

            const { error } = await this.client
                .from('slideshow_images')
                .insert({
                    image_url: imageData.image_url,
                    alt_text: imageData.alt_text || '',
                    display_order: nextOrder,
                    is_active: true
                });

            if (error) throw error;
            return { success: true, message: 'Slideshow image added successfully' };
        } catch (error) {
            console.error('Error adding slideshow image:', error);
            return { success: false, message: 'Error adding slideshow image: ' + error.message };
        }
    }

    // Update slideshow image
    async updateSlideshowImage(id, imageData) {
        if (!this.isSupabaseConnected()) {
            // For localStorage, we'll need to handle this differently
            try {
                let saved = JSON.parse(localStorage.getItem('hero_slideshow_images') || '[]');
                if (saved[id]) {
                    saved[id] = imageData.image_url;
                    localStorage.setItem('hero_slideshow_images', JSON.stringify(saved));
                    return { success: true, message: 'Image updated successfully (localStorage)' };
                }
                return { success: false, message: 'Image not found' };
            } catch (error) {
                return { success: false, message: 'Error updating localStorage: ' + error.message };
            }
        }

        try {
            const { error } = await this.client
                .from('slideshow_images')
                .update({
                    image_url: imageData.image_url,
                    alt_text: imageData.alt_text || '',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true, message: 'Slideshow image updated successfully' };
        } catch (error) {
            console.error('Error updating slideshow image:', error);
            return { success: false, message: 'Error updating slideshow image: ' + error.message };
        }
    }

    // Delete slideshow image
    async deleteSlideshowImage(id) {
        if (!this.isSupabaseConnected()) {
            // For localStorage
            try {
                let saved = JSON.parse(localStorage.getItem('hero_slideshow_images') || '[]');
                if (typeof id === 'number' && saved[id]) {
                    saved.splice(id, 1);
                    localStorage.setItem('hero_slideshow_images', JSON.stringify(saved));
                    return { success: true, message: 'Image deleted successfully (localStorage)' };
                }
                return { success: false, message: 'Image not found' };
            } catch (error) {
                return { success: false, message: 'Error updating localStorage: ' + error.message };
            }
        }

        try {
            const { error } = await this.client
                .from('slideshow_images')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true, message: 'Slideshow image deleted successfully' };
        } catch (error) {
            console.error('Error deleting slideshow image:', error);
            return { success: false, message: 'Error deleting slideshow image: ' + error.message };
        }
    }

    // Reorder slideshow images
    async reorderSlideshowImages(imageIds) {
        if (!this.isSupabaseConnected()) {
            // For localStorage, we assume imageIds is the new array order
            try {
                localStorage.setItem('hero_slideshow_images', JSON.stringify(imageIds));
                return { success: true, message: 'Images reordered successfully (localStorage)' };
            } catch (error) {
                return { success: false, message: 'Error reordering: ' + error.message };
            }
        }

        try {
            // Update display_order for each image
            const updates = imageIds.map((id, index) => 
                this.client
                    .from('slideshow_images')
                    .update({ display_order: index + 1 })
                    .eq('id', id)
            );

            await Promise.all(updates);
            return { success: true, message: 'Images reordered successfully' };
        } catch (error) {
            console.error('Error reordering slideshow images:', error);
            return { success: false, message: 'Error reordering images: ' + error.message };
        }
    }

    // Create/Update product
    async saveProduct(productData, productId = null) {
        if (!this.isSupabaseConnected()) {
            console.log('Product save simulated:', productData);
            return { success: true, message: 'Product saved (simulated)' };
        }

        try {
            // Ensure all required fields are present
            const cleanedData = {
                name: productData.name || 'Untitled Product',
                slug: productData.slug || 'product-' + Date.now(),
                description: productData.description || '',
                price: Number(productData.price) || 0,
                category: productData.category || 'General',
                stock: Number(productData.stock) || 0,
                image: productData.image || null,
                featured: Boolean(productData.featured),
                badge: productData.badge || null,
                is_active: Boolean(productData.is_active !== false), // Default to true
                stock_status: productData.stock > 0 ? 'in_stock' : 'out_of_stock'
            };

            let result;
            
            if (productId) {
                // Update existing product
                const { data, error } = await this.client
                    .from('products')
                    .update(cleanedData)
                    .eq('id', productId)
                    .select()
                    .single();
                result = { data, error };
            } else {
                // Create new product
                const { data, error } = await this.client
                    .from('products')
                    .insert([cleanedData])
                    .select()
                    .single();
                result = { data, error };
            }

            if (result.error) {
                // Handle specific database errors
                if (result.error.message.includes('duplicate key')) {
                    throw new Error('A product with this name already exists. Please use a different name.');
                }
                if (result.error.message.includes('null value in column')) {
                    throw new Error('Missing required field. Please fill in all required fields.');
                }
                if (result.error.message.includes('permission denied') || result.error.message.includes('RLS')) {
                    throw new Error('You do not have permission to perform this action. Please check your authentication.');
                }
                throw result.error;
            }

            return { 
                success: true, 
                message: productId ? 'Product updated successfully' : 'Product created successfully',
                product: result.data
            };
        } catch (error) {
            console.error('Error saving product:', error);
            let errorMessage = 'Error saving product';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            return { success: false, message: errorMessage };
        }
    }

    // Categories operations
    async getCategories() {
        if (!this.isSupabaseConnected()) {
            return CONFIG.CATEGORIES;
        }

        try {
            const { data, error } = await this.client
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || CONFIG.CATEGORIES;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return CONFIG.CATEGORIES;
        }
    }

    // Save category (create or update)
    async saveCategory(categoryData, categoryId = null) {
        if (!this.isSupabaseConnected()) {
            console.log('Category save simulated:', categoryData);
            return { success: true, message: 'Category saved (simulated)' };
        }

        try {
            const cleanedData = {
                name: categoryData.name || 'Untitled Category',
                slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
                description: categoryData.description || '',
                image: categoryData.image || null,
                icon: categoryData.icon || 'fas fa-tag',
                is_active: Boolean(categoryData.is_active !== false)
            };

            let result;
            
            if (categoryId) {
                // Update existing category
                const { data, error } = await this.client
                    .from('categories')
                    .update(cleanedData)
                    .eq('id', categoryId)
                    .select()
                    .single();
                result = { data, error };
            } else {
                // Create new category
                const { data, error } = await this.client
                    .from('categories')
                    .insert([cleanedData])
                    .select()
                    .single();
                result = { data, error };
            }

            if (result.error) {
                if (result.error.message.includes('duplicate key')) {
                    throw new Error('A category with this name already exists.');
                }
                throw result.error;
            }

            return { 
                success: true, 
                message: categoryId ? 'Category updated successfully' : 'Category created successfully',
                category: result.data
            };
        } catch (error) {
            console.error('Error saving category:', error);
            return { success: false, message: error.message || 'Error saving category' };
        }
    }



    // Order operations
    async createOrder(orderData) {
        if (!this.isSupabaseConnected()) {
            // Simulate order creation
            const orderNumber = 'ORD-' + Date.now();
            console.log('Order created (simulated):', { orderNumber, ...orderData });
            return { 
                success: true, 
                orderNumber,
                message: CONFIG.MESSAGES.ORDER_SUCCESS 
            };
        }

        try {
            // Debug log the incoming order data
            console.log('📝 Raw order data received:', orderData);
            
            // Validate required fields
            if (!orderData.customerInfo) {
                throw new Error('Customer information is missing');
            }
            
            if (!orderData.customerInfo.email) {
                throw new Error('Customer email is required');
            }
            
            if (!orderData.customerInfo.firstName || !orderData.customerInfo.lastName) {
                throw new Error('Customer first and last name are required');
            }
            
            if (!orderData.shippingAddress) {
                throw new Error('Shipping address is required');
            }
            
            if (!orderData.total || orderData.total <= 0) {
                throw new Error('Order total must be greater than 0');
            }
            
            // Generate a temporary order number (will be replaced by trigger if it works)
            const tempOrderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            // Prepare order data for basic database structure
            const orderInsertData = {
                order_number: tempOrderNumber,
                customer_email: orderData.customerInfo.email,
                customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
                customer_phone: orderData.customerInfo.phone || null,
                total: orderData.total,
                status: 'pending',
                shipping_address: {
                    ...orderData.shippingAddress,
                    customer_info: orderData.customerInfo,
                    payment_method: orderData.paymentMethod
                }
            };
            
            console.log('📦 Prepared order insert data:', orderInsertData);

            // Create order record
            const { data: order, error: orderError } = await this.client
                .from('orders')
                .insert([orderInsertData])
                .select()
                .single();

            if (orderError) {
                console.error('Order insertion error:', orderError);
                console.error('Order error details:', {
                    message: orderError.message,
                    code: orderError.code,
                    details: orderError.details
                });
                throw orderError;
            }
            
            // Update order number if the trigger didn't work
            if (order.order_number === tempOrderNumber) {
                const finalOrderNumber = 'ORD-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + order.id.toString().padStart(6, '0');
                
                const { error: updateError } = await this.client
                    .from('orders')
                    .update({ order_number: finalOrderNumber })
                    .eq('id', order.id);
                
                if (!updateError) {
                    order.order_number = finalOrderNumber;
                }
            }

            // Create order items
            const orderItems = orderData.items.map(item => ({
                order_id: order.id,
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
            }));

            const { error: itemsError } = await this.client
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('Order items insertion error:', itemsError);
                throw itemsError;
            }

            return { 
                success: true, 
                orderNumber: order.order_number || `ORD-${order.id}`,
                orderId: order.id,
                message: CONFIG.MESSAGES.ORDER_SUCCESS 
            };
        } catch (error) {
            console.error('Error creating order:', error);
            
            // Provide more specific error messages
            let errorMessage = CONFIG.MESSAGES.ORDER_ERROR;
            
            if (error.message) {
                if (error.message.includes('null value in column')) {
                    errorMessage = 'Missing required information. Please check all fields and try again.';
                } else if (error.message.includes('foreign key')) {
                    errorMessage = 'Invalid product information. Please refresh and try again.';
                } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
                    errorMessage = 'Authentication required. Please sign in and try again.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            return { success: false, message: errorMessage };
        }
    }

    // Get orders method with enhanced error handling and RLS bypass for admin
    async getOrders(filters = {}) {
        if (!this.isSupabaseConnected()) {
            console.log('🔴 Supabase not connected, returning empty orders array');
            return [];
        }

        try {
            console.log('📊 Fetching orders from Supabase...');
            
            // Try different approaches for admin access
            let query = this.client
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            // Apply filters if provided
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            // First attempt - normal query
            let { data, error } = await query;
            
            // If RLS error, try with service role approach
            if (error && (error.message.includes('RLS') || error.message.includes('permission') || error.code === 'PGRST116')) {
                console.log('⚠️ RLS detected, trying alternative approach...');
                
                // Try with a simpler query first
                const simpleQuery = await this.client
                    .from('orders')
                    .select('id, order_number, customer_name, customer_email, total, status, created_at')
                    .order('created_at', { ascending: false });
                
                data = simpleQuery.data;
                error = simpleQuery.error;
                
                if (error) {
                    console.error('❌ Even simple query failed:', error);
                    // Try with anon key direct access
                    const anonQuery = await this.client
                        .from('orders')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    data = anonQuery.data;
                    error = anonQuery.error;
                }
            }
            
            if (error) {
                console.error('❌ Supabase query error:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                
                // Return empty array but log the issue
                console.log('📊 This might be an RLS policy issue. Check your Supabase RLS policies for the orders table.');
                return [];
            }
            
            console.log('✅ Successfully fetched orders:', data?.length || 0);
            if (data && data.length > 0) {
                console.log('📊 First order sample:', data[0]);
            }
            return data || [];
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            return [];
        }
    }

    // Get customers method (from orders)
    async getCustomers() {
        if (!this.isSupabaseConnected()) {
            return [];
        }

        try {
            const { data, error } = await this.client
                .from('orders')
                .select('customer_email, customer_name, customer_phone, created_at, total')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Group by customer email and aggregate data
            const customerMap = new Map();
            data?.forEach(order => {
                const email = order.customer_email;
                if (!customerMap.has(email)) {
                    customerMap.set(email, {
                        email: email,
                        name: order.customer_name,
                        phone: order.customer_phone,
                        first_order: order.created_at,
                        total_orders: 0,
                        total_spent: 0
                    });
                }
                const customer = customerMap.get(email);
                customer.total_orders += 1;
                customer.total_spent += parseFloat(order.total) || 0;
            });
            
            return Array.from(customerMap.values());
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    }



    // Update order status
    async updateOrderStatus(orderId, newStatus) {
        if (!this.isSupabaseConnected()) {
            console.log('Order status update simulated:', { orderId, newStatus });
            return { success: true, message: 'Order status updated (demo mode)' };
        }

        try {
            const { data, error } = await this.client
                .from('orders')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)
                .select();

            if (error) throw error;

            return { 
                success: true, 
                message: `Order status updated to ${newStatus}`,
                data: data[0]
            };
        } catch (error) {
            console.error('Error updating order status:', error);
            return { 
                success: false, 
                message: 'Failed to update order status'
            };
        }
    }

    // Get order items for a specific order
    async getOrderItems(orderId) {
        if (!this.isSupabaseConnected()) {
            return [];
        }

        try {
            const { data, error } = await this.client
                .from('order_items')
                .select('*')
                .eq('order_id', orderId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching order items:', error);
            return [];
        }
    }

    // Authentication methods
    async signUp(email, password, userData = {}) {
        if (!this.isSupabaseConnected()) {
            console.log('Sign up simulated:', { email, userData });
            return { success: true, message: CONFIG.MESSAGES.REGISTER_SUCCESS };
        }

        try {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });

            if (error) throw error;

            return { success: true, user: data.user, message: CONFIG.MESSAGES.REGISTER_SUCCESS };
        } catch (error) {
            console.error('Error signing up:', error);
            return { success: false, message: error.message || CONFIG.MESSAGES.REGISTER_ERROR };
        }
    }

    async signIn(email, password) {
        if (!this.isSupabaseConnected()) {
            console.log('Sign in simulated:', { email });
            return { success: true, message: CONFIG.MESSAGES.LOGIN_SUCCESS };
        }

        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            return { success: true, user: data.user, message: CONFIG.MESSAGES.LOGIN_SUCCESS };
        } catch (error) {
            console.error('Error signing in:', error);
            return { success: false, message: error.message || CONFIG.MESSAGES.LOGIN_ERROR };
        }
    }

    async signOut() {
        if (!this.isSupabaseConnected()) {
            console.log('Sign out simulated');
            return { success: true };
        }

        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error signing out:', error);
            return { success: false, message: error.message };
        }
    }

    async getCurrentUser() {
        if (!this.isSupabaseConnected()) {
            return null;
        }

        try {
            const { data: { user } } = await this.client.auth.getUser();
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    async resetPassword(email) {
        if (!this.isSupabaseConnected()) {
            console.log('Password reset simulated:', { email });
            return { success: true, message: 'Password reset instructions sent to your email (simulated)' };
        }

        try {
            const { error } = await this.client.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;

            return { success: true, message: 'Password reset instructions sent to your email' };
        } catch (error) {
            console.error('Error sending password reset:', error);
            return { success: false, message: error.message || 'Failed to send password reset email' };
        }
    }

    // Database setup (for admin use)
    async setupDatabase() {
        if (!this.isSupabaseConnected()) {
            console.log('Database setup skipped - Supabase not connected');
            return false;
        }

        try {
            // This would typically be done through Supabase dashboard or SQL editor
            console.log('Database setup should be done through Supabase dashboard');
            return true;
        } catch (error) {
            console.error('Error setting up database:', error);
            return false;
        }
    }
}

// Create global instance
window.supabaseService = new SupabaseService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseService;
}
