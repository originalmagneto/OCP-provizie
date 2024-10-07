const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Import your existing server logic here
const { initializeDatabase, checkAndInitializeDefaultUsers } = require('../../server');

// Initialize the database
initializeDatabase();

// Set up your routes here (copy from server.js)
app.get('/api/get-invoices', (req, res) => {
  // Your existing logic for fetching invoices
});

app.post('/api/save-invoice', (req, res) => {
  // Your existing logic for saving invoices
});

app.put('/api/update-invoice/:id', (req, res) => {
  // Your existing logic for updating invoices
});

app.delete('/api/delete-invoice/:id', (req, res) => {
  // Your existing logic for deleting invoices
});

app.get('/api/get-client-names', (req, res) => {
  // Your existing logic for fetching client names
});

app.post('/api/login', (req, res) => {
  // Your existing logic for user authentication
});

app.post('/api/change-password', (req, res) => {
  // Your existing logic for changing passwords
});

module.exports.handler = serverless(app);
