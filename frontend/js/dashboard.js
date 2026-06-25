// dashboard.js — Main logic for the CRM dashboard
// This file handles: loading leads, adding/editing/deleting leads, notes

const API = 'http://localhost:5000/api';

// ---- Helper: Get the auth token from localStorage ----
const getToken = () => localStorage.getItem('crm_token');

// ---- Helper: Make authenticated API calls ----
const apiFetch = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
};

// ---- State ----
let allLeads = [];          // All leads fetched from backend
let currentLeadId = null;   // ID of lead being edited or viewed

// ============================================================
// INIT — Run when page loads
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // If not logged in, redirect to login
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  // Show the logged-in user's name
  const user = JSON.parse(localStorage.getItem('crm_user') || '{}');
  document.getElementById('user-name').textContent = user.name || '';

  // Load leads from backend
  fetchLeads();

  // Set up live search and filter
  document.getElementById('search-input').addEventListener('input', filterLeads);
  document.getElementById('filter-status').addEventListener('change', filterLeads);
  document.getElementById('filter-source').addEventListener('change', filterLeads);

  // Set up lead form submission (add or edit)
  document.getElementById('lead-form').addEventListener('submit', saveLead);
});

// ============================================================
// FETCH & DISPLAY LEADS
// ============================================================
const fetchLeads = async () => {
  try {
    allLeads = await apiFetch('/leads');
    renderLeads(allLeads);
    updateStats(allLeads);
  } catch (err) {
    alert('Error loading leads: ' + err.message);
  }
};

