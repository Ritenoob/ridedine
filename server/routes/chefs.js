const express = require('express');
const router = express.Router();
const demoData = require('../services/demoData');

// Get all chefs
router.get('/', (req, res) => {
  try {
    const chefs = demoData.getChefs();
    res.json(chefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chef by slug
router.get('/slug/:slug', (req, res) => {
  try {
    const chef = demoData.getChefBySlug(req.params.slug);
    
    if (!chef) {
      return res.status(404).json({ error: 'Chef not found' });
    }
    
    res.json(chef);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chef by ID
router.get('/:chefId', (req, res) => {
  try {
    const chef = demoData.getChefById(req.params.chefId);
    
    if (!chef) {
      return res.status(404).json({ error: 'Chef not found' });
    }
    
    res.json(chef);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
