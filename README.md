# WhisperNet-Anonymous-Social-Media

WhisperNet – Anonymous Campus Social Media

WhisperNet is a campus-exclusive anonymous social media platform designed to enable honest expression while maintaining accountability. The system combines secure authentication, media-enabled posts, and real-time updates using a modern backend architecture.

--------------------------------------------------

Features Implemented

Authentication and Anonymity
- College email based user registration
- OTP based email verification
- JWT based authentication
- Protected backend routes
- Permanent anonymous pseudonyms with no email exposure

Backend and Database
- Node.js and Express backend
- MongoDB database with Mongoose
- Modular architecture with routes, middleware, and models
- Secure configuration using environment variables

Media Support (Backend)
- Cloudinary integration for image and audio storage
- Secure media upload API
- Media metadata stored in database (URL, type, publicId)
- No media files stored locally or inside MongoDB

Feed System
- Anonymous post creation
- Media attachment support at backend level
- Feed API returning latest posts with media URLs

Real-Time Updates
- Socket.io integrated with backend server
- WebSocket based persistent client connections
- Real-time broadcasting of new posts
- Connection and disconnection lifecycle logging

Technology Stack

Backend
- Node.js
- Express.js
- Socket.io
- MongoDB
- Mongoose
- JSON Web Tokens
- Nodemailer
- Cloudinary

Frontend
- React (Vite)
- Axios
- Socket.io Client (integration in progress)

--------------------------------------------------

Project Structure (Backend)

backend/
│
├── config/
│   ├── db.js
│   └── cloudinary.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── upload.js
│
├── models/
│   ├── User.js
│   └── Post.js
│
├── routes/
│   ├── postRoutes.js
│   ├── userRoutes.js
│   └── otpRoutes.js
│
├── server.js
├── .env
└── package.json

--------------------------------------------------

API Endpoints

Authentication
- POST /register
- POST /auth/send-otp
- POST /auth/verify-otp
- POST /login

Posts
- POST /posts/create (protected)
- GET /posts/feed (protected)

Media
- POST /posts/upload (protected)

--------------------------------------------------

Real-Time Architecture

Socket.io is initialized on the same HTTP server as Express. Clients establish persistent WebSocket connections. Whenever a new post is created, the backend emits a real-time event which is received instantly by all connected clients, enabling live feed updates without page refresh.

--------------------------------------------------

Environment Variables

PORT=5000  
MONGO_URI=your_mongodb_connection_string  
JWT_SECRET=your_jwt_secret  
EMAIL_USER=your_email  
EMAIL_PASS=your_email_password  
CLOUDINARY_CLOUD_NAME=your_cloud_name  
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret  

--------------------------------------------------

Testing

- REST APIs tested using Postman
- Media uploads verified through Cloudinary dashboard
- Real-time Socket.io events verified using browser and React client connections

--------------------------------------------------

Current Status

Completed
- Backend authentication system
- Media upload pipeline
- Post creation and feed APIs
- Real-time Socket.io backend integration

Pending
- Frontend media recording and attachment UI
- Live feed rendering on frontend
- Deployment to Render and Vercel
- AI moderation and chat features (Phase 2)

--------------------------------------------------

Academic Note

This project focuses on secure backend development, real-time system design, scalable media handling, and privacy-preserving anonymous identity management.

--------------------------------------------------

License

This project is developed for academic purposes.
