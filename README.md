# WhatPrice Investment Platform - Setup Guide

## Overview

This is the investment pitch platform for WhatPrice with form submission handling and admin dashboard functionality.

## Features

- 🎯 Investment pitch presentation
- 📝 Form submission system
- 🔐 Secure admin dashboard
- 📊 View and manage investor inquiries
- 💾 Export data as JSON
- 🔍 Search and filter submissions
- 🗄️ MongoDB database with complete schema
- 👥 User management with roles and permissions
- 🛍️ Product catalog with multi-retailer pricing
- ⭐ Review and rating system
- 📦 Order management

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended for production)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add your IP address to the IP whitelist (or use 0.0.0.0/0 for development)
4. Create a database user with read/write permissions
5. Get your connection string (should look like: `mongodb+srv://username:password@cluster.mongodb.net/`)

#### Option B: Local MongoDB (For development)

1. Install MongoDB locally: [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)
2. Start MongoDB service
3. Your connection string will be: `mongodb://localhost:27017/whatprice`

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatprice?retryWrites=true&w=majority

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# Optional: Session Secret
SESSION_SECRET=your_random_32_char_string_here
```

**Important:** Replace the MongoDB connection string with your actual credentials.

### 4. Seed the Database (Optional)

Populate the database with sample data for testing:

```bash
npm run db:seed
# or
yarn db:seed
```

This will create:
- Default roles (Admin, User, Retailer, Moderator)
- Sample categories (Electronics, Smartphones, Laptops, etc.)
- Sample retailers (TechMart, ElectroWorld, BestBuy Store)
- Sample users (admin@whatprice.com, john.doe@example.com)
- Sample products with multi-retailer pricing

### 5. Run the Application

```bash
# Development
npm run dev
# or
yarn dev

# Production build
npm run build
npm run start
```

## Access Points

### Main Application

- **URL**: `http://localhost:3000`
- **Description**: Main investment pitch page with form

### Admin Dashboard

- **URL**: `http://localhost:3000/admin`
- **Default Credentials**:
  - Username: `admin`
  - Password: `whatprice2025!`
- **⚠️ IMPORTANT**: Change these credentials in production!

## File Structure

```
src/
├── app/
│   ├── page.tsx                 # Main landing page
│   ├── admin/
│   │   └── page.tsx             # Admin dashboard
│   └── api/
│       ├── submit-form/
│       │   └── route.ts         # Form submission endpoint
│       └── admin/
│           ├── login/route.ts   # Admin login
│           ├── logout/route.ts  # Admin logout
│           ├── submissions/route.ts # Get/Delete submissions
│           └── check-auth/route.ts # Auth check
├── lib/
│   └── db/
│       └── connection.ts        # MongoDB connection utility
├── models/
│   ├── User.ts                  # User model with authentication
│   ├── Role.ts                  # Role and permissions model
│   ├── Category.ts              # Product category model
│   ├── Retailer.ts              # Retailer/store model
│   ├── Product.ts               # Product model with pricing
│   ├── Order.ts                 # Order management model
│   ├── Review.ts                # Review and rating model
│   └── index.ts                 # Model exports
│
scripts/
└── seed.ts                      # Database seeding script
```

## Database Schema

### Collections

#### Users
- Email/password authentication
- Role-based access control
- Profile information (name, phone, address)
- Email verification status
- Last login tracking

#### Roles
- Predefined roles: Admin, User, Retailer, Moderator
- Granular permissions system
- Permission management methods

#### Categories
- Hierarchical structure (parent/child)
- SEO-friendly slugs
- Active/inactive status
- Custom ordering

#### Retailers
- Store information (name, logo, website)
- Contact details
- Location with geospatial indexing
- Business hours
- Delivery and payment options
- Verification status
- Rating system

#### Products
- Multi-retailer pricing
- Category association
- Rich specifications
- Image gallery
- Search optimization
- Rating and review integration
- View and compare tracking
- SKU and barcode support

