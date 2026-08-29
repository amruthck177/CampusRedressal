const mongoose = require('mongoose');

// Workaround connection string with all three resolved shard hostnames
const uri = 'mongodb://amruthck123_db_user:NJ9THSLrGniQSkQ2@ac-cpey7av-shard-00-00.tcr5spf.mongodb.net:27017,ac-cpey7av-shard-00-01.tcr5spf.mongodb.net:27017,ac-cpey7av-shard-00-02.tcr5spf.mongodb.net:27017/campus-redressal?ssl=true&authSource=admin&retryWrites=true&w=majority';

console.log('Connecting to MongoDB Atlas (All shards workaround)...');
mongoose.connect(uri)
  .then(() => {
    console.log('Success! Connected.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting:', err);
    process.exit(1);
  });
