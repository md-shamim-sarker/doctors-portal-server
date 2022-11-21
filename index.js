const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => {
    res.send("Server is working fine...");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});