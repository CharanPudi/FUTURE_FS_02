const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getLeads, getLeadById, createLead, updateLead, deleteLead, addNote, deleteNote } = require('../controllers/leadController');

router.get('/', protect, getLeads);
router.post('/', protect, createLead);
router.get('/:id', protect, getLeadById);
router.put('/:id', protect, updateLead);
router.delete('/:id', protect, deleteLead);
router.post('/:id/notes', protect, addNote);
router.delete('/:id/notes/:noteId', protect, deleteNote);

module.exports = router;