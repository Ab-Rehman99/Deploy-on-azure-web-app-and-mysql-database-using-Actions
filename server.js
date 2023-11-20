var express    = require("express");
var mysql      = require('mysql');
const cors      = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const port = process.env.PORT || 3000

var connection = mysql.createConnection({
  host: 'test-game-db.mysql.database.azure.com',
  user: 'abdul_admin',
  password: 'Reddeadredemption2',
  database: 'user',
  port: 3306
});

var app = express();
app.use(cors());
app.use(bodyParser.json());
connection.connect(function(err){

if(!err) {
    console.log("Database is connected ... ");    
} else {
    console.log("Error connecting database ... ");    
}
});


// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Check credentials against the database
    const selectUserQuery = 'SELECT * FROM users WHERE username = ? AND password = ?';
    connection.query(selectUserQuery, [username, password], (err, results) => {
      if (err) {
        console.error('Error querying user:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
      } else if (results.length > 0) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    });
  });
  

app.get('/', (req, res) => {
  let loginTemplate = path.join(__dirname, 'login.html')
  console.log(loginTemplate);
  res.sendFile(loginTemplate);
})

app.get('/game', (req, res) => {
  let loginTemplate = path.join(__dirname, 'corsi_memory_test.html')
  console.log(loginTemplate);
  res.sendFile(loginTemplate);
})
 
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
