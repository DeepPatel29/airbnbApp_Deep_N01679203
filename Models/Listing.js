/*********************************************************************************
* ITE5315 – Assignment 4
* I declare that this assignment is my own work in accordance with Humber Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Name: Deep Patel 
* Student ID: N01679203 
* Date: 2025-11-20
********************************************************************************/
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    NAME: { type: String, default: '' },
    "host id": { type: String, required: true },
    host_identity_verified: { type: String, default: '' },
    "host name": { type: String, required: true },
    "neighbourhood group": { type: String, required: true },
    neighbourhood: { type: String, required: true },
    lat: { type: String, default: '' },
    long: { type: String, default: '' },
    country: { type: String, default: 'United States' },
    "country code": { type: String, default: 'US' },
    instant_bookable: { type: String, default: 'FALSE' },
    cancellation_policy: { type: String, default: 'moderate' },
    "room type": { type: String, required: true },
    "Construction year": { type: String, default: '2020' },
    price: { type: String, required: true },
    "service fee": { type: String, default: '$0' },
    "minimum nights": { type: String, default: '1' },
    "number of reviews": { type: String, default: '0' },
    "last review": { type: String, default: '' },
    "reviews per month": { type: String, default: '' },
    "review rate number": { type: String, default: '0' },
    "calculated host listings count": { type: String, default: '1' },
    "availability 365": { type: String, default: '365' },
    house_rules: { type: String, default: '' },
    license: { type: String, default: '' },
    property_type: { type: String, default: 'apartment' },
    thumbnail: { type: String, required: true },
    images: [{ type: String }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Listing', listingSchema);