//uploadedXML.js

const mongoose = require('mongoose');

const uploadedXMLSchema = new mongoose.Schema({
  filename: String, // Store the original filename
  xmlData: String, // Store the XML data as a string
});

module.exports = mongoose.model('UploadedXML', uploadedXMLSchema);
