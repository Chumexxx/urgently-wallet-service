```markdown
# Urgently Wallet Service MVP

# Project Overview
A secure and scalable wallet service API built with Node.js, TypeScript, KnexJS ORM, and MySQL. Users can create accounts, fund wallets, transfer funds, and withdraw money with built-in Lendsqr Adjutor Karma blacklist verification.

Table of Contents

# Features
Tech Stack
Database Design
Getting Started
API Documentation
Testing
Project Structure
Design Decisions

### Features

✅ User registration with blacklist verification
✅ Faux token-based authentication (JWT)
✅ Wallet creation automatically on user registration
✅ Fund wallet functionality
✅ Transfer funds between users
✅ Withdraw funds from wallet
✅ Transaction history tracking
✅ Database transaction scoping for data integrity
✅ Comprehensive unit tests
✅ Lendsqr Adjutor Karma blacklist integration

# Tech Stack

Runtime: Node.js (LTS v18+)
Language: TypeScript
Framework: Express.js
Database: MySQL 8.0+
ORM: KnexJS
Authentication: JSON Web Tokens (JWT)
Validation: Joi
Testing: Jest, Supertest
Password Hashing: bcryptjs

### Database Design
Entity-Relationship Diagram

<img width="826" height="607" alt="wallet-service-E-R Diagram" src="https://github.com/user-attachments/assets/17483139-f03b-4427-ae13-07dbb3a38e09" />

Database Relationships

Users → Wallets (One-to-One)

Each user has exactly one wallet
Wallet is created automatically on user registration
CASCADE delete: Deleting a user deletes their wallet


Wallets → Transactions (One-to-Many)

Each wallet can have multiple transactions
Transactions track all wallet activities
CASCADE delete: Deleting a wallet deletes all its transactions


### Getting Started

### Prerequisites

Node.js v18+ LTS
MySQL 8.0+
npm or yarn

Installation

Clone the repository

```bash
git clone <https://github.com/Chumexxx/urgently-wallet-service.git>
cd urgently-wallet-service

# Install dependencies

```bash
npm install

# Setup MySQL Database

sqlCREATE DATABASE wallet_service;
CREATE DATABASE wallet_service_test;

# Configure environment variables

Create a .env file in the root directory:
env# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wallet_service

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Lendsqr Adjutor Karma API
KARMA_API_URL=https://adjutor.lendsqr.com/v2
KARMA_API_KEY=your_karma_api_key

Run database migrations

```bash
npx knex migrate:latest
or
npm run knex migrate:latest

Start the development server

