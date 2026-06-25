const mongoose = require('mongoose');

// Schema for individual notes on a lead
const NoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Lead name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true },
  phone: { type: String, trim: true, default: '' },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Social Media', 'Cold Call', 'Other'],
    default: 'Website'
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Converted', 'Lost'],
    default: 'New'
  },
  notes: [NoteSchema],      // Array of notes
  followUpDate: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);