const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1l4vypy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        console.log('db connect');

        const db = client.db("machanic-shop")

        const allToolsCollection = db.collection("allTools");
        const purchaseCollection = db.collection("purchase");
        const userCollection = db.collection("users");


        // all products POST
        app.get('/tools', async (req, res) => {

            const query = {};
            const cursor = allToolsCollection.find(query);
            const tools = await cursor.toArray();
            res.json(tools)

        })
        app.get('/tools/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: ObjectId(id) };
            const result = await allToolsCollection.findOne(query);
            res.json(result)

        })
        app.post('/purchase', async (req, res) => {
            const order = req.body;
            const { productId, quantity } = req.body;
            order.createdAt = new Date();
            const result1 = await purchaseCollection.insertOne(order);
            const query = { _id: ObjectId(productId) };
            const product = await allToolsCollection.findOne(query);
            const updatedQuantity = product.quantity - quantity;
            const updateDoc = { $set: { quantity: updatedQuantity } };
            const result = await allToolsCollection.updateOne(query, updateDoc);
            res.json({ result1, result })

        })
        //getting my orders by filtering email
        app.get('/purchase/:email', verifyJWT, async (req, res) => {
            // const { id } = req.params;
            // const query = { _id: ObjectId(id) };

            let email = req.params.email;
            const authorization = req.headers.authorization;
            console.log('auth header', authorization);
            let query = { email: email }
            const result = await purchaseCollection.find(query).toArray();
            res.json(result)
        })
        // make admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }

        })

        // // user
        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);

            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        })



    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('machanic shop')
})

app.listen(port, () => {
    console.log(`Machanic shop listening on port ${port}`)
})