
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// Set up Handlebars as the view engine
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        eq: function (a, b) { return a === b; },
        gt: function (a, b) { return a > b; },
        lt: function (a, b) { return a < b; },
        formatPrice: function (price) {
            if (!price) return '0';
            return price.toString().replace('$', '').trim();
        },
        defaultNA: function (value) {
            return value || 'N/A';
        },
        getProperty: function (obj, property) {
            return obj ? obj[property] : 'N/A';
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,     // This line fixes it
        allowProtoMethodsByDefault: true         // Optional, but safe here
    }
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const Listing = require('./Models/Listing');

// ==================== WEB ROUTES ====================
// Home page
app.get('/', (req, res) => {
    res.render('index', {
        title: 'QuickRentals',
        message: 'Welcome to QuickRentals'
    });
});

// List all listings
app.get('/listings', async (req, res) => {
    try {
        const listings = await Listing.find().limit(100);
        const transformedListings = listings.map(listing => {
            return {
                ...listing._doc,
                "host name": listing.host_name,
                "neighbourhood group": listing.neighbourhood_group,
                "room type": listing.room_type,
                "service fee": listing.service_fee,
                "minimum nights": listing.minimum_nights,
                "number of reviews": listing.number_of_reviews,
                "review rate number": listing.review_rate_number,
                "availability 365": listing.availability_365
            };
        });

        res.render('allListings', {
            title: 'All AirBnB Listings',
            listings: transformedListings
        });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to fetch listings: ' + error.message
        });
    }
});

// View a specific listing
app.get('/listing/:id', async (req, res) => {
    try {
        const listing = await Listing.findOne({ id: req.params.id });
        if (!listing) {
            return res.render('error', {
                title: 'Error',
                message: 'Listing not found'
            });
        }

        const transformedListing = {
            ...listing._doc,
            "host name": listing.host_name,
            "neighbourhood group": listing.neighbourhood_group,
            "room type": listing.room_type,
            "service fee": listing.service_fee,
            "minimum nights": listing.minimum_nights,
            "number of reviews": listing.number_of_reviews,
            "review rate number": listing.review_rate_number,
            "availability 365": listing.availability_365
        };

        res.render('listing', {
            title: `Listing ${listing.id}`,
            listing: transformedListing
        });
    } catch (error) {
        console.error('Error fetching listing:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to fetch listing: ' + error.message
        });
    }
});

// // Search for listings
// app.get('/search', (req, res) => {
//     res.render('search', {
//         title: 'Search Listing'
//     });
// });

// // Handle search form submission
// app.post('/search', async (req, res) => {
//     try {
//         const { searchType, searchValue, minPrice, maxPrice } = req.body;

//         if (!searchType) {
//             return res.render('error', {
//                 title: 'Error',
//                 message: 'Please select a search type'
//             });
//         }

//         let listings = [];
//         let searchDescription = '';

//         if (searchType === 'price_range') {
//             if (!minPrice && !maxPrice) {
//                 return res.render('error', {
//                     title: 'Error',
//                     message: 'Please provide at least one price value (min or max)'
//                 });
//             }

//             const allListings = await Listing.find({}).limit(200);
//             listings = allListings.filter(listing => {
//                 let listingPrice = 0;
//                 if (listing.price) {
//                     const priceStr = listing.price.toString().replace('$', '').replace(',', '').trim();
//                     listingPrice = parseFloat(priceStr) || 0;
//                 }

//                 if (minPrice && listingPrice < parseFloat(minPrice)) return false;
//                 if (maxPrice && listingPrice > parseFloat(maxPrice)) return false;
//                 return true;
//             });

//             searchDescription = `Price Range: $${minPrice || '0'} - $${maxPrice || 'Any'}`;

//         } else {
//             if (!searchValue || searchValue.trim() === '') {
//                 return res.render('error', {
//                     title: 'Error',
//                     message: 'Please enter a search value'
//                 });
//             }

//             let query = {};
//             const searchTerm = searchValue.trim();

