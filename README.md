# Finance Data Processing and Access Control Backend

A RESTful backend API for a finance dashboard system with role-based access control, financial record management, and aggregated analytics.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens) + HTTP-only Cookies
- **Password Hashing**: bcryptjs

---

## Project Structure

```
ZORVYN/
├── src/
│   ├── config/
│   │   └── db.config.js          # MongoDB connection
│   ├── controllers/
│   │   ├── user.controller.js    # User management logic
│   │   └── record.controller.js  # Financial record logic
│   ├── middlewares/
│   │   └── auth.middleware.js    # JWT auth + role authorization
│   ├── models/
│   │   ├── user.model.js         # User schema with bcrypt hooks
│   │   └── record.model.js       # Financial record schema
│   └── routes/
│       ├── user.routes.js        # User API routes
│       └── record.routes.js      # Record API routes
├── .env
├── package.json
└── server.js                     # App entry point
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ZORVYN
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 4. Start the server

```bash
node server.js
```

The API will be running at `http://localhost:5000`

---

## Roles and Permissions

The system supports three roles with clearly defined access levels:

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Login / Logout | ✅ | ✅ | ✅ |
| View dashboard summary | ✅ | ✅ | ✅ |
| View financial records | ❌ | ✅ | ✅ |
| Create financial records | ❌ | ❌ | ✅ |
| Update financial records | ❌ | ❌ | ✅ |
| Delete financial records | ❌ | ❌ | ✅ |
| Create users | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Activate / Deactivate users | ❌ | ❌ | ✅ |

---

## API Reference

### Authentication

All protected routes require a Bearer token in the `Authorization` header or a `token` cookie set at login.

---

### User Routes — `/api/user`

#### POST `/api/user/login`
Login and receive a JWT token.

**Request body:**
```json
{
  "email": "nouman@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { "name": "...", "email": "...", "role": "admin" },
  "token": "<jwt_token>"
}
```

---

#### POST `/api/user/logout`
Clears the auth cookie and logs the user out.

---

#### POST `/api/user/create` `🔒 Admin only`
Create a new user with an assigned role.

**Request body:**
```json
{
  "name": "Nouman Khan",
  "email": "nouman@example.com",
  "password": "securepassword",
  "phoneNo": "9876543210",
  "role": "analyst"
}
```
> Role must be one of: `viewer`, `analyst`, `admin`. Defaults to `viewer` if not provided.

---

#### GET `/api/user/getall` `🔒 Admin only`
Returns a list of all users (passwords excluded).

---

#### PATCH `/api/user/deactivate/:id` `🔒 Admin only`
Deactivates a user account. Deactivated users cannot log in or access any protected routes.

---

#### PATCH `/api/user/activate/:id` `🔒 Admin only`
Reactivates a previously deactivated user account.

---

### Record Routes — `/api/record`

#### POST `/api/record/create` `🔒 Admin only`
Create a new financial record.

**Request body:**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "salary",
  "date": "2026-04-01",
  "notes": "April salary"
}
```
> `type` must be either `income` or `expense`. `amount` must be greater than 0.

---

#### GET `/api/record/get` `🔒 Analyst, Admin`
Retrieve financial records with filtering, pagination, and sorting.

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `type` | string | Filter by `income` or `expense` |
| `category` | string | Filter by category name |
| `startDate` | date | Filter records from this date |
| `endDate` | date | Filter records up to this date |
| `search` | string | Search in category and notes fields |
| `page` | number | Page number (default: 1) |
| `limit` | number | Records per page (default: 10, max: 50) |
| `sortBy` | string | Sort by `date`, `amount`, or `category` |
| `order` | string | `asc` or `desc` (default: `desc`) |

---

#### PUT `/api/record/update/:id` `🔒 Admin only`
Update a financial record by ID. Only the following fields can be updated: `amount`, `type`, `category`, `date`, `notes`.

---

#### DELETE `/api/record/delete/:id` `🔒 Admin only`
Permanently delete a financial record by ID.

---

#### GET `/api/record/dashboard` `🔒 Viewer, Analyst, Admin`
Returns aggregated summary data for the finance dashboard.

**Query parameters (optional):**

| Parameter | Type | Description |
|---|---|---|
| `startDate` | date | Filter stats from this date |
| `endDate` | date | Filter stats up to this date |

**Response includes:**
- `summary` — total income, total expenses, net balance
- `categoryBreakdown` — totals grouped by category and type
- `monthlyData` — monthly income/expense trends

**Example response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 50000,
      "totalExpense": 32000,
      "balance": 18000
    },
    "categoryBreakdown": [
      { "_id": { "category": "salary", "type": "income" }, "total": 50000 }
    ],
    "monthlyData": [
      { "total": 25000 , "year": 2026, "month": 4, "type": "income" }
    ]
  }
}
```

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Description of the error"
}
```

| Status Code | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Not authenticated / token invalid or expired |
| `403` | Forbidden — insufficient role permissions or inactive account |
| `404` | Resource not found |
| `500` | Internal server error |

---

## Assumptions and Design Decisions

- **No public registration.** Only an admin can create users. This is intentional — in a finance system, user access should be controlled, not open.
- **Viewer role is restricted to dashboard only.** Viewers can see aggregated summary data but cannot access raw financial records. Analysts can read records but not modify them.
- **Passwords are never returned in any response.** The password field is excluded from all query results and manually deleted from response objects where needed.
- **Password hashing is handled by a Mongoose pre-save hook.** Raw passwords are never written to the database.
- **JWT is stored in both an HTTP-only cookie and returned in the response body.** This supports both browser-based clients (cookie) and API clients like Postman (Bearer token).
- **Active status is checked on every authenticated request**, not just at login. If an admin deactivates a user, their existing token stops working immediately.
- **`updateRecord` only allows whitelisted fields** (`amount`, `type`, `category`, `date`, `notes`). Fields like `createdBy` cannot be modified via the update endpoint.
- **MongoDB aggregation with `$facet`** is used for the dashboard endpoint to compute all stats (summary, category breakdown, monthly trends) in a single database query.

---

## Potential Improvements (Out of Scope for This Assignment)

- Pagination on the `getall` users endpoint
- Soft delete for records instead of permanent deletion
- Weekly trend data in dashboard stats
- Unit and integration tests with Jest and Supertest
- Rate limiting with `express-rate-limit`
- API documentation with Swagger / Postman collection
