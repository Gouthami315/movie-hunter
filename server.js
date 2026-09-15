const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());

// Serve index.html and other files
app.use(express.static(__dirname));

// Serve poster images
app.use("/posters", express.static(path.join(__dirname, "posters")));

const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
    try {
        await client.connect();

        console.log("Connected to MongoDB!");

        const db = client.db("movieapp");

        const moviesCollection = db.collection("movies");
        const reviewsCollection = db.collection("reviews");

        // Home page
        app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "index.html"));
        });

        // Get all movies
        app.get("/movies", async (req, res) => {
            try {
                const movies = await moviesCollection.find().toArray();
                res.json(movies);
            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to fetch movies"
                });
            }
        });

        // Get reviews for a movie
        app.get("/reviews/:movieId", async (req, res) => {
            try {
                const reviews = await reviewsCollection
                    .find({
                        movieId: new ObjectId(req.params.movieId)
                    })
                    .toArray();

                res.json(reviews);
            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to fetch reviews"
                });
            }
        });

        // Add a review
        app.post("/reviews", async (req, res) => {
            try {
                const review = {
                    movieId: new ObjectId(req.body.movieId),
                    name: req.body.name,
                    rating: Number(req.body.rating),
                    comment: req.body.comment
                };

                await reviewsCollection.insertOne(review);

                res.json({
                    message: "Review added successfully!"
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to add review"
                });
            }
        });

        // Edit a review
        app.put("/reviews/:reviewId", async (req, res) => {
            try {
                await reviewsCollection.updateOne(
                    {
                        _id: new ObjectId(req.params.reviewId)
                    },
                    {
                        $set: {
                            name: req.body.name,
                            rating: Number(req.body.rating),
                            comment: req.body.comment
                        }
                    }
                );

                res.json({
                    message: "Review updated successfully!"
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to update review"
                });
            }
        });

        // Delete a review
        app.delete("/reviews/:reviewId", async (req, res) => {
            try {
                await reviewsCollection.deleteOne({
                    _id: new ObjectId(req.params.reviewId)
                });

                res.json({
                    message: "Review deleted successfully!"
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to delete review"
                });
            }
        });

        // Start server
        app.listen(3000, () => {
            console.log("Server running at http://localhost:3000");
        });

    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

startServer();