const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`Connect Database Success!`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    if (!process.env.MONGO_URI) {
        console.error("Error: MONGO_URI is not defined in environment variables");
        process.exit(1);
    }
    
    connectDB()
        .then(() => {
            console.log("Test connection completed");
            mongoose.connection.close();
        })
        .catch(err => {
            console.error("Connection test failed:", err);
        });
}

module.exports = connectDB;