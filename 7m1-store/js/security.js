// Security measures to prevent unauthorized access to source code and developer tools
(function() {
    'use strict';
    
    // Set flag to indicate security is enabled
    window.securityEnabled = true;
    
    // Function to disable security measures
    window.disableSecurity = function() {
        window.securityEnabled = false;
    };
    
    // Function to check if security should be active
    function isSecurityActive() {
        return window.securityEnabled;
    }

    // Disable right-click context menu
    function contextMenuHandler(e) {
        if (!isSecurityActive()) return;
        e.preventDefault();
        showSecurityAlert();
        return false;
    }
    document.addEventListener('contextmenu', contextMenuHandler);

    // Disable text selection
    function selectStartHandler(e) {
        if (!isSecurityActive()) return;
        e.preventDefault();
        return false;
    }
    document.addEventListener('selectstart', selectStartHandler);

    // Disable drag and drop
    function dragStartHandler(e) {
        if (!isSecurityActive()) return;
        e.preventDefault();
        return false;
    }
    document.addEventListener('dragstart', dragStartHandler);

    // Disable key combinations
    function keyDownHandler(e) {
        if (!isSecurityActive()) return;
        // Disable F12 (Developer Tools)
        if (e.key === 'F12') {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }

        // Disable Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }

        // Disable Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }

        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }

        // Disable Ctrl+Shift+C (Element Inspector)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }

        // Disable Ctrl+S (Save Page)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }

        // Disable Ctrl+A (Select All)
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+P (Print)
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            showSecurityAlert();
            return false;
        }
    }
    document.addEventListener('keydown', keyDownHandler);

    // Detect developer tools opening
    let devtools = {
        open: false,
        orientation: null
    };

    const threshold = 160;

    setInterval(function() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                showDevToolsWarning();
            }
        } else {
            devtools.open = false;
        }
    }, 500);

    // Console warning
    console.log('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;');
    console.log('%cThis is a browser feature intended for developers. Unauthorized access is prohibited.', 'color: red; font-size: 16px;');
    console.log('%c7M1 Store - Protected Content', 'color: #667eea; font-size: 14px;');

    // Override console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function() {
        // Allow only specific messages
        const message = Array.from(arguments).join(' ');
        if (message.includes('7M1 Store') || message.includes('STOP') || message.includes('Protected')) {
            originalLog.apply(console, arguments);
        }
    };

    console.error = function() { /* Suppress errors in console */ };
    console.warn = function() { /* Suppress warnings in console */ };

    // Show security alert
    function showSecurityAlert() {
        // Create a subtle notification instead of alert to avoid disruption
        if (!document.querySelector('.security-notice')) {
            const notice = document.createElement('div');
            notice.className = 'security-notice';
            notice.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                z-index: 10000;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;
            notice.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-shield-alt"></i>
                    <span>Content is protected</span>
                </div>
            `;
            
            document.body.appendChild(notice);
            
            // Animate in
            setTimeout(() => {
                notice.style.opacity = '1';
                notice.style.transform = 'translateX(0)';
            }, 100);
            
            // Animate out and remove
            setTimeout(() => {
                notice.style.opacity = '0';
                notice.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notice.parentNode) {
                        notice.parentNode.removeChild(notice);
                    }
                }, 300);
            }, 2000);
        }
    }

    // Show developer tools warning
    function showDevToolsWarning() {
        console.clear();
        console.log('%cDeveloper Tools Detected!', 'color: red; font-size: 24px; font-weight: bold;');
        console.log('%cUnauthorized access to developer tools is prohibited.', 'color: red; font-size: 16px;');
        console.log('%c7M1 Store - All rights reserved', 'color: #667eea; font-size: 14px;');
        
        // Optional: Redirect or take other action
        // window.location.href = 'about:blank';
    }

    // Disable print screen
    document.addEventListener('keyup', function(e) {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            showSecurityAlert();
        }
    });

    // Clear clipboard periodically to prevent print screen
    setInterval(function() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('').catch(() => {
                // Ignore clipboard access errors
            });
        }
    }, 1000);

    // Disable image dragging
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.draggable = false;
            img.addEventListener('dragstart', function(e) {
                e.preventDefault();
                return false;
            });
        });
    });

    // Monitor for suspicious activity
    let suspiciousActivity = 0;
    document.addEventListener('keydown', function() {
        suspiciousActivity++;
        if (suspiciousActivity > 100) {
            console.clear();
            console.log('%cSuspicious activity detected!', 'color: red; font-size: 20px;');
            suspiciousActivity = 0;
        }
    });

    // Disable viewing source through data URIs
    const originalOpen = window.open;
    window.open = function(url, name, features) {
        if (url && (url.includes('view-source:') || url.includes('data:'))) {
            showSecurityAlert();
            return null;
        }
        return originalOpen.call(window, url, name, features);
    };

})();
