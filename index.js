const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config()
var serviceAccount = require("./configs/buj-al-arab-firebase-adminsdk-hhxkh-cf516b2b7e.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const port = 5000

const app = express()
app.use(cors());
app.use(bodyParser.json());

const MongoClient = require('mongodb').MongoClient;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qthye.mongodb.net/brujAlArab?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const booking = client.db("brujAlArab").collection("bookings");
    // perform actions on the collection object
    console.log('db connected successfully');
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        booking.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
                //console.log(result);
            })
        //console.log(newBooking);
    })
    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        //console.log(bearer);
        if (bearer && bearer.startsWith('Bearer')) {
            const idToken = bearer.split(' ')[1]
            // idToken comes from the client app
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    if (tokenEmail === req.query.email) {

                        booking.find({ email: req.query.email })
                            .toArray((err, document) => {
                                res.status(200).send(document);
                            })

                    }
                    else {
                        res.status(401).send('un-authorized')
                    }

                })
                .catch((error) => {
                    res.status(401).send('un-authorized')
                });
        }
        else {
            res.status(401).send('un-authorized')
        }
        //   console.log(req.headers.authorization);
        //   booking.find({email:req.headers.authorization})
        //   .toArray((err,document) =>{
        //   res.send(document);
        //   })
    })
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port)