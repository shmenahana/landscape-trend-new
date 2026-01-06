# LandscapePro - Job Costing & Estimating Software

A comprehensive job costing and estimating software built for landscape businesses, inspired by SynkedUP's feature set.

## Features

### 🎯 Core Modules

- **Dashboard & Analytics** - Real-time insights into business performance
- **CRM** - Customer and lead management with contact tracking
- **Estimating** - Build estimates with drag-and-drop templates, automatic overhead recovery and profit margins
- **Job Costing** - Real-time tracking of estimated vs actual costs and hours
- **Scheduling** - Drag-and-drop calendar with crew assignments
- **Time Tracking** - GPS-enabled time tracking for accurate job costing
- **Materials Management** - Track inventory, usage, and costs
- **Equipment Tracking** - Monitor equipment usage and maintenance
- **Invoicing** - Create and manage invoices with QuickBooks integration support
- **Digital Proposals** - Send professional proposals with e-signature capability

### 📊 Key Features

- ✅ Real-time job costing with instant budget variance tracking
- ✅ Drag-and-drop estimate builder with templates
- ✅ GPS-enabled time tracking
- ✅ Automatic overhead and profit margin calculations
- ✅ Materials and equipment cost tracking
- ✅ Schedule management with visual calendar
- ✅ Customer relationship management
- ✅ Invoice generation and payment tracking
- ✅ Mobile-responsive design
- ✅ Comprehensive analytics and reporting

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Prisma ORM with SQLite
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React Icons
- **Authentication:** Custom auth with bcryptjs
- **Forms:** React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update the values as needed.

3. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. Navigate to [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
2. Create your admin account
3. Start using the application!

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main application pages
│   │   ├── customers/    # CRM module
│   │   ├── estimates/    # Estimating module
│   │   ├── jobs/         # Job costing module
│   │   ├── schedule/     # Scheduling module
│   │   ├── time-tracking/ # Time tracking module
│   │   ├── materials/    # Materials management
│   │   ├── equipment/    # Equipment tracking
│   │   ├── invoices/     # Invoicing module
│   │   └── settings/     # Settings page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # Reusable components
├── lib/                  # Utilities and helpers
│   ├── prisma.ts        # Database client
│   └── utils.ts         # Utility functions
├── prisma/
│   └── schema.prisma    # Database schema
└── public/              # Static assets
```

## Database Schema

The application includes comprehensive models for:

- Users & Authentication
- Customers & Contacts
- Properties
- Estimates & Templates
- Jobs & Tasks
- Time Entries
- Materials & Usage
- Equipment & Usage
- Schedules
- Invoices & Payments
- Photos & Activities
- Company Settings

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features Based on SynkedUP

This application implements all major SynkedUP features:

1. **Job Costing** - Real-time tracking of labor, materials, and equipment costs
2. **Estimating** - Drag-and-drop templates with automatic pricing
3. **Time Tracking** - GPS-enabled crew time tracking
4. **Scheduling** - Visual calendar with crew assignments
5. **CRM** - Customer and lead management
6. **Invoicing** - Professional invoices with payment tracking
7. **Materials Tracking** - Inventory and usage monitoring
8. **Equipment Management** - Track usage and maintenance
9. **Digital Proposals** - E-signature ready proposals
10. **Analytics** - Comprehensive business insights

## Future Enhancements

- Mobile app (iOS/Android)
- QuickBooks Online integration
- Advanced reporting and exports
- Photo uploads for jobs
- Email notifications
- Multi-user roles and permissions
- Recurring jobs and maintenance contracts
- Customer portal

## License

Proprietary - All rights reserved

## Support

For support, email support@landscapepro.com
