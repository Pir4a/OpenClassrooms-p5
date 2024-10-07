const Book = require("../models/book")
const average = require("../average")
const fs = require("fs")

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book)
  delete bookObject._id
  delete bookObject._userId
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/resized_${
      req.file.filename
    }`,
    averageRating: bookObject.ratings[0].grade,
  })

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" })
    })
    .catch((error) => {
      res.status(400).json({ error })
    })
}
// GET
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }))
}

// PUT
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/resized_${
          req.file.filename
        }`,
      }
    : { ...req.body }
  delete bookObject._userId
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: "403: unauthorized request" })
      } else {
        const filename = book.imageUrl.split("/images/")[1]
        req.file &&
          fs.unlink(`images/${filename}`, (err) => {
            if (err) console.log(err)
          })
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié !" }))
          .catch((error) => res.status(400).json({ error }))
      }
    })
    .catch((error) => {
      res.status(404).json({ error })
    })
}
// DELETE
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: "403: unauthorized request" })
      } else {
        const filename = book.imageUrl.split("/images/")[1]
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" })
            })
            .catch((error) => res.status(400).json({ error }))
        })
      }
    })
    .catch((error) => {
      res.status(404).json({ error })
    })
}

// GET ALL BOOKS
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }))
}

// POST ( rating )
exports.createRating = (req, res, next) => {
  if (0 <= req.body.rating <= 5) {
    const ratingObject = { ...req.body, grade: req.body.rating }
    delete ratingObject._id
    Book.findOne({ _id: req.params.id })
      .then((book) => {
        const newRatings = book.ratings
        const userIdArray = newRatings.map((rating) => rating.userId)
        if (userIdArray.includes(req.auth.userId)) {
          res.status(403).json({ message: "Not authorized" })
        } else {
          newRatings.push(ratingObject)
          const grades = newRatings.map((rating) => rating.grade)
          const averageGrades = average.average(grades)
          book.averageRating = averageGrades
          Book.updateOne(
            { _id: req.params.id },
            {
              ratings: newRatings,
              averageRating: averageGrades,
              _id: req.params.id,
            }
          )
            .then(() => {
              res.status(201).json()
            })
            .catch((error) => {
              res.status(400).json({ error })
            })
          res.status(200).json(book)
        }
      })
      .catch((error) => {
        res.status(404).json({ error })
      })
  } else {
    res.status(400).json({ message: "La note doit être comprise entre 1 et 5" })
  }
}

// GET
exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }))
}
