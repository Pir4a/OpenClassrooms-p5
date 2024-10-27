const bcrypt = require("bcrypt")
const User = require("../models/User")
const jwt = require("jsonwebtoken")
require("dotenv").config()

exports.signup = (req, res, next) => {
  // Utilisation de bcrypt pour hasher (chiffrer) le mot de passe de l'utilisateur.
  bcrypt
    .hash(req.body.password, 10) // Le '10' ici représente le nombre de "salt rounds", une mesure de sécurité.
    .then((hash) => {
      // Création d'un nouvel objet User avec l'adresse email et le mot de passe hashé.
      const user = new User({
        email: req.body.email, // L'email est récupéré directement depuis la requête.
        password: hash, // Le mot de passe est remplacé par sa version chiffrée.
      })

      // Enregistrement du nouvel utilisateur dans la base de données.
      user
        .save() // Sauvegarde dans la base de données.
        .then(() =>
          // Si l'enregistrement est réussi, renvoie un statut 201 (créé) avec un message de confirmation.
          res.status(201).json({ message: "Utilisateur créé !" })
        )
        .catch((error) =>
          // Si une erreur survient lors de l'enregistrement, renvoie une erreur 400 (mauvaise requête).
          res.status(400).json({ error })
        )
    })
    .catch((error) =>
      // Si une erreur survient lors du chiffrement du mot de passe, renvoie une erreur 500 (erreur serveur).
      res.status(500).json({ error })
    )
}
exports.login = (req, res, next) => {
  // Recherche de l'utilisateur dans la base de données par son email.
  User.findOne({ email: req.body.email })
    .then((user) => {
      // Si l'utilisateur n'est pas trouvé, renvoie une erreur 401 (non autorisé).
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé !" })
      }

      // Si l'utilisateur est trouvé, compare le mot de passe entré avec celui dans la base de données.
      bcrypt
        .compare(req.body.password, user.password) // Compare le mot de passe en clair avec le mot de passe hashé.
        .then((valid) => {
          // Si la comparaison échoue (mot de passe incorrect), renvoie une erreur 401.
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect !" })
          }

          // Si la comparaison est réussie (mot de passe correct), renvoie un token d'authentification.
          res.status(200).json({
            userId: user._id, // Renvoie l'identifiant utilisateur pour l'authentification future.
            token: jwt.sign(
              // Création d'un token JWT avec l'ID utilisateur et une clé secrète.
              { userId: user._id }, // Payload du token : inclut l'identifiant utilisateur.
              "RANDOM_TOKEN_SECRET", // Clé secrète utilisée pour signer le token.
              { expiresIn: "24h" } // Durée de validité du token (24 heures).
            ),
          })
        })
        .catch((error) =>
          // En cas d'erreur lors de la comparaison des mots de passe, renvoie une erreur 500 (erreur serveur).
          res.status(500).json({ error })
        )
    })
    .catch((error) =>
      // En cas d'erreur lors de la recherche de l'utilisateur, renvoie une erreur 500 (erreur serveur).
      res.status(500).json({ error })
    )
}
