# TikTik API

A basic Express server for the TikTik application.

## Setup

```bash
cd api
npm install
```

## Running the server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Posts
- GET /api/posts - Get all posts
- GET /api/posts/:id - Get a single post
- POST /api/posts - Create a new post
- PUT /api/posts/:id - Update a post
- DELETE /api/posts/:id - Delete a post

### Users
- GET /api/users - Get all users
- GET /api/users/:id - Get a single user
- POST /api/users - Create a new user
- PUT /api/users/:id - Update a user
- DELETE /api/users/:id - Delete a user 