// DEBUG SCRIPT FOR CHECKOUT REDIRECT ISSUE
// This will help us see exactly what's causing the redirect

(function() {
    console.log('🐛 Debug script loaded - preventing immediate redirects');
    
    // Override window.location to catch redirects
    let originalLocation = window.location;
    let redirectCount = 0;
    
    // Create a proxy to catch location changes
    Object.defineProperty(window, 'location', {
        get: function() {
            return originalLocation;
        },
        set: function(value) {
            redirectCount++;
            console.log(`🚨 REDIRECT ATTEMPT #${redirectCount} CAUGHT!`);
            console.log('   Trying to redirect to:', value);
            console.log('   Current page:', originalLocation.href);
            console.trace('   Redirect called from:');
            
            // Ask user if they want to allow the redirect
            if (confirm(`Redirect attempt caught!\nFrom: ${originalLocation.href}\nTo: ${value}\n\nAllow redirect? (Click Cancel to debug)`)) {
                originalLocation.href = value;
            } else {
                console.log('🛑 Redirect blocked for debugging');
            }
        }
    });
    
    // Also catch href assignments
    const originalHref = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
    Object.defineProperty(Location.prototype, 'href', {
        get: originalHref.get,
        set: function(value) {
            redirectCount++;
            console.log(`🚨 HREF REDIRECT ATTEMPT #${redirectCount} CAUGHT!`);
            console.log('   Trying to redirect to:', value);
            console.log('   Current page:', this.href);
            console.trace('   Redirect called from:');
            
            // Ask user if they want to allow the redirect
            if (confirm(`Href redirect attempt caught!\nFrom: ${this.href}\nTo: ${value}\n\nAllow redirect? (Click Cancel to debug)`)) {
                originalHref.set.call(this, value);
            } else {
                console.log('🛑 Href redirect blocked for debugging');
            }
        }
    });
    
    // Monitor for DOM ready and checkout initialization
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM ready - checking for checkout elements');
        
        // Check if we're on checkout page
        if (window.location.pathname.includes('checkout')) {
            console.log('✅ On checkout page');
            
            // Monitor cart state every second
            let monitorCount = 0;
            const monitor = setInterval(() => {
                monitorCount++;
                console.log(`📊 Cart monitor #${monitorCount}:`);
                console.log('   window.cart exists:', !!window.cart);
                console.log('   window.checkoutManager exists:', !!window.checkoutManager);
                
                if (window.cart) {
                    console.log('   cart.isEmpty():', window.cart.isEmpty());
                    console.log('   cart.getItemCount():', window.cart.getItemCount ? window.cart.getItemCount() : 'method missing');
                }
                
                // Stop monitoring after 20 seconds
                if (monitorCount >= 20) {
                    clearInterval(monitor);
                    console.log('📊 Cart monitoring stopped after 20 seconds');
                }
            }, 1000);
        }
    });
    
    console.log('🐛 Debug script ready - all redirects will be caught');
})();
