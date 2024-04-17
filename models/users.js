/********************************************************************************** 
 * ITE5315 – Project
 * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 ** Group member Name: Janvi Patel & Rahul Jayswal Student IDs: N01579859 & N01579470 Date: 4/16/2024
 ***/
const mongoose = require('mongoose');

// Define the User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Create the User Model
const User = mongoose.model('User', userSchema);

module.exports = User;
