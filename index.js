const express = require('express');
const {MongoClient, ServerApiVersion} = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
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

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader) {
        return res.status(401).send('Unauthorize Access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if(err) {
            return res.status(401).send('Unauthorize Access');
        }
        req.decoded = decoded;
        next();
    });
};

async function run() {
    try {
        const appointmentOptionsCollection = client.db('doctorsPortal').collection('appointmentOptions');
        const bookingsCollection = client.db('doctorsPortal').collection('bookings');
        const usersCollection = client.db('doctorsPortal').collection('users');

        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionsCollection.find(query).toArray();
            const bookingQuery = {appointmentDate: date};
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = remainingSlots;
            });
            res.send(options);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email;

            if(email !== decodedEmail) {
                return res.status(401).send('Unauthorize Access');
            }

            const query = {email: email};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            };
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if(alreadyBooked.length) {
                return res.send({acknowledged: false, message: 'Already booked'});
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        // JWT API
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            console.log(query);
            const user = await usersCollection.findOne(query);
            if(user) {
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: null});
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
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