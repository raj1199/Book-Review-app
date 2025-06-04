# Book-Review-app

# 📚 Book Review API (Node.js + Express + MongoDB)

A RESTful API for managing users, books, and reviews with authentication using JWT. Multiple users can associate with the same book (based on title-author-genre), and leave one review each per book.

---

## 🔧 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- JWT (Authentication)
- bcrypt (Password Hashing)

---

## 🚀 Project Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/raj1199/Book-Review-app.git
cd Book-Review-app

---

## Example API Requests (cURL / Postman)
🔐 Signup

curl --location 'http://localhost:3000/signup' \
--header 'Content-Type: application/json' \
--data '{
    "username": "john_wick_3",
    "password": "password789"
}'

🔐 Login

curl --location 'http://localhost:3000/login' \
--header 'Content-Type: application/json' \
--data '{
    "username": "john_wick_1",
    "password": "password123"
}'

📚 Add Book

curl --location 'http://localhost:3000/books' \
--header 'Authorization: Bearer <JWT_TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "genre": "Novel"
}'


📖 Get All Books with Filter

curl --location 'http://localhost:3000/books?page=1&limit=10&author=F&genre=Programming'

📖 Get Books by bookId

curl --location 'http://localhost:3000/books/:id'

📝 Submit Review

curl --location 'http://localhost:3000/books/:id/reviews' \
--header 'Authorization: Bearer <JWT_TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
    "rating": 5,
    "comment": "Excellent book."
}'

✏️ Update Review

curl --location --request PUT 'http://localhost:3000/reviews/:id' \
--header 'Authorization: Bearer <JWT_TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
    "rating": 3,
    "comment": "Still a great book, updated review."
}'

❌ Delete Review

curl --location --request DELETE 'http://localhost:3000/reviews/:id' \
--header 'Authorization: Bearer <JWT_TOKEN>'

🔍 Search Books

curl --location 'http://localhost:3000/search?q=pragmatic'


Schema Design


Book schema

{
    title: String,
    author: String,
    genre: String,
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}

User schema

{
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}

Review schema

{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book' },
    rating: Number,
    comment: String,
}





