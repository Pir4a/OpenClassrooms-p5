const jwt = require("jsonwebtoken")
require("dotenv").config()

// Middleware d'authentification
module.exports = (req, res, next) => {
  try {
    // Vérifie si le token est présent dans les en-têtes
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" })
    }

    const token = authHeader.split(" ")[1]
    const decodedToken = jwt.verify(token, process.env.RANDOM_TOKEN_SECRET)
    const userId = decodedToken.userId

    req.auth = {
      userId: userId,
    }
    next()
  } catch (error) {
    res.status(401).json({ error: "Requête non authentifiée" })
  }
}
