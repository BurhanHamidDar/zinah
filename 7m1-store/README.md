# 7M1 Store - India E-commerce Website

A modern, responsive e-commerce website designed specifically for the Indian market with Cash on Delivery payment option.

## Features

### India-Specific Features
- **Currency**: Indian Rupees (₹)
- **Payment**: Cash on Delivery (COD) only
- **Shipping**: Free shipping above ₹999
- **Tax**: 18% GST included
- **States**: Indian state selection in checkout
- **Contact**: Indian phone number and address

### Core Features
- Responsive design for mobile and desktop
- Product catalog with categories
- Shopping cart functionality
- Secure checkout process
- Contact form
- Admin panel for management
- Right-click protection

### Categories Available
- Electronics
- Clothing
- Books
- Home & Kitchen
- Sports

## Setup Instructions

### 1. Basic Setup
1. Extract all files to your web server
2. Open `index.html` in your browser
3. The website will work with sample data without database

### 2. Database Setup (Supabase)
For full functionality with admin panel:

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Choose one of two database setup options:

   **Option A: Basic Setup (Recommended)**
   - Run `database-basic-setup.sql` in your Supabase SQL Editor
   - Creates essential tables: categories, products, orders, contact messages
   - Perfect for getting started quickly

   **Option B: Full Setup (Advanced)**
   - Run `database-setup.sql` in your Supabase SQL Editor  
   - Creates all advanced tables: customers, reviews, coupons, admin users
   - Use for complete e-commerce functionality

4. Update `js/config.js` with your Supabase credentials:
   ```javascript
   SUPABASE: {
       URL: 'your-supabase-project-url',
       ANON_KEY: 'your-supabase-anon-key'
   }
   ```

### 3. Admin Panel Access
- Visit `/admin/index.html` for the admin panel
- Or click "Admin Login" in the footer
- Default admin interface (no authentication required for demo)

## File Structure
```
7m1-store/
├── index.html              # Main homepage
├── checkout.html           # Checkout page
├── css/
│   └── styles.css          # All CSS styles
├── js/
│   ├── config.js           # Configuration settings
│   ├── supabase.js         # Database functions
│   ├── auth.js             # Authentication
│   ├── cart.js             # Shopping cart
│   ├── products.js         # Product management
│   ├── checkout.js         # Checkout process
│   └── app.js              # Main application
├── admin/
│   ├── index.html          # Admin panel
│   └── admin.js            # Admin functionality
├── images/                 # Product images
└── database-setup.sql      # Database schema
```

## Customization

### Updating Products
1. **Without Database**: Edit `CONFIG.SAMPLE_PRODUCTS` in `js/config.js`
2. **With Database**: Use the admin panel or update the `products` table

### Changing Settings
- Update `js/config.js` for app settings
- Use admin panel settings section
- Modify database `site_settings` table

### Adding Images
1. Add images to the `images/` folder
2. Update product image URLs in the database or config

## Security Features
- Right-click disabled
- Developer tools shortcuts disabled
- Source view prevention
- Context menu disabled

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Sample Data
The website comes with 6 sample products with Indian pricing:
- Premium Wireless Headphones (₹4,999)
- Comfortable Running Shoes (₹2,499)
- Smart Watch Pro (₹12,999)
- Cotton T-Shirt (₹799)
- Coffee Maker (₹3,999)
- Programming Book (₹1,299)

## Contact Information
- Email: support@7m1store.in
- Phone: +91 98765 43210
- Location: Mumbai, Maharashtra, India

## Payment Method
- **Cash on Delivery (COD)**: Pay when your order is delivered
- No online payment required
- GST invoice provided
- No additional charges

## Shipping Policy
- Standard shipping: ₹99
- Free shipping on orders above ₹999
- Delivery within India only
- 3-7 business days delivery

## License
This project is for educational and commercial use.

## Support
For technical support or customization requests, contact the development team.

---

**Made in India** 🇮🇳
