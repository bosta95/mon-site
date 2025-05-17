const fs = require('fs');
const path = require('path');
const express = require('express');
const xss = require('xss');
const { v4: uuidv4 } = require('uuid');

const reviewsRouter = express.Router();
const dataFilePath = path.join(__dirname, 'reviews-data.json');

// Fonction pour charger les données d'avis
function loadReviewsData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    }
    return { approvedReviews: [], pendingReviews: [] };
  } catch (error) {
    console.error('Erreur lors du chargement des avis:', error);
    return { approvedReviews: [], pendingReviews: [] };
  }
}

// Fonction pour sauvegarder les données d'avis
function saveReviewsData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des avis:', error);
    return false;
  }
}

// Fonction pour nettoyer les entrées utilisateur
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return xss(input.trim());
}

// Obtenir tous les avis approuvés (public)
reviewsRouter.get('/api/reviews', (req, res) => {
  const reviewsData = loadReviewsData();
  res.json({ reviews: reviewsData.approvedReviews });
});

// Obtenir les avis approuvés par produit (public)
reviewsRouter.get('/api/reviews/:productId', (req, res) => {
  const productId = req.params.productId;
  const reviewsData = loadReviewsData();
  
  const filteredReviews = reviewsData.approvedReviews.filter(
    review => review.product === productId
  );
  
  res.json({ reviews: filteredReviews });
});

// Soumettre un nouvel avis (public)
reviewsRouter.post('/api/reviews/submit', (req, res) => {
  // Validation et sanitization des entrées
  const name = sanitizeInput(req.body.name);
  const comment = sanitizeInput(req.body.comment);
  const product = sanitizeInput(req.body.product);
  
  // Validation du rating
  let rating = parseInt(req.body.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    rating = 5; // Valeur par défaut
  }
  
  // Validation simple
  if (!name || !comment || !product) {
    return res.status(400).json({ 
      error: 'Tous les champs sont obligatoires' 
    });
  }
  
  // Création de l'avis
  const newReview = {
    id: uuidv4(),
    name,
    rating,
    date: new Date().toISOString().split('T')[0],
    comment,
    product,
    approved: false
  };
  
  // Chargement des données
  const reviewsData = loadReviewsData();
  
  // Ajout du nouvel avis aux avis en attente
  reviewsData.pendingReviews.push(newReview);
  
  // Sauvegarde des données
  if (saveReviewsData(reviewsData)) {
    res.status(201).json({ 
      message: 'Avis soumis avec succès et en attente de modération',
      reviewId: newReview.id
    });
  } else {
    res.status(500).json({ 
      error: 'Erreur lors de l\'enregistrement de l\'avis' 
    });
  }
});

// Routes d'administration (protégées)
// Middleware d'authentification admin
function adminAuthMiddleware(req, res, next) {
  const adminToken = req.headers['x-admin-token'];
  
  // Vérification du token (à remplacer par votre logique)
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  
  next();
}

// Obtenir tous les avis en attente (admin)
reviewsRouter.get('/api/admin/pending-reviews', adminAuthMiddleware, (req, res) => {
  const reviewsData = loadReviewsData();
  res.json({ pendingReviews: reviewsData.pendingReviews });
});

// Approuver un avis (admin)
reviewsRouter.post('/api/admin/approve-review/:reviewId', adminAuthMiddleware, (req, res) => {
  const reviewId = req.params.reviewId;
  const reviewsData = loadReviewsData();
  
  // Recherche de l'avis dans les avis en attente
  const reviewIndex = reviewsData.pendingReviews.findIndex(review => review.id === reviewId);
  
  if (reviewIndex === -1) {
    return res.status(404).json({ error: 'Avis non trouvé' });
  }
  
  // Extraction de l'avis à approuver
  const reviewToApprove = reviewsData.pendingReviews[reviewIndex];
  reviewToApprove.approved = true;
  
  // Retrait de l'avis des avis en attente
  reviewsData.pendingReviews.splice(reviewIndex, 1);
  
  // Ajout de l'avis aux avis approuvés
  reviewsData.approvedReviews.push(reviewToApprove);
  
  // Sauvegarde des données
  if (saveReviewsData(reviewsData)) {
    res.json({ 
      message: 'Avis approuvé avec succès',
      review: reviewToApprove
    });
  } else {
    res.status(500).json({ 
      error: 'Erreur lors de l\'approbation de l\'avis' 
    });
  }
});

// Rejeter un avis (admin)
reviewsRouter.delete('/api/admin/reject-review/:reviewId', adminAuthMiddleware, (req, res) => {
  const reviewId = req.params.reviewId;
  const reviewsData = loadReviewsData();
  
  // Recherche de l'avis dans les avis en attente
  const reviewIndex = reviewsData.pendingReviews.findIndex(review => review.id === reviewId);
  
  if (reviewIndex === -1) {
    return res.status(404).json({ error: 'Avis non trouvé' });
  }
  
  // Retrait de l'avis des avis en attente
  reviewsData.pendingReviews.splice(reviewIndex, 1);
  
  // Sauvegarde des données
  if (saveReviewsData(reviewsData)) {
    res.json({ message: 'Avis rejeté avec succès' });
  } else {
    res.status(500).json({ 
      error: 'Erreur lors du rejet de l\'avis' 
    });
  }
});

// Supprimer un avis approuvé (admin)
reviewsRouter.delete('/api/admin/delete-approved-review/:reviewId', adminAuthMiddleware, (req, res) => {
  const reviewId = req.params.reviewId;
  const reviewsData = loadReviewsData();
  
  // Recherche de l'avis dans les avis approuvés
  const reviewIndex = reviewsData.approvedReviews.findIndex(review => review.id === reviewId);
  
  if (reviewIndex === -1) {
    return res.status(404).json({ error: 'Avis non trouvé' });
  }
  
  // Retrait de l'avis des avis approuvés
  reviewsData.approvedReviews.splice(reviewIndex, 1);
  
  // Sauvegarde des données
  if (saveReviewsData(reviewsData)) {
    res.json({ message: 'Avis supprimé avec succès' });
  } else {
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de l\'avis' 
    });
  }
});

module.exports = reviewsRouter; 