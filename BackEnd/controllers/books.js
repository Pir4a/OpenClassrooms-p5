const Book = require("../models/book")
const average = require("../average")
const fs = require("fs")

// Fonction pour récupérer tous les livres dans la base de données.
exports.getAllBooks = (req, res, next) => {
  // Utilisation du modèle Book pour trouver tous les livres.
  Book.find()
    .then((books) =>
      // Si la recherche est réussie, renvoie les livres trouvés avec un statut 200 (OK).
      res.status(200).json(books)
    )
    .catch((error) =>
      // Si une erreur se produit, renvoie une erreur avec un statut 404 (non trouvé).
      res.status(404).json({ error })
    )
}
// ADD BOOK
// Fonction pour créer un nouveau livre.
exports.createBook = (req, res, next) => {
  // Conversion de la chaîne JSON reçue dans le corps de la requête en objet JavaScript.
  const bookObject = JSON.parse(req.body.book)

  // Suppression des propriétés _id et _userId de l'objet pour éviter qu'elles soient modifiées.
  delete bookObject._id
  delete bookObject._userId

  // Création d'un nouvel objet Book basé sur les données reçues, en ajoutant l'utilisateur connecté.
  const book = new Book({
    ...bookObject, // Copie toutes les autres propriétés du bookObject.
    userId: req.auth.userId, // Ajoute l'identifiant de l'utilisateur à partir de l'authentification.
    imageUrl: `${req.protocol}://${req.get("host")}/images/resized_${
      req.file.filename
    }`, // Génère l'URL de l'image du livre.
    averageRating: bookObject.ratings[0].grade, // Définit la note moyenne initiale sur la base de la première note donnée.
  })

  // Sauvegarde du nouveau livre dans la base de données.
  book
    .save()
    .then(() =>
      // Si la sauvegarde est réussie, renvoie un message de succès avec un statut 201 (créé).
      res.status(201).json({ message: "Objet enregistré !" })
    )
    .catch((error) =>
      // Si une erreur se produit, renvoie une erreur avec un statut 400 (mauvaise requête).
      res.status(400).json({ error })
    )
}
// GET
// Fonction pour récupérer un livre spécifique en utilisant son identifiant (ID).
exports.getOneBook = (req, res, next) => {
  // Recherche d'un livre par son _id.
  Book.findOne({ _id: req.params.id })
    .then((book) =>
      // Si le livre est trouvé, le renvoie avec un statut 200 (OK).
      res.status(200).json(book)
    )
    .catch((error) =>
      // Si une erreur se produit, renvoie une erreur avec un statut 404 (non trouvé).
      res.status(404).json({ error })
    )
}

