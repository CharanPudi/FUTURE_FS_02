const Lead = require('../models/Lead');

// GET /api/leads — Get all leads with optional filters
const getLeads = async (req, res) => {
  try {
    const { status, source, search } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/leads/:id
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/leads
const createLead = async (req, res) => {
  try {
    const { name, email, phone, source, status, followUpDate } = req.body;
    const lead = await Lead.create({ name, email, phone, source, status, followUpDate });
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/leads/:id
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/leads/:id
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/leads/:id/notes
const addNote = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    lead.notes.push({ text: req.body.text });
    await lead.save();
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/leads/:id/notes/:noteId
const deleteNote = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    lead.notes = lead.notes.filter(n => n._id.toString() !== req.params.noteId);
    await lead.save();
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getLeads, getLeadById, createLead, updateLead, deleteLead, addNote, deleteNote };