//uploadedXML.js

const mongoose = require('mongoose');

const xmlDataSchema = new mongoose.Schema({
    fileName: String, // Add a field to store the name of the uploaded XML file
  data: mongoose.Schema.Types.Mixed, // Store varying JSON data
});

const XmlData = mongoose.model('XmlData', xmlDataSchema);

module.exports = XmlData;
