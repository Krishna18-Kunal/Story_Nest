
require('dotenv').config();
const mongoose = require('mongoose');

async function checkIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const indexes = await mongoose.connection
      .collection('reviews')
      .indexes();

    console.log('\n--- REVIEW COLLECTION INDEXES ---\n');

    console.log(JSON.stringify(indexes, null, 2));

  } catch (error) {
    console.error('Index check failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkIndexes();
