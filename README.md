# SmartERP

A production-quality, Tally-inspired cloud ERP system for Indian businesses.

[![License](https://img.shields.io/badge/License-Private-red.svg?style=flat-square)](#)
[![Workspaces](https://img.shields.io/badge/Workspaces-npm-blue.svg?style=flat-square&logo=npm)](#)
[![Platform](https://img.shields.io/badge/Platform-Mac%20%7C%20Linux%20%7C%20Windows-lightgrey.svg?style=flat-square)](#)

## Tech Stack

| Layer | Technology Badges |
|---|---|
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) |
| **Backend** | ![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white) ![Knex.js](https://img.shields.io/badge/Knex.js-3.x-E16422?style=flat-square&logo=knex&logoColor=white) |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat-square&logo=postgresql&logoColor=white) |
| **Auth** | ![JWT](https://img.shields.io/badge/JWT-Access%20%2B%20Refresh-000000?style=flat-square&logo=json-web-tokens&logoColor=white) |

## Project Structure

```
SmartERP/
├── backend/          # Express.js API server
├── frontend/         # Next.js 16 application
├── shared/           # Shared TypeScript types & Zod schemas
├── package.json      # npm workspaces root
└── .env.example      # Environment variable template
```

## Prerequisites

- **Node.js** >= 20.0.0
- **PostgreSQL** >= 14
- **npm** >= 9

## Setup

### 1. Clone and Install Dependencies

```bash
git clone <repo-url>
cd SmartERP
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file and set the following parameters:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A secure random secret key (minimum 16 characters).
- `CORS_ORIGIN`: The client application URL (default: `http://localhost:3000`).

### 3. Database Initialization

```bash
createdb smarterp
# Or via psql:
# psql -U postgres -c "CREATE DATABASE smarterp;"
```

### 4. Run Migrations

```bash
cd backend && npm run migrate
```

### 5. Start Development Servers

Run the startup command from the root directory:

```bash
npm run dev
```

Alternatively, launch individual workspaces:

```bash
# Start backend API (port 4000)
npm run dev:backend

# Start frontend application (port 3000)
npm run dev:frontend
```

### 6. Access Interface

Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `POST` | `/api/v1/auth/register` | Register a new user | No |
| `POST` | `/api/v1/auth/login` | Log in user and generate JWT tokens | No |
| `POST` | `/api/v1/auth/refresh` | Refresh expired access tokens | No |
| `POST` | `/api/v1/auth/logout` | Log out and invalidate refresh token | Yes |
| `GET`  | `/api/v1/auth/me` | Retrieve authenticated user profile | Yes |

### Company Management
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `POST` | `/api/v1/companies` | Create a new company and auto-seed defaults | Yes |
| `GET`  | `/api/v1/companies` | Retrieve user-mapped companies | Yes |
| `GET`  | `/api/v1/companies/:id` | Get company settings | Yes |
| `PUT`  | `/api/v1/companies/:id` | Update company configuration details | Yes |

### Master Data Management
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `GET`  | `/api/v1/ledger-groups` | Get flat list of ledger groups | Yes |
| `GET`  | `/api/v1/ledger-groups/tree` | Get hierarchical ledger groups tree | Yes |
| `POST` | `/api/v1/ledger-groups` | Create custom ledger group | Yes |
| `PUT`  | `/api/v1/ledger-groups/:id` | Update custom ledger group | Yes |
| `DELETE` | `/api/v1/ledger-groups/:id` | Delete custom ledger group | Yes |
| `GET`  | `/api/v1/ledgers` | Retrieve active ledger accounts | Yes |
| `POST` | `/api/v1/ledgers` | Create new ledger account | Yes |
| `PUT`  | `/api/v1/ledgers/:id` | Update ledger details | Yes |
| `DELETE` | `/api/v1/ledgers/:id` | Delete ledger account | Yes |
| `GET`  | `/api/v1/customers` | Retrieve customers (Sundry Debtors) | Yes |
| `POST` | `/api/v1/customers` | Create customer profile | Yes |
| `PUT`  | `/api/v1/customers/:id` | Update customer details | Yes |
| `DELETE` | `/api/v1/customers/:id` | Delete customer profile | Yes |
| `GET`  | `/api/v1/suppliers` | Retrieve suppliers (Sundry Creditors) | Yes |
| `POST` | `/api/v1/suppliers` | Create supplier profile | Yes |
| `PUT`  | `/api/v1/suppliers/:id` | Update supplier details | Yes |
| `DELETE` | `/api/v1/suppliers/:id` | Delete supplier profile | Yes |
| `GET`  | `/api/v1/units` | Retrieve active measurement units | Yes |
| `POST` | `/api/v1/units` | Create new measurement unit | Yes |
| `PUT`  | `/api/v1/units/:id` | Update measurement unit details | Yes |
| `DELETE` | `/api/v1/units/:id` | Delete measurement unit | Yes |
| `GET`  | `/api/v1/tax-rates` | Retrieve GST rates | Yes |
| `POST` | `/api/v1/tax-rates` | Create new tax rate slab | Yes |
| `PUT`  | `/api/v1/tax-rates/:id` | Update tax rate details | Yes |
| `DELETE` | `/api/v1/tax-rates/:id` | Delete tax rate slab | Yes |
| `GET`  | `/api/v1/stock-groups` | Retrieve stock categories | Yes |
| `GET`  | `/api/v1/stock-groups/tree` | Retrieve stock groups hierarchy | Yes |
| `POST` | `/api/v1/stock-groups` | Create stock category group | Yes |
| `PUT`  | `/api/v1/stock-groups/:id` | Update stock group details | Yes |
| `DELETE` | `/api/v1/stock-groups/:id` | Delete stock category group | Yes |
| `GET`  | `/api/v1/stock-items` | Retrieve inventory stock items | Yes |
| `POST` | `/api/v1/stock-items` | Create stock item | Yes |
| `PUT`  | `/api/v1/stock-items/:id` | Update stock item profile | Yes |
| `DELETE` | `/api/v1/stock-items/:id` | Delete stock item profile | Yes |

### Transaction Engine (Accounting Vouchers) & Invoices
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| `GET`  | `/api/v1/vouchers` | Retrieve filtered list of vouchers (Day Book) | Yes |
| `GET`  | `/api/v1/vouchers/:id` | Retrieve complete voucher details (entries & stock list) | Yes |
| `POST` | `/api/v1/vouchers` | Post a new voucher (or save as Draft) | Yes |
| `POST` | `/api/v1/vouchers/:id/post` | Post a draft voucher | Yes |
| `POST` | `/api/v1/vouchers/:id/cancel` | Cancel a posted voucher (keeps history, zeros figures) | Yes |
| `POST` | `/api/v1/vouchers/:id/reverse` | Reverse a voucher (creates opposite counter-entry) | Yes |
| `GET`  | `/api/v1/vouchers/:id/audit` | Retrieve full cryptographic audit trail trail log | Yes |
| `GET`  | `/api/v1/vouchers/:id/invoice` | Expose compiled Invoice DTO metadata | Yes |
| `GET`  | `/api/v1/vouchers/:id/pdf` | Stream raw binary Tax Invoice PDF | Yes |

## Development Roadmap

- [x] **Phase 1**: Architecture & Design
- [x] **Phase 2**: Project Setup & Authentication
- [x] **Phase 3**: Company Management & Seeding
- [x] **Phase 4**: Master Data
- [x] **Phase 5**: Transaction Engine (Accounting Vouchers & Audits)
- [x] **Phase 6**: GST & Invoice PDF Generation (Watermarks & Printing)
- [ ] **Phase 7**: Financial & Inventory Reports
- [ ] **Phase 8**: Keyboard-First Navigation Workflow
- [ ] **Phase 9**: Test Coverage & Hardening

## License

Private. All rights reserved.
