const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Product Verse server is started')
})

app.listen(port, () => {
    console.log(`My server is running on ${port}`);
})