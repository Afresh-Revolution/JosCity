# JosCity - Jos Smart City Platform

A comprehensive digital ecosystem platform connecting residents, businesses, and visitors in Jos Smart City. This full-stack application provides municipal services, bill payments, event management, social networking, and a membership-driven marketplace.

## 🚀 Features

### Core Features
- **Landing Page**: Hero section, services showcase, events calendar, pricing plans, testimonials, and contact information
- **User Authentication**: Registration and sign-in with activation codes for both personal and business accounts
- **News Feed**: Social networking features with posts, stories, trending topics, and friend suggestions
- **Business Registration**: Separate registration flow for business accounts with approval system
- **Admin Panel**: Dashboard for user management, post moderation, and platform settings
- **Email Notifications**: Automated emails for account approvals and password resets

### Cross-Platform & Multi-Device
- **Same account, any device**: Log in on another device with the same account; your data (posts, notifications, profile) is synced via the API so it behaves as one experience across devices.
- **Per-device sessions**: Each device keeps its own session (token). The backend identifies you by user id, so the same account on phone, tablet, or desktop sees the same content.

### Platform Capabilities
- **JosCity Wallet & Points System**: Digital wallet and rewards points
- **Digital Membership ID**: Unique membership identification
- **Vendor Dashboard**: Business management interface
- **Referral & Rewards Program**: User engagement and rewards system
- **Event Management**: Ticket purchasing and event bookings
- **Municipal Services**: Access to city services and bill payments

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **SCSS/SASS** - Styling with modular architecture
- **Lucide React** - Icon library
- **Firebase** - Additional services integration

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL/MySQL** - Database support
- **JWT** - Authentication tokens
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL or MySQL database
- SMTP email service (Gmail, SendGrid, etc.)

## 🚀 Getting Started

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env` file in the root directory to configure maintenance mode:
```env
# Set to "true" to enable maintenance mode (shows maintenance page for all routes)
VITE_MAINTENANCE_MODE=false
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

5. Run linter:
```bash
npm run lint
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd JosCity-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `JosCity-Backend` directory:
```env
# Server Configuration
PORT=3000

# Database Configuration (MySQL)
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
DB_PORT=3306

# PostgreSQL Configuration (Alternative)
DATABASE_URL=postgresql://user:password@localhost:5432/database_name

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="JosCity <noreply@joscity.com>"
```

4. Build the TypeScript project:
```bash
npm run build
```

5. Run in development mode:
```bash
npm run dev
```

6. Run in production mode:
```bash
npm start
```

The backend server will start on port 3000 (or the port specified in your `.env` file).

## 📁 Project Structure

```
JOSCITY/
├── src/                          # Frontend source files
│   ├── api/                      # API configuration
│   ├── components/               # Reusable React components
│   │   ├── BusinessFormFields.tsx
│   │   ├── NewsFeed/            # News feed components
│   │   │   ├── CreatePostInput.tsx
│   │   │   ├── CreatePostModal.tsx
│   │   │   ├── NewsFeedSidebar.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── StoriesSection.tsx
│   │   │   ├── SuggestedFriends.tsx
│   │   │   └── TrendingSection.tsx
│   │   ├── PersonalFormFields.tsx
│   │   ├── RegistrationTabs.tsx
│   │   └── SignInLink.tsx
│   ├── image/                    # Image assets
│   │   └── newsfeed/            # News feed images
│   ├── pages/                    # Page components
│   │   ├── BusinessForm.tsx
│   │   ├── ComingSoon.tsx
│   │   ├── Contact.tsx
│   │   ├── Maintenance.tsx
│   │   ├── Events.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── NavBar.tsx
│   │   ├── NewsFeed.tsx
│   │   ├── Pricing.tsx
│   │   ├── Register.tsx
│   │   ├── Services.tsx
│   │   ├── SignIn.tsx
│   │   ├── Success.tsx
│   │   ├── Testimonials.tsx
│   │   └── welcomepage.tsx
│   ├── scss/                     # SCSS stylesheets
│   │   ├── _base.scss
│   │   ├── _comingsoon.scss
│   │   ├── _contact.scss
│   │   ├── _maintenance.scss
│   │   ├── _events.scss
│   │   ├── _footer.scss
│   │   ├── _hero.scss
│   │   ├── _mixins.scss
│   │   ├── _navbar.scss
│   │   ├── _newsfeed.scss
│   │   ├── _pricing.scss
│   │   ├── _register.scss
│   │   ├── _services.scss
│   │   ├── _signin.scss
│   │   ├── _success.scss
│   │   ├── _guidelines.scss
│   │   ├── _variables.scss
│   │   └── _welcomepage.scss
│   ├── main.tsx                  # Application entry point
│   ├── main.scss                 # Main stylesheet
│   └── vite-env.d.ts            # Vite type definitions
├── JosCity-Backend/              # Backend API
│   ├── apis/
│   │   └── modules/
│   │       ├── config/           # Database and email config
│   │       ├── controllers/      # Request handlers
│   │       │   ├── admin/        # Admin controllers
│   │       │   └── authController.ts
│   │       ├── middleware/       # Auth middleware
│   │       └── routes/           # API routes
│   │           └── admin/        # Admin routes
│   ├── server.ts                 # Express server
│   ├── package.json
│   └── tsconfig.json
├── public/                       # Static assets
├── dist/                         # Production build output
├── index.html                    # HTML entry point
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── netlify.toml                  # Netlify deployment config
└── vercel.json                   # Vercel deployment config
```

## 🛣️ Routes

### Frontend Routes
- `/` - Landing page (Hero, Services, Events, Pricing, Testimonials, Contact)
- `/welcome` - Welcome page
- `/registernow` - User registration (Personal/Business)
- `/signin` - User sign in
- `/business-form` - Business account registration
- `/newsfeed` - Social news feed
- `/coming-soon` - Coming soon page
- `/success` - Success confirmation page

### Maintenance Mode
To enable maintenance mode and display a maintenance page for all routes, set the environment variable:
```env
VITE_MAINTENANCE_MODE=true
```
When enabled, all routes will display the maintenance page instead of the normal application. This is useful during scheduled maintenance or updates.

### Backend API Routes
- `/api/auth/signup` - User registration
- `/api/auth/signin` - User login
- `/api/auth/signout` - User logout
- `/api/auth/forget_password` - Request password reset
- `/api/auth/forget_password_confirm` - Confirm reset code
- `/api/admin/*` - Admin panel routes (dashboard, users, posts, settings)

## 🔧 Development

### Frontend Development
The frontend uses Vite with hot module replacement. The development server proxies API requests to `http://localhost:3000`.

### Backend Development
The backend uses `ts-node-dev` for development with hot-reload. Make sure your database is running and properly configured in the `.env` file.

## 📦 Deployment

The project includes configuration files for:
- **Netlify** (`netlify.toml`)
- **Vercel** (`vercel.json`)

Build the frontend and deploy to your preferred platform. Ensure the backend API is deployed separately and update the API endpoints in the frontend configuration.

## 📝 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
