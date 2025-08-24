const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 

const app = express();
const PORT = 3000;


app.use(cors());


const users = [
    { userId: '1234', password: '1234', wallet: 77 } 
];


app.use(bodyParser.json());


app.post('/login', (req, res) => {
    const { userId, password } = req.body;

    
    const user = users.find(u => u.userId === userId && u.password === password);

    if (user) {
        res.json({ success: true, message: 'Login successful', wallet: user.wallet });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