#### Orders
- User order tracking
- Multiple items per order
- Shipping and billing addresses
- Order status workflow
- Payment tracking
- Delivery tracking

#### Reviews
- Product and retailer reviews
- Rating (1-5 stars)
- Verified purchase badges
- Helpful/unhelpful voting
- Moderation workflow
- Retailer response capability

## API Endpoints

### Public Endpoints

- `POST /api/submit-form` - Submit investment inquiry form

### Admin Endpoints (Authentication Required)

- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/check-auth` - Check authentication status
- `GET /api/admin/submissions` - Get all submissions
- `DELETE /api/admin/submissions?id={id}` - Delete a submission

## Security Considerations

### For Development

- Default credentials are provided for quick testing
- Sample data includes plain-text passwords (for demo purposes only)

### For Production

1. **Password Hashing**: Implement bcrypt or similar for password hashing
2. **Change Admin Credentials**: Update `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env.local`
3. **MongoDB Security**:
   - Use strong database passwords
   - Enable MongoDB authentication
   - Restrict IP access in MongoDB Atlas
   - Use connection string with SSL/TLS
4. **Use HTTPS**: Deploy with SSL certificate
5. **Session Management**: Implement secure session management (Redis, JWT)
6. **Rate Limiting**: Implement rate limiting on API endpoints
7. **Environment Variables**: Never commit `.env.local` to version control
8. **Database Backup**: Set up automated MongoDB backups

## Using the Database Models

### Import Models

```typescript
import { User, Product, Retailer, Order, Review, Category, Role } from '@/models';
import connectDB from '@/lib/db/connection';
```

### Example Usage

```typescript
// Connect to database
await connectDB();

// Find products by category
const products = await Product.find({ category: categoryId })
  .populate('category')
  .populate('prices.retailer');

// Get lowest price for a product
const product = await Product.findById(productId);
const lowestPrice = product.lowestPrice;

// Create a new review
const review = await Review.create({
  user: userId,
  product: productId,
  rating: 5,
  comment: 'Great product!',
  isVerifiedPurchase: true,
});

// Get user with role
const user = await User.findById(userId).populate('role');
```

### Database Backup Strategy

```bash
# MongoDB Atlas - Automated backups included
# Configure in Atlas dashboard

# Local MongoDB backup
mongodump --uri="mongodb://localhost:27017/whatprice" --out=/path/to/backup

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/whatprice" /path/to/backup/whatprice
```

## Troubleshooting

### MongoDB Connection Issues

1. Verify `MONGODB_URI` in `.env.local` is correct
2. Check if IP address is whitelisted in MongoDB Atlas
3. Ensure database user has proper permissions
4. Verify network connectivity
5. Check MongoDB service is running (for local installations)

### Form Submission Not Working

1. Verify MongoDB connection
2. Check API routes are correctly configured
3. Check browser console for errors
4. Verify environment variables are loaded

### Cannot Login to Admin

1. Verify credentials in `.env.local`
2. Clear browser cookies
3. Restart the application
4. Check MongoDB connection

### Database Seeding Fails

1. Ensure MongoDB is connected
2. Verify `MONGODB_URI` is set correctly
3. Check if database user has write permissions
4. Review error messages in console

## Deployment

### Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
4. Deploy
5. Run database seed if needed: `npm run db:seed`

### Traditional Server

1. Build the application: `npm run build`
2. Set up PM2 or similar process manager
3. Configure Nginx/Apache reverse proxy
4. Set environment variables
5. Start the application

## Maintenance

### Regular Tasks

- Monitor MongoDB database size and performance
- Backup database regularly (automated in Atlas)
- Review and moderate user reviews
- Update admin credentials periodically
- Monitor server logs for errors
- Review and optimize database indexes

### Performance Optimization

- Implement pagination for large datasets
- Add Redis caching layer for frequently accessed data
- Optimize database queries with proper indexing
- Implement CDN for static assets and images
- Use MongoDB aggregation pipelines for complex queries
- Enable compression for API responses

## Support

For issues or questions about the platform, please contact the development team.

## License

Private - All rights reserved
