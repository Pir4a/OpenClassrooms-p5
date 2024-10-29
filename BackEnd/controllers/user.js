const bcrypt = require("bcrypt")
const User = require("../models/User")
const jwt = require("jsonwebtoken")
require("dotenv").config()

exports.signup = async (req, res, next) => {
  try {
    // Hash du mot de passe
    const hash = await bcrypt.hash(req.body.password, 10)

    // Création de l'utilisateur
    const user = new User({
      email: req.body.email,
      password: hash,
    })

    // Enregistrement de l'utilisateur
    await user.save()
    res.status(201).json({ message: "Utilisateur créé !" })
  } catch (error) {
    if (error.code === 11000) {
      // Erreur si l'email est déjà utilisé
      return res.status(400).json({ error: "Email déjà utilisé !" })
    }
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'utilisateur." })
  }
}

exports.login = async (req, res, next) => {
  try {
    // Recherche de l'utilisateur par email
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé !" })
    }

    // Comparaison des mots de passe
    const valid = await bcrypt.compare(req.body.password, user.password)

    if (!valid) {
      return res.status(401).json({ error: "Mot de passe incorrect !" })
    }

    // Création du token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.RANDOM_TOKEN_SECRET,
      { expiresIn: "24h" }
    )

    res.status(200).json({
      userId: user._id,
      token,
    })
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la connexion." })
  }
}