// PUT
// Fonction pour modifier un livre.
exports.modifyBook = (req, res, next) => {
  // Si un fichier image est fourni, crée un objet livre avec une nouvelle URL d'image.
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book), // Parse le JSON de la requête et copie ses propriétés.
        imageUrl: `${req.protocol}://${req.get("host")}/images/resized_${
          req.file.filename
        }`, // Met à jour l'URL de l'image.
      }
    : { ...req.body } // Sinon, utilise simplement le corps de la requête.

  // Suppression de l'_userId pour éviter qu'il soit modifié.
  delete bookObject._userId

  // Recherche du livre à modifier par son _id.
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // Vérifie si l'utilisateur est bien le propriétaire du livre.
      if (book.userId != req.auth.userId) {
        // Si non, renvoie une erreur 403 (non autorisé).
        res.status(403).json({ message: "403: unauthorized request" })
      } else {
        // Si l'utilisateur est autorisé, supprime l'ancienne image si un nouveau fichier est fourni.
        const filename = book.imageUrl.split("/images/")[1]
        req.file &&
          fs.unlink(`images/${filename}`, (err) => {
            if (err) console.log(err) // Log une erreur si la suppression échoue.
          })
        // Met à jour les informations du livre dans la base de données.
        Book.updateOne(
          { _id: req.params.id }, // Recherche par _id.
          { ...bookObject, _id: req.params.id } // Met à jour avec le nouvel objet.
        )
          .then(() =>
            // Renvoie un message de succès si la mise à jour est réussie.
            res.status(200).json({ message: "Objet modifié !" })
          )
          .catch((error) =>
            // Si une erreur se produit lors de la mise à jour, renvoie une erreur.
            res.status(400).json({ error })
          )
      }
    })
    .catch((error) =>
      // Si une erreur se produit lors de la recherche du livre, renvoie une erreur 404.
      res.status(404).json({ error })
    )
}
// DELETE
// Fonction pour supprimer un livre.
exports.deleteBook = (req, res, next) => {
  // Recherche du livre à supprimer par son _id.
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // Vérifie si l'utilisateur est bien le propriétaire du livre.
      if (book.userId != req.auth.userId) {
        // Si non, renvoie une erreur 403 (non autorisé).
        res.status(403).json({ message: "403: unauthorized request" })
      } else {
        // Si l'utilisateur est autorisé, supprime l'image associée au livre.
        const filename = book.imageUrl.split("/images/")[1]
        fs.unlink(`images/${filename}`, () => {
          // Supprime le livre de la base de données.
          Book.deleteOne({ _id: req.params.id })
            .then(() =>
              // Renvoie un message de succès si la suppression est réussie.
              res.status(200).json({ message: "Objet supprimé !" })
            )
            .catch((error) =>
              // Si une erreur se produit lors de la suppression, renvoie une erreur.
              res.status(400).json({ error })
            )
        })
      }
    })
    .catch((error) =>
      // Si une erreur se produit lors de la recherche du livre, renvoie une erreur 404.
      res.status(404).json({ error })
    )
}

// POST ( rating )
// Fonction pour ajouter une note à un livre.
exports.createRating = (req, res, next) => {
  // Vérifie que la note est entre 0 et 5.
  if (0 <= req.body.rating && req.body.rating <= 5) {
    // Crée un objet de note basé sur la requête, en utilisant "grade" pour la note.
    const ratingObject = { ...req.body, grade: req.body.rating }
    delete ratingObject._id // Supprime l'_id pour éviter toute modification.

    // Recherche du livre à noter par son _id.
    Book.findOne({ _id: req.params.id })
      .then((book) => {
        const newRatings = book.ratings // Copie les notes existantes.
        const userIdArray = newRatings.map((rating) => rating.userId) // Liste des utilisateurs ayant déjà noté.

        // Vérifie si l'utilisateur a déjà noté ce livre.
        if (userIdArray.includes(req.auth.userId)) {
          // Si oui, renvoie une erreur 403 (non autorisé).
          res.status(403).json({ message: "Not authorized" })
        } else {
          // Ajoute la nouvelle note et calcule la moyenne des notes.
          newRatings.push(ratingObject)
          const grades = newRatings.map((rating) => rating.grade) // Récupère toutes les notes.
          const averageGrades = average.average(grades) // Calcule la nouvelle note moyenne.

          // Met à jour les notes et la moyenne du livre dans la base de données.
          Book.updateOne(
            { _id: req.params.id },
            {
              ratings: newRatings,
              averageRating: averageGrades,
              _id: req.params.id,
            }
          )
            .then(() =>
              // Renvoie un statut 201 si l'ajout de la note est réussi.
              res.status(201).json()
            )
            .catch((error) =>
              // Si une erreur se produit lors de la mise à jour, renvoie une erreur.
              res.status(400).json({ error })
            )
          res.status(200).json(book) // Renvoie le livre mis à jour.
        }
      })
      .catch((error) =>
        // Si une erreur se produit lors de la recherche du livre, renvoie une erreur 404.
        res.status(404).json({ error })
      )
  } else {
    // Si la note n'est pas entre 1 et 5, renvoie un message d'erreur.
    res.status(400).json({ message: "La note doit être comprise entre 1 et 5" })
  }
}
// GET => Récupération des 3 livres les mieux notés
exports.getBestRating = (req, res, next) => {
  // Récupération de tous les livres
  // Puis tri par rapport aux moyennes dans l'ordre décroissant, limitation du tableau aux 3 premiers éléments
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }))
}
