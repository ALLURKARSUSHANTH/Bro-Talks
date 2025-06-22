const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photoURL: { type: String ,default: ''},
  displayName: { type: String }, 
  connections:[{type: String,ref: 'User'}],
  connectionRequests: [{ type: String, ref: 'User' }],
});

module.exports = mongoose.model('User', UserSchema);