// Authentication functionality for 7M1 Store

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        try {
            await this.checkAuthState();
            this.bindEvents();
            this.updateAuthUI();
        } catch (error) {
            console.error('Error initializing auth:', error);
        }
    }

    // Check current authentication state
    async checkAuthState() {
        try {
            this.currentUser = await supabaseService.getCurrentUser();
            this.isAuthenticated = !!this.currentUser;
            console.log('Auth state:', this.isAuthenticated ? 'Authenticated' : 'Not authenticated');
        } catch (error) {
            console.error('Error checking auth state:', error);
            this.isAuthenticated = false;
            this.currentUser = null;
        }
    }

    // Update authentication UI
    updateAuthUI() {
        const authBtn = document.getElementById('auth-btn');
        const myOrdersLink = document.getElementById('my-orders-link');
        
        if (authBtn) {
            if (this.isAuthenticated) {
                authBtn.textContent = 'Account';
                authBtn.onclick = () => this.showAccountMenu();
            } else {
                authBtn.textContent = 'Login';
                authBtn.onclick = () => this.openAuthModal('login');
            }
        }
        
        // Show/hide My Orders links based on authentication state
        if (myOrdersLink) {
            if (this.isAuthenticated) {
                myOrdersLink.style.display = 'block';
            } else {
                myOrdersLink.style.display = 'none';
            }
        }
        
        const footerMyOrdersLink = document.getElementById('footer-my-orders-link');
        if (footerMyOrdersLink) {
            if (this.isAuthenticated) {
                footerMyOrdersLink.style.display = 'list-item';
            } else {
                footerMyOrdersLink.style.display = 'none';
            }
        }
    }

    // Open authentication modal
    openAuthModal(mode = 'login') {
        const authModal = document.getElementById('auth-modal');
        const authModalTitle = document.getElementById('auth-modal-title');
        const authForms = document.getElementById('auth-forms');

        if (!authModal || !authModalTitle || !authForms) return;

        authModalTitle.textContent = mode === 'login' ? 'Login' : 'Sign Up';

        if (mode === 'login') {
            authForms.innerHTML = this.createLoginForm();
        } else {
            authForms.innerHTML = this.createSignUpForm();
        }

        this.bindAuthFormEvents();
        authModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Close authentication modal
    closeAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Create login form HTML
    createLoginForm() {
        return `
            <form id="login-form" class="auth-form">
                <div class="form-group">
                    <label for="login-email">Email Address</label>
                    <input type="email" id="login-email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" name="password" required>
                </div>
                <div class="form-group">
                    <input type="checkbox" id="remember-me">
                    <label for="remember-me">Remember me</label>
                </div>
                <button type="submit" class="primary-btn auth-submit-btn">
                    <i class="fas fa-sign-in-alt"></i>
                    Login
                </button>
                <div class="auth-divider">or</div>
                <button type="button" class="secondary-btn" id="switch-to-signup">
                    Don't have an account? Sign Up
                </button>
                <button type="button" class="forgot-password-btn" id="forgot-password">
                    Forgot Password?
                </button>
            </form>
        `;
    }

    // Create sign up form HTML
    createSignUpForm() {
        return `
            <form id="signup-form" class="auth-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="signup-first-name">First Name</label>
                        <input type="text" id="signup-first-name" name="firstName" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-last-name">Last Name</label>
                        <input type="text" id="signup-last-name" name="lastName" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="signup-email">Email Address</label>
                    <input type="email" id="signup-email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="signup-password">Password</label>
                    <input type="password" id="signup-password" name="password" required minlength="${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH}">
                    <small>Minimum ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters</small>
                </div>
                <div class="form-group">
                    <label for="signup-confirm-password">Confirm Password</label>
                    <input type="password" id="signup-confirm-password" name="confirmPassword" required>
                </div>
                <div class="form-group">
                    <input type="checkbox" id="agree-terms" required>
                    <label for="agree-terms">I agree to the Terms of Service and Privacy Policy</label>
                </div>
                <button type="submit" class="primary-btn auth-submit-btn">
                    <i class="fas fa-user-plus"></i>
                    Create Account
                </button>
                <div class="auth-divider">or</div>
                <button type="button" class="secondary-btn" id="switch-to-login">
                    Already have an account? Login
                </button>
            </form>
        `;
    }

    // Bind authentication form events
    bindAuthFormEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e.target);
            });
        }

        // Sign up form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignUp(e.target);
            });
        }

        // Switch to sign up
        const switchToSignup = document.getElementById('switch-to-signup');
        if (switchToSignup) {
            switchToSignup.addEventListener('click', () => {
                this.openAuthModal('signup');
            });
        }

        // Switch to login
        const switchToLogin = document.getElementById('switch-to-login');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', () => {
                this.openAuthModal('login');
            });
        }

        // Forgot password
        const forgotPassword = document.getElementById('forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', () => {
                this.handleForgotPassword();
            });
        }

        // Password confirmation validation
        const confirmPassword = document.getElementById('signup-confirm-password');
        const password = document.getElementById('signup-password');
        if (confirmPassword && password) {
            confirmPassword.addEventListener('input', () => {
                if (confirmPassword.value !== password.value) {
                    confirmPassword.setCustomValidity('Passwords do not match');
                } else {
                    confirmPassword.setCustomValidity('');
                }
            });
        }
    }

    // Handle login
    async handleLogin(form) {
        try {
            this.setSubmitButtonLoading(true);

            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');

            // Validate inputs
            if (!this.validateEmail(email)) {
                this.showNotification('Please enter a valid email address', 'error');
                return;
            }

            if (!password || password.length < 6) {
                this.showNotification('Password must be at least 6 characters long', 'error');
                return;
            }

            const result = await supabaseService.signIn(email, password);

            if (result.success) {
                this.currentUser = result.user;
                this.isAuthenticated = true;
                this.updateAuthUI();
                this.closeAuthModal();
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }

        } catch (error) {
            console.error('Error during login:', error);
            this.showNotification('An error occurred during login', 'error');
        } finally {
            this.setSubmitButtonLoading(false);
        }
    }

    // Handle sign up
    async handleSignUp(form) {
        try {
            this.setSubmitButtonLoading(true);

            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            const firstName = formData.get('firstName');
            const lastName = formData.get('lastName');

            // Validate inputs
            if (!this.validateEmail(email)) {
                this.showNotification('Please enter a valid email address', 'error');
                return;
            }

            if (password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
                this.showNotification(`Password must be at least ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`, 'error');
                return;
            }

            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }

            if (!firstName || !lastName) {
                this.showNotification('Please enter your first and last name', 'error');
                return;
            }

            const userData = {
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`
            };

            const result = await supabaseService.signUp(email, password, userData);

            if (result.success) {
                this.showEmailConfirmationMessage('signup');
                this.closeAuthModal();
            } else {
                this.showNotification(result.message, 'error');
            }

        } catch (error) {
            console.error('Error during sign up:', error);
            this.showNotification('An error occurred during sign up', 'error');
        } finally {
            this.setSubmitButtonLoading(false);
        }
    }

    // Handle forgot password
    async handleForgotPassword() {
        this.showForgotPasswordModal();
    }
    
    // Show forgot password modal
    showForgotPasswordModal() {
        const authForms = document.getElementById('auth-forms');
        const authModalTitle = document.getElementById('auth-modal-title');
        
        if (!authForms || !authModalTitle) return;
        
        authModalTitle.textContent = 'Reset Password';
        
        authForms.innerHTML = `
            <form id="forgot-password-form" class="auth-form">
                <div class="form-group">
                    <label for="reset-email">Email Address</label>
                    <input type="email" id="reset-email" name="email" required>
                    <small>Enter your email address and we'll send you a link to reset your password.</small>
                </div>
                <button type="submit" class="primary-btn auth-submit-btn">
                    <i class="fas fa-envelope"></i>
                    Send Reset Link
                </button>
                <div class="auth-divider">or</div>
                <button type="button" class="secondary-btn" id="back-to-login">
                    <i class="fas fa-arrow-left"></i>
                    Back to Login
                </button>
            </form>
        `;
        
        this.bindForgotPasswordEvents();
    }
    
    // Bind forgot password form events
    bindForgotPasswordEvents() {
        const forgotPasswordForm = document.getElementById('forgot-password-form');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handlePasswordReset(e.target);
            });
        }
        
        const backToLogin = document.getElementById('back-to-login');
        if (backToLogin) {
            backToLogin.addEventListener('click', () => {
                this.openAuthModal('login');
            });
        }
    }
    
    // Handle password reset
    async handlePasswordReset(form) {
        try {
            this.setSubmitButtonLoading(true);
            
            const formData = new FormData(form);
            const email = formData.get('email');
            
            if (!this.validateEmail(email)) {
                this.showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            const result = await supabaseService.resetPassword(email);
            
            if (result.success) {
                this.showEmailConfirmationMessage('password-reset');
                this.closeAuthModal();
            } else {
                this.showNotification(result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error sending password reset:', error);
            this.showNotification('Error sending password reset email', 'error');
        } finally {
            this.setSubmitButtonLoading(false);
        }
    }
    
    // Show email confirmation message
    showEmailConfirmationMessage(type) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.style.zIndex = '10000';
        
        let title, message, icon;
        
        if (type === 'signup') {
            title = 'Check Your Email!';
            message = 'We\'ve sent you a confirmation email. Please check your inbox and click the link to verify your account before logging in.';
            icon = 'fas fa-envelope-open';
        } else if (type === 'password-reset') {
            title = 'Password Reset Sent!';
            message = 'We\'ve sent you a password reset link. Please check your email and follow the instructions to reset your password.';
            icon = 'fas fa-key';
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; margin: 2rem auto;">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-btn" id="close-email-confirmation">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 2rem;">
                    <div style="font-size: 4rem; color: #667eea; margin-bottom: 1rem;">
                        <i class="${icon}"></i>
                    </div>
                    <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.5rem; color: #555;">
                        ${message}
                    </p>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <small style="color: #666;">
                            <strong>Didn't receive the email?</strong> Check your spam folder or 
                            <a href="#" style="color: #667eea;" id="resend-email">click here to resend</a>
                        </small>
                    </div>
                    <button class="primary-btn" id="email-confirmation-ok" style="padding: 12px 30px;">
                        Got it, thanks!
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Bind events
        const closeBtn = modal.querySelector('#close-email-confirmation');
        const okBtn = modal.querySelector('#email-confirmation-ok');
        const resendBtn = modal.querySelector('#resend-email');
        
        const closeModal = () => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        };
        
        closeBtn.addEventListener('click', closeModal);
        okBtn.addEventListener('click', closeModal);
        
        if (resendBtn) {
            resendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Resend functionality would be implemented here', 'info');
            });
        }
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Handle logout
    async handleLogout() {
        try {
            const result = await supabaseService.signOut();
            
            if (result.success) {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.updateAuthUI();
                this.showNotification('Logged out successfully', 'success');
                
                // Redirect to home if on protected page or my-orders page
                if (window.location.pathname.includes('admin') || 
                    window.location.pathname.includes('account') || 
                    window.location.pathname.includes('my-orders')) {
                    window.location.href = '/';
                }
            } else {
                this.showNotification('Error logging out', 'error');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            this.showNotification('Error logging out', 'error');
        }
    }

    // Show account menu
    showAccountMenu() {
        const menu = document.createElement('div');
        menu.className = 'account-menu';
        menu.innerHTML = `
            <div class="account-menu-content">
                <div class="account-info">
                    <strong>${this.currentUser?.email || 'User'}</strong>
                </div>
                <hr>
                <button class="menu-item" id="account-profile">
                    <i class="fas fa-user"></i>
                    Profile
                </button>
                <button class="menu-item" id="account-orders">
                    <i class="fas fa-shopping-bag"></i>
                    My Orders
                </button>
                <button class="menu-item" id="account-settings">
                    <i class="fas fa-cog"></i>
                    Settings
                </button>
                <hr>
                <button class="menu-item logout" id="account-logout">
                    <i class="fas fa-sign-out-alt"></i>
                    Logout
                </button>
            </div>
        `;

        // Position menu
        const authBtn = document.getElementById('auth-btn');
        const rect = authBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = rect.bottom + 10 + 'px';
        menu.style.right = '2rem';
        menu.style.zIndex = '2001';

        document.body.appendChild(menu);

        // Bind menu events
        document.getElementById('account-orders').addEventListener('click', () => {
            window.location.href = 'my-orders.html';
            document.body.removeChild(menu);
        });
        
        document.getElementById('account-logout').addEventListener('click', () => {
            this.handleLogout();
            document.body.removeChild(menu);
        });

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && e.target !== authBtn) {
                    if (document.body.contains(menu)) {
                        document.body.removeChild(menu);
                    }
                }
            }, { once: true });
        }, 100);
    }

    // Set submit button loading state
    setSubmitButtonLoading(loading) {
        const submitBtn = document.querySelector('.auth-submit-btn');
        if (submitBtn) {
            if (loading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            } else {
                submitBtn.disabled = false;
                const isLogin = submitBtn.closest('#login-form');
                submitBtn.innerHTML = isLogin 
                    ? '<i class="fas fa-sign-in-alt"></i> Login'
                    : '<i class="fas fa-user-plus"></i> Create Account';
            }
        }
    }

    // Validate email format
    validateEmail(email) {
        return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Use the cart's notification method
        if (window.cart) {
            window.cart.showNotification(message, type);
        }
    }

    // Bind main authentication events
    bindEvents() {
        // Close auth modal
        const closeAuthBtn = document.getElementById('close-auth');
        if (closeAuthBtn) {
            closeAuthBtn.addEventListener('click', () => {
                this.closeAuthModal();
            });
        }

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const authModal = document.getElementById('auth-modal');
            if (authModal && e.target === authModal) {
                this.closeAuthModal();
            }
        });

        // Listen for auth state changes (if using Supabase auth)
        if (supabaseService.isSupabaseConnected()) {
            supabaseService.client.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session);
                
                if (event === 'SIGNED_IN') {
                    this.currentUser = session?.user;
                    this.isAuthenticated = true;
                    this.updateAuthUI();
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.isAuthenticated = false;
                    this.updateAuthUI();
                }
            });
        }
    }

    // Require authentication for protected actions
    requireAuth(callback, message = 'Please login to continue') {
        if (this.isAuthenticated) {
            callback();
        } else {
            this.showNotification(message, 'warning');
            this.openAuthModal('login');
        }
    }

    // Auto-fill checkout form if user is logged in
    fillCheckoutForm() {
        if (!this.isAuthenticated || !this.currentUser) return;

        // Fill email field if it exists
        const emailField = document.getElementById('email');
        if (emailField && this.currentUser.email) {
            emailField.value = this.currentUser.email;
        }

        // Fill name fields if metadata exists
        const firstNameField = document.getElementById('first-name');
        const lastNameField = document.getElementById('last-name');
        
        if (this.currentUser.user_metadata) {
            if (firstNameField && this.currentUser.user_metadata.first_name) {
                firstNameField.value = this.currentUser.user_metadata.first_name;
            }
            if (lastNameField && this.currentUser.user_metadata.last_name) {
                lastNameField.value = this.currentUser.user_metadata.last_name;
            }
        }
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
