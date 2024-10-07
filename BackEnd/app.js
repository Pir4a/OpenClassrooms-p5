const express = require("express")
const mongoose = require("mongoose")
const app = express()
const booksRoutes = require("./routes/book")
const userRoutes = require("./routes/user")
const path = require("path")

require("dotenv").config()

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"))

app.use(express.json())

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  )
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  )
  next()
})

app.use("/api/auth", userRoutes)
app.use("/api/books", booksRoutes)
app.use("/images", express.static(path.join(__dirname, "images")))

module.exports = app