```bash
npm run dev
The server will start on http://localhost:2000

## Lendsqr Adjutor Karma Setup

Visit Lendsqr Adjutor
Sign up for an account
Generate an API key from your dashboard
Add the API key to your .env file

API Documentation
Base URL
http://localhost:2000/api/v1
Authentication
All wallet endpoints require authentication. Include the JWT token in the Authorization header:
Authorization: Bearer <your_jwt_token>
# Endpoints
1. Register User
POST /auth/register
Creates a new user account and wallet. Verifies against Lendsqr Karma blacklist.
Request Body:
json{
  "email": "chukwuemekaobasi@example.com",
  "password": "password1234#",
  "first_name": "Chukwuemeka",
  "last_name": "Obasi",
  "phone": "01111111111"
}
Response (201):
json{
  "status": "success",
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "b418f46c-4b8a-4a92-a1c0-b28be934ce95",
      "email": "chukwuemekaobasi@example.com",
      "first_name": "Chukwuemeka",
      "last_name": "Obasi",
      "phone": "01111111111",
      "wallet_id": "c42d253a-4e42-4f1f-aca3-7aca639023ca",
      "balance": "0.00"
    },
    "token": "jwt_token_here"
  }
}
3. Login
POST /auth/login
Authenticates a user and returns a JWT token.
Request Body:
json{
  "email": "chukwuemekaobasi@example.com",
  "password": "password1234#"
}
Response (200):
json{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "b418f46c-4b8a-4a92-a1c0-b28be934ce95",
      "email": "chukwuemekaobasi@example.com",
      "first_name": "Chukwuemeka",
      "last_name": "Obasi",
      "phone": "01111111111",
    },
    "token": "jwt_token_here"
  }
}
5. Get Wallet Balance
GET /wallet/balance
Headers: Authorization: Bearer <token>
Response (200):
json{
  "status": "success",
  "message": "Wallet balance retrieved successfully",
  "data": {
    "balance": 2000.00,
    "currency": "NGN",
    "wallet_id": "uuid"
  }
  "statusCode": 200
}
7. Fund Wallet
POST /wallet/fund
Headers: Authorization: Bearer <token>
Request Body:
json{
  "amount": 3500.00
}
Response (200):
json{
  "status": "success",
  "data": {
    "message": "Wallet funded successfully",
    "transaction": {
      "reference": "TXN-uuid",
      "amount": 3500.00,
      "balance": 5500.00,
      "type": "credit",
      "category": "funding"
    }
  }
}
8. Transfer Funds
POST /wallet/transfer
Headers: Authorization: Bearer <token>
Request Body:
json{
  "recipient_email": "obong@example.com",
  "amount": 2000.00,
  "description": "Payment for services"
}
Response (200):
json{
  "status": "success",
  "data": {
    "message": "Transfer successful",
    "transaction": {
      "reference": "TXN-uuid",
      "amount": 2000.00,
      "recipient": {
        "email": "obong@example.com",
        "name": "Obong Abasi"
      },
      "balance": 13000.00
    }
  }
}
9. Withdraw Funds
POST /wallet/withdraw
Headers: Authorization: Bearer <token>
Request Body:
json{
  "amount": 5000.00,
  "description": "Car money"
}
Response (200):
json{
  "status": "success",
  "data": {
    "message": "Withdrawal successful",
    "transaction": {
      "reference": "TXN-uuid",
      "amount": 5000.00,
      "balance": 8000.00,
      "type": "debit",
      "category": "withdrawal"
    }
  }
}
10. Get Transaction History
GET /wallet/transactions
Headers: Authorization: Bearer <token>
Response (200):
json{
  "status": "success",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "reference": "TXN-uuid",
        "type": "credit",
        "category": "funding",
        "amount": 10000.00,
        "balance_before": 0.00,
        "balance_after": 10000.00,
        "description": "Wallet funding",
        "status": "success",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
10. Get My Wallet
GET /wallet/
Headers: Authorization: Bearer <token>
Response (200):
json{
  "status": "success",
  "data": {
        "balance": 400,
        "currency": "NGN",
        "wallet_id": "c42d253a-4e42-4f1f-aca3-7aca639023ca",
        "recent_transactions": [
            {
                "id": "37dcd88c-3659-46b1-8f1d-7e9d8131240a",
                "reference": "TXN-586d8727-6314-401c-a27d-d461577a4233",
                "type": "debit",
                "category": "withdrawal",
                "amount": 100,
                "balance_before": 500,
                "balance_after": 400,
                "description": "Car money",
                "status": "success",
                "created_at": "2025-11-26T09:03:33.000Z"
            },
            {
                "id": "49706414-343c-48d7-8357-1b5cda06ef97",
                "reference": "TXN-92127b45-d357-456e-90be-5c768504f394",
                "type": "debit",
                "category": "transfer",
                "amount": 200,
                "balance_before": 700,
                "balance_after": 500,
                "description": "Money for car",
                "status": "success",
                "created_at": "2025-11-26T08:57:06.000Z"
            },
            {
                "id": "d8764b61-03cd-4167-ae7e-b3f006616746",
                "reference": "TXN-99b4f2bd-423e-480e-ad18-76b3204e31bb",
                "type": "credit",
                "category": "funding",
                "amount": 400,
                "balance_before": 300,
                "balance_after": 700,
                "description": "Wallet funding",
                "status": "success",
                "created_at": "2025-11-26T08:44:14.000Z"
            },
            {
                "id": "986ca075-5f1c-48c6-9e14-b5743dd4a99f",
                "reference": "TXN-53172e9f-88a2-4a0e-830d-c4ebfd9f26b7",
                "type": "credit",
                "category": "funding",
                "amount": 300,
                "balance_before": 0,
                "balance_after": 300,
                "description": "Wallet funding",
                "status": "success",
                "created_at": "2025-11-26T08:43:57.000Z"
            }
        ],
        "recent_transactions_count": 4
    },
Error Responses
All errors follow this format:
json{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
Common Status Codes:

400 - Bad Request (validation errors)
401 - Unauthorized (missing/invalid token)
403 - Forbidden (blacklisted user)
404 - Not Found (resource doesn't exist)
409 - Conflict (duplicate email/phone)
500 - Internal Server Error

Testing
The project includes comprehensive unit tests covering positive and negative scenarios.
Run Tests
bash# Run unit test
npm run test:unit

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
Test Coverage
Tests cover:

✅ User registration
✅ User login
✅ Wallet creation
✅ Fund wallet 
✅ Transfer funds
✅ Withdraw funds 
✅ Transaction history retrieval
✅ Authentication middleware
✅ Input validation

Project Structure
urgently-wallet-service/
├── src/
│   ├── config/
│   │   ├── database.ts          # Knex database configuration
│   ├── controllers/
│   │   ├── authController.ts   # Authentication controllers
│   │   └── walletController.ts # Wallet operations controllers
│   ├── middlewares/
│   │   ├── authMiddleware.ts   # JWT authentication
│   │   ├── errorMiddleware.ts  # Error handling
│   │   └── validationMiddleware.ts
│   ├── migrations/              # Database migrations
│   │   ├── 20251125033918_create_users_table.ts
│   │   ├── 20251125034412_create_wallet_table.ts
│   │   ├── 20251125034937_create_transactions_table.ts
│   │   ├── 20251126083612_fix_transaction_reference_length.ts
│   ├── models/
│   │   ├── transactionModel.ts    # Transaction data access    
│   │   ├── userModel.ts      # User data access
│   │   └── walletModel.ts # Wallet data access
│   ├── routes/
│   │   ├── authRoutes.ts       # Authentication routes
│   │   ├── index.ts     
│   │   └── walletRoutes.ts    # Wallet routes
│   ├── services/
│   │   ├── authService.ts      # Business logic for auth
│   │   ├── karmaService.ts    # Lendsqr Karma integration  
│   │   └── walletService.ts    # Business logic for wallet
│   ├── tests/               # Unit tests
│   │   ├── middlewares/
│   │   └── authMiddleware.tests.ts             
│   │   └── errorMiddleware.tests.ts
│   │   └── validationMiddleware.tests.ts
│   │   ├── models/
│   │   └── transactionModel.tests.ts             
│   │   └── userModel.tests.ts
│   │   └── walletModel.tests.ts
│   │   ├── services/
│   │   └── authService.tests.ts             
│   │   └── karmaService.tests.ts
│   │   └── walletService.tests.ts
│   │   ├── validators/
│   │   └── authValidator.tests.ts             
│   │   └── walletValidator.tests.ts
│   ├── setup.ts
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── apiError.ts          # Custom error class
│   │   └── apiResponse.ts       # Response formatter
│   │   └── generateWebToken.ts       # Generating web tokens
│   │   └── logger.ts       # Requests logger
│   │   └── testDB.ts 
│   ├── validators/
│   │   ├── authValidator.ts    # Joi schemas for auth
│   │   └── walletValidator.ts  # Joi schemas for wallet
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Server entry point
├── .env                         # Environment variables
├── .env.example                        
├── .gitignore
├── jest.config.js
├── knexfile.ts                  # Knex configuration
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
Design Decisions
1. Layered Architecture
The application follows a clean architecture pattern:

Controllers: Handle HTTP requests/responses
Services: Contain business logic
Models: Data access layer
Middlewares: Cross-cutting concerns

Benefits: Separation of concerns, testability, maintainability
2. Database Transaction Scoping
All operations that modify multiple records use database transactions:

User registration (user + wallet creation)
Fund wallet (wallet update + transaction record)
Transfer funds (two wallet updates + two transaction records)
Withdrawal (wallet update + transaction record)

Benefits: ACID compliance, data consistency, rollback on errors
3. Row-Level Locking
For concurrent operations, we use forUpdate() to lock wallet rows:
typescriptconst balance = await WalletModel.getBalanceForUpdate(wallet.Id, trx);
Benefits: Prevents race conditions, ensures balance accuracy
4. UUID Primary Keys
All tables use UUID instead of auto-increment integers.
Benefits: Better security, distributed system compatibility, no sequential guessing
5. Decimal for Money
Balances and amounts use DECIMAL(15,2) instead of FLOAT.
Benefits: Precision, no rounding errors in financial calculations
6. Transaction Audit Trail
Every wallet operation creates a transaction record with:

Balance before
Balance after
Unique reference
Timestamp

Benefits: Complete audit trail, reconciliation, dispute resolution
7. Fail-Safe Karma Check
If the Karma API fails, users can still register (logged for review).
Rationale: External service failures shouldn't completely block operations
8. OOP Principles

Singleton Pattern: Services and models are instantiated once
Dependency Injection: Controllers receive services
Single Responsibility: Each class has one clear purpose
DRY Principle: Reusable utilities, middlewares, and validators

9. Error Handling Strategy

Custom ApiError class for operational errors
Global error middleware
Consistent error response format
Proper HTTP status codes

10. Security Best Practices

Password hashing with bcrypt
JWT for stateless authentication
Input validation with Joi
SQL injection prevention (parameterized queries via Knex)
No sensitive data in logs

Development Scripts
bash# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run migrations
npx knex migrate:latest

# Rollback migrations
npx knex migrate:rollback

# Create new migration
npx knex migrate:make migration_name
Environment Variables
# Server
NODE_ENV=
PORT=

# Database
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# Lendsqr Adjutor Karma API
KARMA_API_URL=
KARMA_API_KEY=

Future Enhancements

 Implement rate limiting
 Add pagination for transaction history
 Implement webhook notifications
 Add two-factor authentication
 Implement account freeze/unfreeze
 Add transaction filters (date range, amount range)
 Add transaction reversals/refunds
 Create admin dashboard

Contributing

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

License
This project is for assessment purposes only.
Author
Obasi Chukwuemeka Ude - [obasyemeka@gmail.com]
Acknowledgments

Lendsqr for the Adjutor Karma API
The Node.js and TypeScript communities