//             switch (searchType) {
//                 case 'id':
//                     query.id = searchTerm;
//                     searchDescription = `ID: ${searchTerm}`;
//                     break;
//                 case 'name':
//                     query.NAME = { $regex: searchTerm, $options: 'i' };
//                     searchDescription = `Name: ${searchTerm}`;
//                     break;
//                 case 'neighbourhood':
//                     query.neighbourhood = { $regex: searchTerm, $options: 'i' };
//                     searchDescription = `Neighbourhood: ${searchTerm}`;
//                     break;
//                 case 'host_name':
//                     query.host_name = { $regex: searchTerm, $options: 'i' };
//                     searchDescription = `Host Name: ${searchTerm}`;
//                     break;
//                 case 'room_type':
//                     query.room_type = { $regex: searchTerm, $options: 'i' };
//                     searchDescription = `Room Type: ${searchTerm}`;
//                     break;
//                 default:
//                     return res.render('error', {
//                         title: 'Error',
//                         message: 'Invalid search type'
//                     });
//             }

//             listings = await Listing.find(query).limit(50);
//         }

//         if (!listings || listings.length === 0) {
//             return res.render('error', {
//                 title: 'No Results Found',
//                 message: `No listings found for ${searchDescription}`
//             });
//         }

//         const transformedListings = listings.map(listing => ({
//             ...listing._doc,
//             "host name": listing.host_name,
//             "neighbourhood group": listing.neighbourhood_group,
//             "room type": listing.room_type,
//             "service fee": listing.service_fee,
//             "minimum nights": listing.minimum_nights,
//             "number of reviews": listing.number_of_reviews,
//             "review rate number": listing.review_rate_number,
//             "availability 365": listing.availability_365
//         }));

//         res.render('searchResults', {
//             title: 'Search Results',
//             listings: transformedListings,
//             searchDescription: searchDescription,
//             resultsCount: listings.length
//         });

//     } catch (error) {
//         console.error('Search error:', error);
//         res.render('error', {
//             title: 'Search Error',
//             message: 'Failed to perform search: ' + error.message
//         });
//     }
// });

// Search listing by ID
// Enhanced search listing by multiple criteria
app.post('/search/listing', async (req, res) => {
    try {
        const { searchType, searchValue, minPrice, maxPrice } = req.body;
        console.log('Search request:', { searchType, searchValue, minPrice, maxPrice });

        if (!searchType) {
            return res.render('error', {
                title: 'Error',
                message: 'Please select a search type'
            });
        }

        let listings = [];
        let searchDescription = '';

        // Handle different search types
        if (searchType === 'price_range') {
            // Price range search
            if (!minPrice && !maxPrice) {
                return res.render('error', {
                    title: 'Error',
                    message: 'Please provide at least one price value (min or max)'
                });
            }

            const allListings = await Listing.find({}).limit(200);
            listings = allListings.filter(listing => {
                let listingPrice = 0;
                if (listing.price) {
                    // Clean the price string and convert to number
                    const priceStr = listing.price.toString().replace('$', '').replace(',', '').trim();
                    listingPrice = parseFloat(priceStr) || 0;
                }

                if (minPrice && listingPrice < parseFloat(minPrice)) return false;
                if (maxPrice && listingPrice > parseFloat(maxPrice)) return false;
                return true;
            });

            searchDescription = `Price Range: $${minPrice || '0'} - $${maxPrice || 'Any'}`;

        } else {
            // Text-based searches
            if (!searchValue || searchValue.trim() === '') {
                return res.render('error', {
                    title: 'Error',
                    message: 'Please enter a search value'
                });
            }

            let query = {};
            const searchTerm = searchValue.trim();

            switch (searchType) {
                case 'id':
                    query.id = searchTerm;
                    searchDescription = `ID: ${searchTerm}`;
                    break;
                case 'name':
                    query.NAME = { $regex: searchTerm, $options: 'i' };
                    searchDescription = `Name: ${searchTerm}`;
                    break;
                case 'neighbourhood':
                    query.neighbourhood = { $regex: searchTerm, $options: 'i' };
                    searchDescription = `Neighbourhood: ${searchTerm}`;
                    break;
                case 'host_name':
                    query.host_name = { $regex: searchTerm, $options: 'i' };
                    searchDescription = `Host Name: ${searchTerm}`;
                    break;
                case 'room_type':
                    query.room_type = { $regex: searchTerm, $options: 'i' };
                    searchDescription = `Room Type: ${searchTerm}`;
                    break;
                default:
                    return res.render('error', {
                        title: 'Error',
                        message: 'Invalid search type'
                    });
            }

            listings = await Listing.find(query).limit(50);
            console.log(`Found ${listings.length} listings for query:`, query);
        }

        if (!listings || listings.length === 0) {
            return res.render('error', {
                title: 'No Results Found',
                message: `No listings found for ${searchDescription}`
            });
        }

        // Transform the data
        const transformedListings = listings.map(listing => ({
            ...listing._doc,
            "host name": listing.host_name,
            "neighbourhood group": listing.neighbourhood_group,
            "room type": listing.room_type,
            "service fee": listing.service_fee,
            "minimum nights": listing.minimum_nights,
            "number of reviews": listing.number_of_reviews,
            "review rate number": listing.review_rate_number,
            "availability 365": listing.availability_365
        }));

        res.render('searchResults', {
            title: 'Search Results',
            listings: transformedListings,
            searchDescription: searchDescription,
            resultsCount: listings.length
        });

    } catch (error) {
        console.error('Search error:', error);
        res.render('error', {
            title: 'Search Error',
            message: 'Failed to perform search: ' + error.message
        });
    }
});

