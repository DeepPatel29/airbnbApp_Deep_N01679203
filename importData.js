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
const fs = require('fs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is required in .env file');
    process.exit(1);
}

const airbnbSchema = new mongoose.Schema({
    id: { type: String, index: true },
    NAME: String,
    host_id: String,
    host_identity_verified: String,
    host_name: String,
    neighbourhood_group: String,
    neighbourhood: String,
    lat: Number,
    long: Number,
    country: String,
    country_code: String,
    instant_bookable: String,
    cancellation_policy: String,
    room_type: String,
    Construction_year: Number,
    price: Number,
    service_fee: Number,
    minimum_nights: Number,
    number_of_reviews: Number,
    last_review: Date,
    reviews_per_month: Number,
    review_rate_number: Number,
    calculated_host_listings_count: Number,
    availability_365: Number,
    house_rules: String,
    license: String,
    property_type: String,
    thumbnail: String,
    images: [String]
}, {
    collection: 'listings',
    timestamps: true
});

const Listing = mongoose.model('Listing', airbnbSchema);

async function importData() {
    let connection;
    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        connection = await mongoose.connect(MONGODB_URI, {
            dbName: DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB Atlas!');
        console.log('📖 Reading JSON file...');

        const rawData = fs.readFileSync('./airbnb_with_photos.json', 'utf8');
        const listings = JSON.parse(rawData);
        console.log(`📊 Found ${listings.length} listings to process`);

        // Transform and clean data
        const transformedListings = listings.map(listing => {
            // Clean price fields (remove $ and commas, then convert to number)
            const cleanCurrency = (value) => {
                if (!value || value === '') return null;
                const cleaned = value.replace('$', '').replace(',', '').trim();
                return parseFloat(cleaned) || null;
            };

            // Clean numeric fields
            const cleanNumber = (value) => {
                if (!value || value === '') return null;
                return parseFloat(value) || null;
            };

            // Parse date
            const parseDate = (dateStr) => {
                if (!dateStr || dateStr === '') return null;
                return new Date(dateStr);
            };

            return {
                id: listing.id,
                NAME: listing.NAME || '',
                host_id: listing["host id"],
                host_identity_verified: listing.host_identity_verified || '',
                host_name: listing["host name"] || '',
                neighbourhood_group: listing["neighbourhood group"] || '',
                neighbourhood: listing.neighbourhood || '',
                lat: cleanNumber(listing.lat),
                long: cleanNumber(listing.long),
                country: listing.country || '',
                country_code: listing["country code"] || '',
                instant_bookable: listing.instant_bookable || '',
                cancellation_policy: listing.cancellation_policy || '',
                room_type: listing["room type"] || '',
                Construction_year: cleanNumber(listing["Construction year"]),
                price: cleanCurrency(listing.price),
                service_fee: cleanCurrency(listing["service fee"]),
                minimum_nights: cleanNumber(listing["minimum nights"]),
                number_of_reviews: cleanNumber(listing["number of reviews"]),
                last_review: parseDate(listing["last review"]),
                reviews_per_month: cleanNumber(listing["reviews per month"]),
                review_rate_number: cleanNumber(listing["review rate number"]),
                calculated_host_listings_count: cleanNumber(listing["calculated host listings count"]),
                availability_365: cleanNumber(listing["availability 365"]),
                house_rules: listing.house_rules || '',
                license: listing.license || '',
                property_type: listing.property_type || '',
                thumbnail: listing.thumbnail || '',
                images: listing.images || []
            };
        });

        console.log('🗑️  Clearing existing data...');
        await Listing.deleteMany({});

        console.log('📤 Importing data...');
        const batchSize = 100;
        let successfulImports = 0;
        let failedImports = 0;

        for (let i = 0; i < transformedListings.length; i += batchSize) {
            const batch = transformedListings.slice(i, i + batchSize);

            try {
                await Listing.insertMany(batch, { ordered: false });
                successfulImports += batch.length;
            } catch (batchError) {
                // If batch insert fails, try inserting individually
                for (const listing of batch) {
                    try {
                        await Listing.create(listing);
                        successfulImports++;
                    } catch (individualError) {
                        failedImports++;
                        console.log(`❌ Failed to import listing ${listing.id}:`, individualError.message);
                    }
                }
            }

            console.log(`🔄 Progress: ${successfulImports + failedImports}/${transformedListings.length}`);
        }

        console.log(`\n🎉 Import completed!`);
        console.log(`✅ Successful: ${successfulImports}`);
        console.log(`❌ Failed: ${failedImports}`);
        console.log(`📊 Total in database: ${await Listing.countDocuments()}`);

    } catch (error) {
        console.error('💥 Fatal error:', error);
    } finally {
        if (connection) {
            await mongoose.connection.close();
            console.log('🔒 Database connection closed.');
        }
        process.exit(0);
    }
}

importData();