// Renders the leads array into the HTML table
const renderLeads = (leads) => {
  const tbody = document.getElementById('leads-tbody');
  const empty = document.getElementById('empty-state');

  if (leads.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  tbody.innerHTML = leads.map(lead => `
    <tr>
      <td><strong>${escHtml(lead.name)}</strong></td>
      <td>${escHtml(lead.email)}</td>
      <td>${escHtml(lead.phone || '—')}</td>
      <td>${escHtml(lead.source)}</td>
      <td><span class="badge badge-${lead.status.toLowerCase()}">${lead.status}</span></td>
      <td>${lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '—'}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="View Notes" onclick="openNotesModal('${lead._id}')">📝 Notes</button>
          <button class="btn-icon" title="Edit" onclick="openEditModal('${lead._id}')">✏️ Edit</button>
          <button class="btn-icon danger" title="Delete" onclick="deleteLead('${lead._id}')">🗑️ Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
};

// Updates the top stat cards
const updateStats = (leads) => {
  document.getElementById('stat-total').textContent = leads.length;
  document.getElementById('stat-new').textContent = leads.filter(l => l.status === 'New').length;
  document.getElementById('stat-contacted').textContent = leads.filter(l => l.status === 'Contacted').length;
  document.getElementById('stat-converted').textContent = leads.filter(l => l.status === 'Converted').length;
};

// Filters leads locally based on search + dropdowns
const filterLeads = () => {
  const search = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('filter-status').value;
  const source = document.getElementById('filter-source').value;

  const filtered = allLeads.filter(lead => {
    const matchSearch = !search ||
      lead.name.toLowerCase().includes(search) ||
      lead.email.toLowerCase().includes(search);
    const matchStatus = !status || lead.status === status;
    const matchSource = !source || lead.source === source;
    return matchSearch && matchStatus && matchSource;
  });

  renderLeads(filtered);
};

// ============================================================
// ADD LEAD MODAL
// ============================================================
const openAddModal = () => {
  currentLeadId = null;
  document.getElementById('modal-title').textContent = 'Add New Lead';
  document.getElementById('save-lead-btn').textContent = 'Save Lead';
  document.getElementById('lead-form').reset();
  showModal('lead-modal');
};

// ============================================================
// EDIT LEAD MODAL
// ============================================================
const openEditModal = (id) => {
  const lead = allLeads.find(l => l._id === id);
  if (!lead) return;

  currentLeadId = id;
  document.getElementById('modal-title').textContent = 'Edit Lead';
  document.getElementById('save-lead-btn').textContent = 'Update Lead';

  // Fill the form with existing lead data
  document.getElementById('lead-name').value    = lead.name;
  document.getElementById('lead-email').value   = lead.email;
  document.getElementById('lead-phone').value   = lead.phone || '';
  document.getElementById('lead-source').value  = lead.source;
  document.getElementById('lead-status').value  = lead.status;
  document.getElementById('lead-followup').value = lead.followUpDate
    ? lead.followUpDate.substring(0, 10) : '';

  showModal('lead-modal');
};

// ============================================================
// SAVE LEAD (handles both Add and Edit)
// ============================================================
const saveLead = async (e) => {
  e.preventDefault();

  const leadData = {
    name:        document.getElementById('lead-name').value,
    email:       document.getElementById('lead-email').value,
    phone:       document.getElementById('lead-phone').value,
    source:      document.getElementById('lead-source').value,
    status:      document.getElementById('lead-status').value,
    followUpDate: document.getElementById('lead-followup').value || null
  };

  try {
    if (currentLeadId) {
      // UPDATE existing lead
      await apiFetch(`/leads/${currentLeadId}`, {
        method: 'PUT',
        body: JSON.stringify(leadData)
      });
    } else {
      // CREATE new lead
      await apiFetch('/leads', {
        method: 'POST',
        body: JSON.stringify(leadData)
      });
    }
    closeModal();
    fetchLeads(); // Refresh the table
  } catch (err) {
    alert('Error saving lead: ' + err.message);
  }
};

// ============================================================
// DELETE LEAD
// ============================================================
const deleteLead = async (id) => {
  if (!confirm('Are you sure you want to delete this lead? This cannot be undone.')) return;

  try {
    await apiFetch(`/leads/${id}`, { method: 'DELETE' });
    fetchLeads(); // Refresh after delete
  } catch (err) {
    alert('Error deleting lead: ' + err.message);
  }
};

// ============================================================
// NOTES MODAL
// ============================================================
const openNotesModal = async (id) => {
  currentLeadId = id;
  const lead = allLeads.find(l => l._id === id);
  if (!lead) return;

  document.getElementById('notes-modal-title').textContent = `Notes — ${lead.name}`;

  // Show lead details
  document.getElementById('lead-detail-card').innerHTML = `
    <div class="detail-item"><strong>Email</strong>${escHtml(lead.email)}</div>
    <div class="detail-item"><strong>Phone</strong>${escHtml(lead.phone || '—')}</div>
    <div class="detail-item"><strong>Source</strong>${escHtml(lead.source)}</div>
    <div class="detail-item"><strong>Status</strong><span class="badge badge-${lead.status.toLowerCase()}">${lead.status}</span></div>
    <div class="detail-item"><strong>Follow-up</strong>${lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '—'}</div>
    <div class="detail-item"><strong>Added</strong>${new Date(lead.createdAt).toLocaleDateString()}</div>
  `;

  renderNotes(lead.notes);
  document.getElementById('new-note-text').value = '';
  showModal('notes-modal');
};

const renderNotes = (notes) => {
  const list = document.getElementById('notes-list');
  if (!notes || notes.length === 0) {
    list.innerHTML = '<p style="color:#9ca3af;font-size:0.9rem">No notes yet. Add one below!</p>';
    return;
  }
  list.innerHTML = notes.map(note => `
    <div class="note-item">
      <div class="note-text">
        <div>${escHtml(note.text)}</div>
        <div class="note-date">${new Date(note.createdAt).toLocaleString()}</div>
      </div>
      <button class="note-delete" title="Delete note" onclick="deleteNote('${note._id}')">✕</button>
    </div>
  `).join('');
};

const submitNote = async () => {
  const text = document.getElementById('new-note-text').value.trim();
  if (!text) return alert('Please write something before adding a note.');

  try {
    const updatedLead = await apiFetch(`/leads/${currentLeadId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    // Update our local data
    const idx = allLeads.findIndex(l => l._id === currentLeadId);
    if (idx !== -1) allLeads[idx] = updatedLead;

    renderNotes(updatedLead.notes);
    document.getElementById('new-note-text').value = '';
  } catch (err) {
    alert('Error adding note: ' + err.message);
  }
};

const deleteNote = async (noteId) => {
  if (!confirm('Delete this note?')) return;

  try {
    const updatedLead = await apiFetch(`/leads/${currentLeadId}/notes/${noteId}`, {
      method: 'DELETE'
    });
    const idx = allLeads.findIndex(l => l._id === currentLeadId);
    if (idx !== -1) allLeads[idx] = updatedLead;
    renderNotes(updatedLead.notes);
  } catch (err) {
    alert('Error deleting note: ' + err.message);
  }
};

const closeNotesModal = () => hideModal('notes-modal');

// ============================================================
// MODAL HELPERS
// ============================================================
const showModal = (id) => {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
};

const hideModal = (id) => {
  document.getElementById(id).classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
};

const closeModal = () => hideModal('lead-modal');

const closeAllModals = () => {
  hideModal('lead-modal');
  hideModal('notes-modal');
};

// ============================================================
// LOGOUT
// ============================================================
const logout = () => {
  localStorage.removeItem('crm_token');
  localStorage.removeItem('crm_user');
  window.location.href = 'login.html';
};

// ============================================================
// UTILITY: Escape HTML to prevent XSS attacks
// ============================================================
const escHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
