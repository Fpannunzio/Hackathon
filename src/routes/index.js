var express = require('express');
const pool = require('../db')
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var mascots = [
    { name: 'Sammy', organization: "DigitalOcean", birth_year: 2012},
    { name: 'Tux', organization: "Linux", birth_year: 1996},
    { name: 'Moby Dock', organization: "Docker", birth_year: 2013}
  ];
  var tagline = "No programming concept is complete without a cute animal mascot.";

  res.render('index', {
    mascots: mascots,
    tagline: tagline
  });
  
});

router.get('/about', function(req, res, next) {
  res.render('about', { title: 'Express' });
});

router.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM test_table');
    const results = { 'results': (result) ? result.rows : null};
    res.render('db', results );
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

module.exports = router;