// Search listing form - GET
app.get('/search', (req, res) => {
    res.render('search', {
        title: 'Search Listing'
    });
});

// Handle search form submission - POST
app.post('/search', async (req, res) => {
    try {
        const { searchType, searchValue, minPrice, maxPrice } = req.body;
        console.log('Search request received:', { searchType, searchValue, minPrice, maxPrice });

        if (!searchType) {
            return res.render('error', {
                title: 'Error',
                message: 'Please select a search type'
            });
        }

        let listings = [];
        let searchDescription = '';

        // Handle different search types
        if (searchType === 'price_range') {
            // Price range search
            if (!minPrice && !maxPrice) {
                return res.render('error', {
                    title: 'Error',
                    message: 'Please provide at least one price value (min or max)'
                });
            }

            const allListings = await Listing.find({}).limit(200);
            listings = allListings.filter(listing => {
                let listingPrice = 0;
                if (listing.price) {
                    const priceStr = listing.price.toString().replace('$', '').replace(',', '').trim();
                    listingPrice = parseFloat(priceStr) || 0;
                }

                if (minPrice && listingPrice < parseFloat(minPrice)) return false;
                if (maxPrice && listingPrice > parseFloat(maxPrice)) return false;
                return true;
            });

            searchDescription = `Price Range: $${minPrice || '0'} - $${maxPrice || 'Any'}`;

        } else {
            // Text-based searches
            if (!searchValue || searchValue.trim() === '') {
                return res.render('error', {
                    title: 'Error',
                    message: 'Please enter a search value'
                });
            }

            let query = {};
            const searchTerm = searchValue.trim();

            switch (searchType) {
                case 'id':
                    query.id = searchTerm;
                    searchDescription = `ID: ${searchTerm}`;
                    break;
                case 'name':
                    query.NAME = { $regex: searchTerm, $options: 'i' };
                    searchDescription = `Name: ${searchTerm}`;
                    break;
                case 'neighbourhood':
                    query.neighbourhood = { $regex: searchTerm, $options: 'i' };
                    searchDescription = `Neighbourhood: ${searchTerm}`;
                    break;
                case 'host_name':
                    query.host_name = { $regex: searchTerm, $options: 'i' };
                    searchDescription = `Host Name: ${searchTerm}`;
                    break;
                case 'room_type':
                    query.room_type = { $regex: searchTerm, $options: 'i' };
                    searchDescription = `Room Type: ${searchTerm}`;
                    break;
                default:
                    return res.render('error', {
                        title: 'Error',
                        message: 'Invalid search type'
                    });
            }

            listings = await Listing.find(query).limit(50);
            console.log(`Found ${listings.length} listings for query:`, query);
        }

        if (!listings || listings.length === 0) {
            return res.render('error', {
                title: 'No Results Found',
                message: `No listings found for ${searchDescription}`
            });
        }

        // Transform the data
        const transformedListings = listings.map(listing => ({
            ...listing._doc,
            "host name": listing.host_name,
            "neighbourhood group": listing.neighbourhood_group,
            "room type": listing.room_type,
            "service fee": listing.service_fee,
            "minimum nights": listing.minimum_nights,
            "number of reviews": listing.number_of_reviews,
            "review rate number": listing.review_rate_number,
            "availability 365": listing.availability_365
        }));

        res.render('searchResults', {
            title: 'Search Results',
            listings: transformedListings,
            searchDescription: searchDescription,
            resultsCount: listings.length
        });

    } catch (error) {
        console.error('Search error:', error);
        res.render('error', {
            title: 'Search Error',
            message: 'Failed to perform search: ' + error.message
        });
    }
});

