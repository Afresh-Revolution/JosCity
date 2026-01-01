# Backend API Requirements for Friends Feature

This document outlines the backend API endpoints needed to support the friends feature with location-based filtering.

## Required Endpoints

### 1. User Endpoints

#### GET `/api/users/nearby?range={km}`

- **Description**: Get users within the specified range (default 5000km) of the current user
- **Authentication**: Required (Bearer token)
- **Query Parameters**:
  - `range` (number, optional): Maximum distance in kilometers (default: 5000)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "user_id": 1,
        "user_firstname": "John",
        "user_lastname": "Doe",
        "user_email": "john@example.com",
        "user_picture": "https://...",
        "user_location": {
          "latitude": 6.5244,
          "longitude": 3.3792
        },
        "distance": 125.5
      }
    ]
  }
  ```
- **Notes**:
  - Calculate distance using Haversine formula
  - Exclude current user from results
  - Exclude users who are already friends
  - User location should be stored in database (users table or separate user_locations table)

#### GET `/api/users/search?q={query}`

- **Description**: Search users by name or email
- **Authentication**: Required
- **Query Parameters**:
  - `q` (string, required): Search query
- **Response**: Same structure as `/users/nearby`

### 2. Friends Endpoints

#### POST `/api/friends/request`

- **Description**: Send a friend request to another user
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "user_id": 2
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "request_id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "message": "Friend request sent"
  }
  ```

#### POST `/api/friends/request/{requestId}/accept`

- **Description**: Accept a friend request
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user_id": 2,
      "user_firstname": "Jane",
      "user_lastname": "Doe",
      "user_picture": "https://...",
      "friendship_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    },
    "message": "Friend request accepted"
  }
  ```

#### POST `/api/friends/request/{requestId}/reject`

- **Description**: Reject a friend request
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Friend request rejected"
  }
  ```

#### GET `/api/friends/my`

- **Description**: Get current user's friends list
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "user_id": 2,
        "user_firstname": "Jane",
        "user_lastname": "Doe",
        "user_picture": "https://...",
        "friendship_id": 1,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

#### GET `/api/friends/user/{userId}`

- **Description**: Get friends list for a specific user
- **Authentication**: Required
- **Response**: Same structure as `/friends/my`

#### GET `/api/friends/requests`

- **Description**: Get pending friend requests (sent and received)
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "sent": [
        {
          "request_id": 1,
          "sender_id": 1,
          "receiver_id": 2,
          "status": "pending",
          "created_at": "2024-01-01T00:00:00Z",
          "receiver": {
            "user_id": 2,
            "user_firstname": "Jane",
            "user_lastname": "Doe",
            "user_picture": "https://..."
          }
        }
      ],
      "received": [
        {
          "request_id": 2,
          "sender_id": 3,
          "receiver_id": 1,
          "status": "pending",
          "created_at": "2024-01-01T00:00:00Z",
          "sender": {
            "user_id": 3,
            "user_firstname": "Bob",
            "user_lastname": "Smith",
            "user_picture": "https://..."
          }
        }
      ]
    }
  }
  ```

#### DELETE `/api/friends/{userId}`

- **Description**: Remove a friend (unfriend)
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Friend removed"
  }
  ```

#### GET `/api/friends/check/{userId}`

- **Description**: Check friendship status with another user
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "are_friends": true,
      "friendship_id": 1,
      "request_status": "accepted"
    }
  }
  ```
  Or if not friends:
  ```json
  {
    "success": true,
    "data": {
      "are_friends": false,
      "request_status": "pending" // or "none" or "rejected"
    }
  }
  ```

## Database Schema Requirements

### Friends Table

```sql
CREATE TABLE friends (
  friendship_id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(user_id),
  user2_id INTEGER NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id),
  CHECK(user1_id < user2_id) -- Ensure consistent ordering
);

CREATE TABLE friend_requests (
  request_id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(user_id),
  receiver_id INTEGER NOT NULL REFERENCES users(user_id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_id, status)
);
```

### User Location Table (if not in users table)

```sql
CREATE TABLE user_locations (
  user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Post Visibility Filtering

Posts should only be visible to friends. When fetching posts:

- Only include posts from users who are friends with the current user
- Exclude posts from non-friends (unless post visibility settings allow)

## Message Privacy

Messages should only be accessible between friends:

- Only allow sending messages to friends
- Only show conversations with friends
- Ensure messages are private (not visible to other users)
