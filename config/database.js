/**********************************************************************************
 * ITE5315 – Project
 * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 ** Group member Name: Janvi Patel & Rahul Jayswal Student IDs: N01579859 & N01579470 Date: 4/16/2024
 ***/
const mongoose = require("mongoose");
const Movie = require("../models/movies");
const User = require("../models/users");

async function initialize(connectionString) {
  try {
    await mongoose.connect(connectionString);
    console.log(
      "--------------------------------------------------------------------------------"
    );
    console.log("Connected to MongoDB");
    console.log(
      "--------------------------------------------------------------------------------"
    );
  } catch (error) {
    console.log(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    );
    console.error("Error connecting to MongoDB:", error);
    console.log(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    );
    throw error;
  }
}

async function addNewMovie(data) {
  try {
    return await Movie.create(data);
  } catch (error) {
    console.error("Error adding new movie:", error);
    throw error;
  }
}

async function getAllMovies(page, perPage, title) {
  try {
    const query = title ? { title: { $regex: title, $options: "i" } } : {};
    const totalCount = await Movie.countDocuments(query);
    const totalPages = Math.ceil(totalCount / perPage);
    const currentPage = Math.min(page, totalPages);
    const movies = await Movie.find(query)
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .sort({ _id: 1 });
    return movies;
  } catch (error) {
    console.error("Error getting all movies:", error);
    throw error;
  }
}

async function getMovieById(id) {
  try {
    return await Movie.findById(id);
  } catch (error) {
    console.error("Error getting movie by id:", error);
    throw error;
  }
}

async function updateMovieById(data, id) {
  try {
    return await Movie.findByIdAndUpdate(id, data, { new: true });
  } catch (error) {
    console.error("Error updating movie by id:", error);
    throw error;
  }
}

async function deleteMovieById(id) {
  try {
    await Movie.findByIdAndDelete(id);
    return { message: "Movie deleted" };
  } catch (error) {
    console.error("Error deleting movie by id:", error);
    throw error;
  }
}

async function addNewUser(data) {
  try {
    return await User.create(data);
  } catch (error) {
    console.error("Error signing up user:", error);
    throw error;
  }
}

async function userExists(username, email) {
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    return existingUser ? true : false;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    throw error;
  }
}

module.exports = {
  initialize,
  addNewMovie,
  getAllMovies,
  getMovieById,
  updateMovieById,
  deleteMovieById,
  addNewUser,
  userExists,
};