// Filter listings with multiple criteria
app.get('/listings/filter', async (req, res) => {
    try {
        const { roomType, neighbourhoodGroup, minPrice, maxPrice, minRating, propertyType } = req.query;

        let query = {};

        if (roomType) query.room_type = roomType;
        if (neighbourhoodGroup) query.neighbourhood_group = neighbourhoodGroup;
        if (propertyType) query.property_type = propertyType;

        // Fix price filtering - handle string prices
        if (minPrice || maxPrice) {
            query.$expr = {};
            let priceConditions = [];

            if (minPrice) {
                priceConditions.push({
                    $gte: [
                        { $toDouble: { $ifNull: ["$price", 0] } },
                        parseFloat(minPrice)
                    ]
                });
            }

            if (maxPrice) {
                priceConditions.push({
                    $lte: [
                        { $toDouble: { $ifNull: ["$price", 0] } },
                        parseFloat(maxPrice)
                    ]
                });
            }

            if (priceConditions.length > 0) {
                query.$expr = { $and: priceConditions };
            }
        }

        if (minRating) {
            query.review_rate_number = {
                $gte: parseFloat(minRating)
            };
        }

        const listings = await Listing.find(query).limit(100);
        console.log(`Found ${listings.length} listings with filter query:`, query);

        // Transform the data
        const transformedListings = listings.map(listing => ({
            ...listing._doc,
            "host name": listing.host_name,
            "neighbourhood group": listing.neighbourhood_group,
            "room type": listing.room_type,
            "service fee": listing.service_fee,
            "minimum nights": listing.minimum_nights,
            "number of reviews": listing.number_of_reviews,
            "review rate number": listing.review_rate_number,
            "availability 365": listing.availability_365
        }));

        res.render('allListings', {
            title: 'Filtered Listings',
            listings: transformedListings
        });

    } catch (error) {
        console.error('Filter error:', error);
        res.render('error', {
            title: 'Error',
            message: 'Filter failed: ' + error.message
        });
    }
});

// Quick Search Route for All Listings Page
app.get('/quick-search', async (req, res) => {
    try {
        const { quickSearch } = req.query;

        if (!quickSearch || quickSearch.trim() === '') {
            return res.redirect('/listings');
        }

        const searchTerm = quickSearch.trim();

        // Search by ID or Name using regex
        const listings = await Listing.find({
            $or: [
                { id: { $regex: searchTerm, $options: 'i' } },
                { NAME: { $regex: searchTerm, $options: 'i' } }
            ]
        }).limit(100);

        // Properly transform the data for template
        const transformedListings = listings.map(listing => {
            const listingDoc = listing._doc ? listing._doc : listing;
            return {
                ...listingDoc,
                // Map fields with spaces to template-friendly names
                "host name": listingDoc["host name"] || listingDoc.host_name,
                "neighbourhood group": listingDoc["neighbourhood group"] || listingDoc.neighbourhood_group,
                "room type": listingDoc["room type"] || listingDoc.room_type,
                "service fee": listingDoc["service fee"] || listingDoc.service_fee,
                "minimum nights": listingDoc["minimum nights"] || listingDoc.minimum_nights,
                "number of reviews": listingDoc["number of reviews"] || listingDoc.number_of_reviews,
                "review rate number": listingDoc["review rate number"] || listingDoc.review_rate_number,
                "availability 365": listingDoc["availability 365"] || listingDoc.availability_365,
                // Also provide direct access
                host_name: listingDoc["host name"] || listingDoc.host_name,
                neighbourhood_group: listingDoc["neighbourhood group"] || listingDoc.neighbourhood_group,
                room_type: listingDoc["room type"] || listingDoc.room_type,
                service_fee: listingDoc["service fee"] || listingDoc.service_fee,
                minimum_nights: listingDoc["minimum nights"] || listingDoc.minimum_nights,
                number_of_reviews: listingDoc["number of reviews"] || listingDoc.number_of_reviews,
                review_rate_number: listingDoc["review rate number"] || listingDoc.review_rate_number,
                availability_365: listingDoc["availability 365"] || listingDoc.availability_365
            };
        });

        res.render('allListings', {
            title: 'Search Results',
            listings: transformedListings,
            quickSearch: searchTerm
        });

    } catch (error) {
        console.error('Quick search error:', error);
        res.render('error', {
            title: 'Search Error',
            message: 'Failed to perform search: ' + error.message
        });
    }
});

