# WhatPrice Investment Platform - Setup Guide

## Overview

This is the investment pitch platform for WhatPrice with form submission handling and admin dashboard functionality.

## Features

- 🎯 Investment pitch presentation
- 📝 Form submission system (saves to JSON file)
- 🔐 Secure admin dashboard
- 📊 View and manage investor inquiries
- 💾 Export data as JSON
- 🔍 Search and filter submissions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# Optional: Session Secret
SESSION_SECRET=your_random_32_char_string_here
```

### 3. Create Data Directory

The application will automatically create a `data` directory when the first form is submitted. This directory will store the `submissions.json` file.

### 4. Run the Application

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
│
data/
└── submissions.json             # Form submissions storage (auto-created)
```

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
- Data is stored in a local JSON file

### For Production

1. **Change Admin Credentials**: Update `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env.local`
2. **Use HTTPS**: Deploy with SSL certificate
3. **Session Management**: Consider using proper session management (Redis, JWT)
4. **Database**: Consider migrating to a proper database (PostgreSQL, MongoDB)
5. **Rate Limiting**: Implement rate limiting on form submissions
6. **Backup**: Regularly backup the `data/submissions.json` file

## Data Management

### Submission Data Structure

```json
{
  "id": "sub_1234567890_abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Investment Firm",
  "message": "Interested in Phase 1 investment",
  "submittedAt": "2025-01-20T10:30:00.000Z",
  "ipAddress": "192.168.1.1"
}
```

### Export Data

- Click "Export JSON" button in admin dashboard
- Downloads all current submissions as JSON file

### Backup Strategy

```bash
# Manual backup
cp data/submissions.json data/submissions_backup_$(date +%Y%m%d).json

# Automated backup (cron job example)
0 2 * * * cp /path/to/data/submissions.json /path/to/backups/submissions_$(date +\%Y\%m\%d).json
```

## Troubleshooting

### Form Submission Not Working

1. Check if `/data` directory has write permissions
2. Verify API routes are correctly configured
3. Check browser console for errors

### Cannot Login to Admin

1. Verify credentials in `.env.local`
2. Clear browser cookies
3. Restart the application

### Data Not Persisting

1. Ensure `data/submissions.json` exists
2. Check file permissions
3. Verify the data directory path

## Deployment

### Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Traditional Server

1. Build the application: `npm run build`
2. Set up PM2 or similar process manager
3. Configure Nginx/Apache reverse proxy
4. Set environment variables
5. Start the application

## Maintenance

### Regular Tasks

- Monitor disk space for JSON file growth
- Backup submissions regularly
- Review and archive old submissions
- Update admin credentials periodically

### Performance Optimization

- For large datasets (>1000 submissions), consider:
  - Implementing pagination
  - Using a database instead of JSON
  - Adding caching layer
  - Implementing lazy loading

## Support

For issues or questions about the platform, please contact the development team.

## License

Private - All rights reserved
