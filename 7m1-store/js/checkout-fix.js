// CHECKOUT FORM FIX
// Apply this fix to make the checkout work without any database changes
// Just add this script to checkout.html AFTER checkout.js

(function() {
    console.log('📋 Applying checkout form fix...');
    
    // Wait for DOM and checkout manager to be ready
    document.addEventListener('DOMContentLoaded', function() {
        // Give checkout.js time to initialize
        setTimeout(function() {
            if (!window.checkoutManager) {
                console.error('⚠️ Checkout manager not found!');
                return;
            }
            
            fixCheckoutIssues();
        }, 1000);
    });
    
    // Apply all fixes
    function fixCheckoutIssues() {
        console.log('🔧 Fixing checkout validation issues...');
        
        // 1. Fix form validation in CheckoutManager
        patchCheckoutValidation();
        
        // 2. Override createOrder method to simplify
        patchOrderCreation();
        
        // 3. Fix state dropdown value
        fixStateDropdown();
        
        console.log('✅ Checkout fixes applied successfully!');
    }
    
    // Fix state dropdown value to match validation
    function fixStateDropdown() {
        const stateSelect = document.getElementById('state-select');
        if (stateSelect) {
            // Change the option value to match validation
            const jammuOption = stateSelect.querySelector('option[value="Jammu and Kashmir"]');
            if (jammuOption) {
                jammuOption.value = "Jammu & Kashmir";
                console.log('✅ Fixed state dropdown value');
            }
        }
    }
    
    // Patch checkout validation to be more permissive
    function patchCheckoutValidation() {
        // Original validateShippingInfo function
        const originalValidateShipping = window.checkoutManager.validateShippingInfo;
        
        // Override with more logging and flexible validation
        window.checkoutManager.validateShippingInfo = function() {
            const form = document.getElementById('shipping-form');
            if (!form) {
                console.error('🚨 Shipping form not found!');
                return false;
            }
    
            const formData = new FormData(form);
            
            // Debug log all form data clearly
            console.log('📋 Form data check:');
            for (const [field, value] of formData.entries()) {
                console.log(`   ${field}: "${value}"`);
            }
            
            // Verify we have all required fields
            const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
            
            for (const field of requiredFields) {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    console.error(`❌ Missing required field: ${field}`);
                    this.showNotification(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                    return false;
                }
            }
    
            // More permissive state validation - accept any state containing "jammu" case-insensitive
            const state = formData.get('state');
            console.log('🔍 Validating state:', state);
            
            if (!state || (!state.toLowerCase().includes('jammu') && !state.toLowerCase().includes('kashmir'))) {
                console.error('❌ Invalid state value:', state);
                this.showNotification('Sorry, we only deliver to Jammu & Kashmir.', 'error');
                return false;
            } else {
                console.log('✅ State validated successfully');
            }
            
            // Allow the required pincodes
            const pincode = formData.get('zip');
            const allowedPincodes = ['192231', '192233'];
            if (!allowedPincodes.includes(pincode)) {
                console.error('❌ Invalid pincode:', pincode);
                this.showNotification('Sorry, this pincode is out of stock. We only deliver to pincodes 192231 and 192233.', 'error');
                return false;
            } else {
                console.log('✅ Pincode validated successfully');
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
            
            console.log('✅ Shipping info validated and saved successfully');
            return true;
        };
        
        console.log('✅ Patched shipping validation function');
    }
    
    // Patch order creation to handle database constraints
    function patchOrderCreation() {
        // Override original Supabase createOrder method
        if (window.supabaseService && typeof window.supabaseService.createOrder === 'function') {
            // Store original function
            const originalCreateOrder = window.supabaseService.createOrder;
            
            // Override with more robust version
            window.supabaseService.createOrder = async function(orderData) {
                console.log('📦 Enhanced order creation starting...');
                
                try {
                    // Validate required fields
                    if (!orderData.customerInfo || !orderData.customerInfo.email) {
                        throw new Error('Customer email is required');
                    }
                    
                    if (!orderData.customerInfo.firstName || !orderData.customerInfo.lastName) {
                        throw new Error('Customer name is required');
                    }
                    
                    // Add missing fields to match database requirements
                    if (!orderData.subtotal && orderData.total) {
                        console.log('📝 Setting subtotal equal to total');
                        orderData.subtotal = orderData.total;
                    }
                    
                    if (!orderData.tax) {
                        console.log('📝 Setting tax to 0');
                        orderData.tax = 0;
                    }
                    
                    // Generate a temporary order number for safety
                    const tempOrderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
                    
                    // Prepare safe order data for database
                    const safeOrderData = {
                        order_number: tempOrderNumber,
                        customer_email: orderData.customerInfo.email,
                        customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
                        customer_phone: orderData.customerInfo.phone || null,
                        total: orderData.total,
                        subtotal: orderData.subtotal || orderData.total, // Use total if subtotal missing
                        tax_amount: orderData.tax || 0,
                        status: 'pending',
                        shipping_address: {
                            ...orderData.shippingAddress,
                            customer_info: orderData.customerInfo,
                            payment_method: orderData.paymentMethod
                        }
                    };
                    
                    console.log('📦 Enhanced order data:', safeOrderData);
                    
                    // Call original function with enhanced data
                    return await originalCreateOrder.call(this, {
                        ...orderData,
                        subtotal: orderData.subtotal || orderData.total
                    });
                    
                } catch (error) {
                    console.error('💥 Enhanced order creation error:', error);
                    return { success: false, message: error.message || 'Order creation failed' };
                }
            };
            
            console.log('✅ Patched order creation function');
        } else {
            console.error('⚠️ Could not find supabaseService.createOrder to patch');
        }
    }
})();