// Add new listing form
app.get('/add-listing', (req, res) => {
    res.render('addListing', {
        title: 'Add New Listing'
    });
});

// Add new listing
app.post('/add-listing', async (req, res) => {
    try {
        console.log('📝 Form submission received:', req.body);

        const {
            id, NAME, host_id, host_name, host_identity_verified,
            price, service_fee, room_type, property_type,
            neighbourhood_group, neighbourhood, minimum_nights,
            availability_365, review_rate_number, number_of_reviews,
            cancellation_policy, instant_bookable, house_rules,
            thumbnail, images
        } = req.body;

        // Basic validation for required fields
        const requiredFields = {
            id, NAME, host_id, host_name, price, room_type,
            property_type, neighbourhood_group, neighbourhood, thumbnail
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            console.log('❌ Missing fields:', missingFields);
            return res.render('error', {
                title: 'Error',
                message: `Please fill all required fields. Missing: ${missingFields.join(', ')}`
            });
        }

        // Check if listing already exists
        const existingListing = await Listing.findOne({ id });
        if (existingListing) {
            return res.render('error', {
                title: 'Error',
                message: `Listing with ID ${id} already exists`
            });
        }

        // Process images
        let imageArray = [];
        if (images && images.trim() !== '') {
            imageArray = images.split(',').map(img => img.trim()).filter(img => img !== '');
        }
        if (imageArray.length === 0) {
            imageArray = [
                `https://picsum.photos/seed/${id}a/600/400`,
                `https://picsum.photos/seed/${id}b/600/400`
            ];
        }

        // Create listing data
        const listingData = {
            id,
            NAME,
            "host id": host_id,
            "host name": host_name,
            host_identity_verified: host_identity_verified || 'unconfirmed',
            "neighbourhood group": neighbourhood_group,
            neighbourhood,
            price: price.toString().replace('$', ''),
            "service fee": service_fee || '$0',
            "room type": room_type,
            property_type,
            "minimum nights": minimum_nights || '1',
            "availability 365": availability_365 || '365',
            "review rate number": review_rate_number || '0',
            "number of reviews": number_of_reviews || '0',
            cancellation_policy: cancellation_policy || 'moderate',
            instant_bookable: instant_bookable || 'FALSE',
            house_rules: house_rules || '',
            thumbnail,
            images: imageArray,
            // Default values for other fields
            lat: '40.7128',
            long: '-74.0060',
            country: 'United States',
            "country code": 'US',
            "Construction year": '2020',
            "last review": '',
            "reviews per month": '',
            "calculated host listings count": '1',
            license: ''
        };

        console.log('Creating listing with data:', listingData);

        const newListing = new Listing(listingData);
        await newListing.save();

        // Transform for template
        const transformedListing = {
            ...newListing._doc,
            "host name": newListing["host name"],
            "neighbourhood group": newListing["neighbourhood group"],
            "room type": newListing["room type"],
            "service fee": newListing["service fee"],
            "minimum nights": newListing["minimum nights"],
            "number of reviews": newListing["number of reviews"],
            "review rate number": newListing["review rate number"],
            "availability 365": newListing["availability 365"],
            host_name: newListing["host name"],
            neighbourhood_group: newListing["neighbourhood group"],
            room_type: newListing["room type"],
            service_fee: newListing["service fee"],
            minimum_nights: newListing["minimum nights"],
            number_of_reviews: newListing["number of reviews"],
            review_rate_number: newListing["review rate number"],
            availability_365: newListing["availability 365"]
        };

        console.log('✅ Listing created successfully:', transformedListing.id);

        res.render('listing', {
            title: 'Listing Added Successfully',
            listing: transformedListing,
            message: 'Listing added successfully!'
        });

    } catch (error) {
        console.error('❌ Error adding listing:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to add listing: ' + error.message
        });
    }
});

