const express = require('express');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dfsfskmha',
    api_key: '967241159958238',
    api_secret: 'fMWZ0Pq-M65SCpO2yR0cSPJm5Xc'
});

// Endpoint to generate upload signature
app.post('/sign-upload', (req, res) => {
    const { publicId, resourceType } = req.body;
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        { public_id: publicId, timestamp, resource_type: resourceType },
        'your_api_secret'
    );
    res.json({ signature, timestamp, apiKey: 'your_api_key' });
});

app.listen(3000, () => console.log('Server running on port 3000'));