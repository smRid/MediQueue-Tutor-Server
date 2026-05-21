# MediQueue Server

A robust Express.js backend for the MediQueue application. This server handles authentication verification, tutor management, and student bookings, backed by MongoDB.

🔗 **Live Client Application**: [https://mediqueuetutor.vercel.app/](https://mediqueuetutor.vercel.app/)

## 🚀 Features

- **Tutor Management**: Add, update, delete, and list tutors.
- **Booking System**: Securely book tutor sessions, manage slot availability, and cancel bookings. Unique tokens are generated for each booking.
- **Authentication**: Custom JWT-based authentication for securing private API endpoints.
- **Advanced Database Handling**: Seamlessly connects to MongoDB Atlas with a graceful fallback to a local MongoDB instance.
- **Search & Filtering**: Search tutors by name and filter them by creation dates.
- **CORS Configured**: Ready to be integrated with your frontend application.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Native MongoDB Node.js Driver)
- **Authentication**: JWT verification (using `jose-cjs` and Node's native `crypto` module)
- **Environment Management**: `dotenv`
- **Development Tooling**: Nodemon

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or an Atlas connection URI)

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd MediQueue-Tutor-Server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory based on your environment:
   ```env
   PORT=5000
   CLIENT_BASE_URL=http://localhost:3000
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=mediqueue
   JWT_SECRET=your_jwt_secret_key
   BETTER_AUTH_SECRET=fallback_secret_key
   ```

4. **Start the server:**
   
   To run in development mode (starts MongoDB locally on Windows if possible and uses nodemon):
   ```bash
   npm run dev
   ```

   To run normally with nodemon:
   ```bash
   npm start
   ```

## 📡 API Endpoints

### Public Routes
- `GET /` - Health check. Returns server status.
- `GET /tutors` - Fetch all tutors. 
  - **Query Params**: `search` (string), `startDate` (date), `endDate` (date), `limit` (number).

### Protected Routes (Requires JWT)

**Tutors:**
- `POST /tutors` - Add a new tutor.
- `GET /tutors/:id` - Get specific tutor details.
- `GET /my-tutors` - Get tutors added by the authenticated user.
- `PATCH /my-tutors/:id` - Update a specific tutor.
- `DELETE /my-tutors/:id` - Delete a specific tutor.

**Bookings:**
- `POST /bookings` - Book a session with a tutor.
- `GET /my-bookings` - Fetch all bookings for the authenticated student.
- `PATCH /my-bookings/:id` - Cancel a specific booking.

## 🔒 Authentication

This API uses JSON Web Tokens (JWT) for securing protected routes. You must include the token in the `Authorization` header of your HTTP requests:
```http
Authorization: Bearer <your_jwt_token>
```

## 📜 License

This project is licensed under the ISC License.