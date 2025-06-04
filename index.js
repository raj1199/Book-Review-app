// Required Modules
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { error } = require('console');
const { Schema } = mongoose;
const app = express();
require('dotenv').config();



// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
const MONGOURI = process.env.MONGOURI;

mongoose.connect(MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// User Schema
const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Book Schema
const bookSchema = new Schema({
    title: String,
    author: String,
    genre: String,
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});
const Book = mongoose.model('Book', bookSchema);

// Review Schema
const reviewSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book' },
    rating: Number,
    comment: String,
});
const Review = mongoose.model('Review', reviewSchema);

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ code: 401, error: 'Invalid credentials' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ code: 403, error: 'Forbidden' });
        req.user = user;
        next();
    });
}

// Routes
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!password || password.length < 8) {
        res.status(400).json({ code: 400, error: 'Password should be contains atleast 8 letters' });
    }
    if (!username || username.trim() == '') {
        res.status(400).json({ code: 400, error: 'Username should not be empty' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({ username, password: hashedPassword });
        res.status(201).json({ code: 200, user });
    } catch (err) {
        console.log(`error in signup api - ${err}`);
        res.status(400).json({ code: 400, error: 'Username already exists' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ code: 401, error: 'Invalid credentials' });
    }
    try {
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ code: 200, token });
    } catch (err) {
        console.log(`error in login api - ${err}`);
        res.status(500).json({ code: 500, error: 'Internal server error' });
    }
});


app.post('/books', authenticateToken, async (req, res) => {
    const { title, author, genre } = req.body;
    const userId = req.user.userId;
    console.log("userid in books post api - ", userId);

    try {
        // Check if book with same title, author, and genre exists
        const existingBook = await Book.findOne({ title, author, genre });

        if (existingBook) {
            // Add userId to the users array if not already present
            if (!existingBook.userIds.includes(userId)) {
                existingBook.userIds.push(userId);
                await existingBook.save();
            }

            return res.status(200).json({ message: "Book already exists. Added user to book.", book: existingBook });
        }

        // If book does not exist, create new one
        const newBook = new Book({ title, author, genre, userIds: [userId] });
        await newBook.save();

        res.status(201).json({ message: "Book created successfully", book: newBook });
    } catch (err) {
        console.error("error post books api - ", err);
        res.status(500).json({ code: 500, error: "Internal Server error" });
    }
});


app.get('/books', async (req, res) => {
    const { page = 1, limit = 10, author, genre } = req.query;


    if (page < 1 || limit < 1) {
        return res.status(400).json({ code: 400, error: 'Page and limit must be positive integers' });
    }
    const filter = {};
    if (author) filter.author = new RegExp(author, 'i');
    if (genre) filter.genre = new RegExp(genre, 'i');
    try {
        const books = await Book.find(filter)
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({ code: 200, books });
    } catch (err) {
        console.log("error in get book api - ", err);
        res.status(500).json({ code: 500, error: "Internal Server Error" });
    }

});

app.get('/books/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(400).json({ code: 400, message: "bookid not found", error: "Bad Request" });
        }
        const reviews = await Review.find({ bookId: req.params.id });
        const avgRating =
            reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
        res.json({ code: 200, book, avgRating, reviews });
    } catch (err) {
        console.log("error in get books by bookid - ", err);
        res.status(500).json({ code: 500, error: "Internal Server Error" });
    }

});

app.post('/books/:id/reviews', authenticateToken, async (req, res) => {
    try {
        const existing = await Review.findOne({ bookId: req.params.id, userId: req.user.userId });
        if (existing) return res.status(400).json({ error: 'You already reviewed this book' });
        const review = new Review({
            ...req.body,
            bookId: req.params.id,
            userId: req.user.userId,
        });
        await review.save();
        res.status(201).json({ code: 200, review });
    } catch (err) {
        console.log("error in post books by bookid reviews (submit review) - ", err);
        res.status(500).json({ code: 500, error: "Internal Server Error" });
    }

});

app.put('/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review )
            return res.status(404).json({ code: 404, error: 'Not Found' });
        if (review.userId.toString() !== req.user.userId)
            return res.status(403).json({ code: 403, error: 'Unauthorized' });
        Object.assign(review, req.body);
        await review.save();
        res.status(200).json({ code: 200, message: "review added", review });
    } catch (err) {
        console.log("error in put reviews by reviewid (update existing review) - ", err);
        res.status(500).json({ code: 500, error: "Internal Server Error" });
    }

});

app.delete('/reviews/:id', authenticateToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review )
            return res.status(404).json({ code: 404, error: 'Not Found' });
        if (review.userId.toString() !== req.user.userId)
            return res.status(403).json({ code: 403, error: 'Unauthorized' });
        await review.deleteOne()
        res.status(200).json({ code: 200, message: "sucessfully deleted" });
    } catch (err) {
        console.log("error in delete reviews by reviewid (delete existing review) - ", err);
        res.status(500).json({ code: 500, error: "Internal Server Error" });
    }

});

app.get('/search', async (req, res) => {
    const { q } = req.query;
    const results = await Book.find({
        $or: [
            { title: new RegExp(q, 'i') },
            { author: new RegExp(q, 'i') },
        ],
    });
    res.json({code:200, results});
});

// Start Server
app.listen(3000, () => console.log('Server running on port 3000'));
