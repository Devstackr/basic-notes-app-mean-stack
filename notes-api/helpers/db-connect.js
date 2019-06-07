// This file will handle connection logic to the MongoDB database

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/NoteMate', { useNewUrlParser: true }).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch(e => {
    console.log('Error while attempting to connect to MongoDB');
    console.log(e);
})

// To preven deprecation warnings (from MongoDB Native Driver)
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);