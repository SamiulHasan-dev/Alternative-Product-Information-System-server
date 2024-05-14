const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const recommendationCollection = client.db('productDB').collection('recommendation');

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

        // get single product
        app.get('/query/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result)
        })


        //delete my queries
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

        // // // update after recommandation
        // app.put('/products/:id', async (req, res) => {
        //     // Update recommendation count in product collection
        //     const productId = req.params.id;
        //     const query = { _id: new ObjectId(productId) };
        //     const update = { $inc: { recommendationCount: 1 } }; // Increment recommendationCount by 1
        //     const updateResult = await productCollection.updateOne(query, update);
        //     res.send(updateResult)
        // })





        //update Query
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateQuery = req.body;
            const Query = {
                $set: {
                    productName: updateQuery.productName,
                    productBand: updateQuery.productBand,
                    productImage: updateQuery.productImage,
                    queryTitle: updateQuery.queryTitle,
                    boycott: updateQuery.boycott
                }
            }
            const result = await productCollection.updateOne(filter, Query, options);
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


        //myQueries
        app.get('/products/:email', async (req, res) => {
            console.log(req.params.email)
            const myEmail = req.params.email;
            const query = { email: myEmail };
            console.log(myEmail)
            const result = await productCollection.find(query).toArray();
            res.send(result);
        })


        /* Recommendation */



        //post tp recommend
        // app.post('/recommendProduct', async (req, res) => {
        //     const newProduct = req.body;
        //     console.log(newProduct);
        //     const result = await recommendationCollection.insertOne(newProduct);
        //     res.send(result);
        // })


        //post and increase recommendationCount
        app.post('/recommendProduct', async (req, res) => {
            try {
                const newProduct = req.body;
                console.log(newProduct);

                // Insert new recommendation into recommendationCollection
                const result = await recommendationCollection.insertOne(newProduct);

                // Extract productId from newProduct
                const productId = newProduct.productId;
                if (!productId) {
                    throw new Error('productId is missing in the newProduct');
                }

                // Update recommendationCount in productCollection
                const updateDoc = {
                    $inc: { recommendationCount: 1 },
                }
                const jobQuery = { _id: new ObjectId(productId) }
                const updateBidCount = await productCollection.updateOne(jobQuery, updateDoc)
                console.log(updateBidCount)

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });




        //recommend by myEmail
        app.get('/recommendProduct/:email', async (req, res) => {
            console.log(req.params.email)
            const myEmail = req.params.email;
            const query = { recommenderEmail: myEmail };
            console.log(myEmail)
            const result = await recommendationCollection.find(query).toArray();
            res.send(result);
        })

        // app.get('/quizAttempt', async(req, res) => {
        //     console.log(req.query.email);
        //     // console.log('cook cookies', req.cookies);
        //     // console.log('token owner info', req.user);
        //     // if(req.query.email !== req.user.email){
        //     //   return res.status(403).send({message: 'forbidden access'})
        //     // }
        //     let query = {};
        //     if(req.query?.email){
        //       query = {email: req.query.email}
        //     }
        //     const result = await taskCollection.find(query).toArray();
        //     res.send(result);
        //   })


        app.get('/recommendProduct', async (req, res) => {
            // const id = req.body();
            const cursor = recommendationCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/recommendProductId/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await recommendationCollection.findOne(query);
            res.send(result)
        })
        // delete the data
        // app.delete('/recommendProductId/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };
        //     const result = await recommendationCollection.deleteOne(query);
        //     res.send(result);
        // })

        // Delete recommendation and decrement recommendationCount
        app.delete('/recommendProductId/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };

                // Find the recommendation to get the productId
                const recommendation = await recommendationCollection.findOne(query);
                if (!recommendation) {
                    res.status(404).send('Recommendation not found');
                    return;
                }

                // Delete the recommendation
                const result = await recommendationCollection.deleteOne(query);

                // Decrement recommendationCount in productCollection
                const productId = recommendation.productId;
                const productQuery = { _id: new ObjectId(productId) };
                const updateDoc = {
                    $inc: { recommendationCount: -1 },
                };
                const updateResult = await productCollection.updateOne(productQuery, updateDoc);
                console.log(updateResult);

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });



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