// Edit listing form
app.get('/edit-listing/:id', async (req, res) => {
    try {
        const listing = await Listing.findOne({ id: req.params.id });
        if (!listing) {
            return res.render('error', {
                title: 'Error',
                message: 'Listing not found'
            });
        }

        console.log('Editing listing ID:', listing.id); // Debug log
        console.log('Listing data:', listing); // Debug log

        res.render('editListing', {
            title: 'Edit Listing',
            listing: listing
        });
    } catch (error) {
        console.error('Error fetching listing for edit:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to fetch listing: ' + error.message
        });
    }
});

// Update listing
app.post('/update-listing/:id', async (req, res) => {
    try {
        console.log(`Updating listing ${req.params.id}`);
        console.log('Form data received:', req.body);

        const updateData = { ...req.body };

        // Clean price (remove $ and commas)
        if (updateData.price) {
            updateData.price = updateData.price.toString().replace(/[$,]/g, '').trim();
        }

        const listing = await Listing.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!listing) {
            return res.render('error', { title: 'Error', message: 'Listing not found' });
        }

        // Transform for consistent rendering
        const transformedListing = {
            ...listing._doc,
            "host name": listing.host_name,
            "neighbourhood group": listing.neighbourhood_group,
            "room type": listing.room_type,
            "service fee": listing.service_fee,
            "minimum nights": listing.minimum_nights,
            "number of reviews": listing.number_of_reviews,
            "review rate number": listing.review_rate_number,
            "availability 365": listing.availability_365,
            host_name: listing.host_name,
            neighbourhood_group: listing.neighbourhood_group,
            room_type: listing.room_type,
            service_fee: listing.service_fee,
            minimum_nights: listing.minimum_nights,
            number_of_reviews: listing.number_of_reviews,
            review_rate_number: listing.review_rate_number,
            availability_365: listing.availability_365
        };

        res.render('listing', {
            title: 'Listing Updated',
            listing: transformedListing,
            message: 'Listing updated successfully!'
        });

    } catch (error) {
        console.error('Update error:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to update listing: ' + error.message
        });
    }
});

// Delete listing
app.post('/delete-listing/:id', async (req, res) => {
    try {
        const listing = await Listing.findOneAndDelete({ id: req.params.id });

        if (!listing) {
            return res.render('error', {
                title: 'Error',
                message: 'Listing not found'
            });
        }

        res.render('index', {
            title: 'AirBnB Data Explorer',
            message: `Listing ${req.params.id} deleted successfully!`
        });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.render('error', {
            title: 'Error',
            message: 'Failed to delete listing: ' + error.message
        });
    }
});

// ==================== API ROUTES ====================

app.get('/api/listings', async (req, res) => {
    try {
        const listings = await Listing.find().limit(100);
        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/listing/:id', async (req, res) => {
    try {
        const listing = await Listing.findOne({ id: req.params.id });
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        res.json(listing);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/listings', async (req, res) => {
    try {
        const newListing = new Listing(req.body);
        await newListing.save();
        res.status(201).json(newListing);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/listings/:id', async (req, res) => {
    try {
        const listing = await Listing.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        res.json(listing);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/listings/:id', async (req, res) => {
    try {
        const listing = await Listing.findOneAndDelete({ id: req.params.id });
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Error',
        message: 'Route not found'
    });
});

// Start the server
app.listen(port, () => {
    console.log(`AirBnB app listening at http://localhost:${port}`);
});