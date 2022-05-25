const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1l4vypy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('db connect');

        const allToolsCollection = client.db("machanic-shop").collection("allTools");

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