const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    NAME: { type: String, default: '' },
    "host id": { type: String, required: true }, // Note the quotes for field names with spaces
    host_identity_verified: { type: String, default: '' },
    "host name": { type: String, required: true }, // Note the quotes for field names with spaces
    "neighbourhood group": { type: String, required: true }, // Note the quotes
    neighbourhood: { type: String, required: true },
    lat: { type: String, default: '' },
    long: { type: String, default: '' },
    country: { type: String, default: 'United States' },
    "country code": { type: String, default: 'US' }, // Note the quotes
    instant_bookable: { type: String, default: 'FALSE' },
    cancellation_policy: { type: String, default: 'moderate' },
    "room type": { type: String, required: true }, // Note the quotes
    "Construction year": { type: String, default: '2020' }, // Note the quotes
    price: { type: String, required: true },
    "service fee": { type: String, default: '$0' }, // Note the quotes
    "minimum nights": { type: String, default: '1' }, // Note the quotes
    "number of reviews": { type: String, default: '0' }, // Note the quotes
    "last review": { type: String, default: '' }, // Note the quotes
    "reviews per month": { type: String, default: '' }, // Note the quotes
    "review rate number": { type: String, default: '0' }, // Note the quotes
    "calculated host listings count": { type: String, default: '1' }, // Note the quotes
    "availability 365": { type: String, default: '365' }, // Note the quotes
    house_rules: { type: String, default: '' },
    license: { type: String, default: '' },
    property_type: { type: String, default: 'apartment' },
    thumbnail: { type: String, required: true },
    images: [{ type: String }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Listing', listingSchema);