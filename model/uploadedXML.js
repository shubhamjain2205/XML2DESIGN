//uploadedXML.js

const mongoose = require('mongoose');

const xmlDataSchema = new mongoose.Schema({
  data: mongoose.Schema.Types.Mixed, // Store varying JSON data
});

const XmlData = mongoose.model('XmlData', xmlDataSchema);

module.exports = XmlData;
