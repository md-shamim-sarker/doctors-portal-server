const express = require('express');
const {MongoClient, ServerApiVersion} = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/*
// Mongodb Atlas
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.egsefuu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
*/

// Mongodb Local Server
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function run() {
    try {
        const appointmentOptionsCollection = client.db('doctorsPortal').collection('appointmentOptions');
        const bookingsCollection = client.db('doctorsPortal').collection('bookings');

        app.get('/appointmentOptions', async (req, res) => {
            const query = {};
            const options = await appointmentOptionsCollection.find(query).toArray();
            res.send(options);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

    } catch(error) {
        console.log(error);
    }
}
run().catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send('<h1>Server is running fine.....</h1>');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});