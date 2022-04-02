var express = require('express');
const pool = require('../db')
const qr = require('qrcode');
const { render } = require('ejs');
const url = require('url')
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  var mascots = [
    { name: 'Sammy', organization: "DigitalOcean", birth_year: 2012 },
    { name: 'Tux', organization: "Linux", birth_year: 1996 },
    { name: 'Moby Dock', organization: "Docker", birth_year: 2013 }
  ];
  var tagline = "No programming concept is complete without a cute animal mascot.";

  res.render('index', {
    mascots: mascots,
    tagline: tagline
  });

});

router.get('/qrtest', function (req, res, next) {
  res.render('qrtest', { title: 'Express' });
});

router.post("/scan", (req, res) => {
  const url = req.body.url;

  // If the input is null return "Empty Data" error
  if (url.length === 0) res.send("Empty Data!");

  // Let us convert the input stored in the url and return it as a representation of the QR Code image contained in the Data URI(Uniform Resource Identifier)
  // It shall be returned as a png image format
  // In case of an error, it will save the error inside the "err" variable and display it

  qr.toDataURL(url, (err, src) => {
    if (err) res.send("Error occured");

    // Let us return the QR code image as our response and set it to be the source used in the webpage
    res.render("scan", { src });
  });
});

router.get('/upload', function (req, res, next) {
  res.render('upload', {});
});

router.post("/uploadCV", async (req, res) => {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  var cv = req.files.cv;
  var name = cv.name.substr(0, cv.name.indexOf('.'));
  console.log(name, cv.data);
  const client = await pool.connect();
  const result = await client.query('insert into resumes (filename, resume) values ($1, $2)',
    [name, cv.data],
    function (err, writeResult) {
      console.log('err', err, 'pg writeResult', writeResult);
    });
  res.render('cv', { file: cv });
});

router.get('/retrieve', async (req, res) => {
  res.render('retrieve', {});
})

router.get('/retrieveCV', async (req, res) => {
  var cv_name = req.query.cv_name;
  console.log(cv_name)
  try {
    const client = await pool.connect();
    const result = await client.query('select * from resumes where filename = $1',
    [cv_name])
    // ,function (err, writeResult) {
    //   console.log('err', err, 'pg writeResult', writeResult);
    // });
    
    const results = { 'results': (result) ? result.rows : null };
    res.set("Content-Type", "application/pdf");
    res.send(results.results[0].data);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

router.get('/renderCV', async (req, res) => {
  res.render('cv', {});
})


module.exports = router;
