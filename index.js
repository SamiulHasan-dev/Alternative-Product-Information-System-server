const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qdflpzq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const productCollection = client.db('productDB').collection('product');

        // Product
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            console.log(newProduct);
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        })


        //all data get
        app.get('/products', async (req, res) => {
            // const id = req.body();
            const cursor = productCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        //all recent data get
        app.get('/productsHome', async (req, res) => {
            // const id = req.body();
            const query = req.body;
            const options = {
                // Sort returned documents in ascending order by title (A->Z)
                sort: { currentTime: -1 },
              };
            const cursor = productCollection.find(query, options);
            const result = await cursor.toArray();
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Product Verse server is started')
})

app.listen(port, () => {
    console.log(`My server is running on ${port}`);
})