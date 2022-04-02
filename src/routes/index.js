var express = require('express');
const pool = require('../db')
const qr = require('qrcode');
const { render } = require('ejs');
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

router.get('/dashboard', (req, res) => {
  res.redirect(`/dashboard/${req.query.employer}`)
});

router.get('/dashboard/:employer', async (req, res) => {
  var employer = req.params.employer;
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT employer, employee, id FROM resumes WHERE employer = $1`, [employer])
    const results = { 'results': (result) ? result.rows : null };
    res.render('dashboard', results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

router.get("/qr/:employer", (req, res) => {
  
  console.log(req.get('host'))

  const qrurl = req.get('host') + '/upload?employer=' + req.params.employer

  // If the input is null return "Empty Data" error
  if (qrurl.length === 0) res.send("Empty Data!");

  // Let us convert the input stored in the url and return it as a representation of the QR Code image contained in the Data URI(Uniform Resource Identifier)
  // It shall be returned as a png image format
  // In case of an error, it will save the error inside the "err" variable and display it

  qr.toDataURL(qrurl, (err, src) => {
    if (err) res.send("Error occured");

    console.log(src)
    // Let us return the QR code image as our response and set it to be the source used in the webpage
    res.render("qr", { src });
  });
});

router.get('/cv/:id', async function (req, res, next) {
  const cv = req.params.id
  
  try {
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM resumes WHERE id = $1`, [cv])
    
    if(!result || result.rows.length == 0) {
      res.send('Not found', 404)
    }

    res.set("Content-Type", "application/pdf");
    res.send(result.rows[0].data);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

router.get('/about', function (req, res, next) {
  res.render('about', { title: 'Express' });
});

router.get('/login', function (req, res, next) {
  res.render('login', {});
});

router.get('/upload', function (req, res, next) {
  var employer = req.query.employer;
  console.log(employer)
  res.render('upload', {"employer": employer});
});

router.post("/upload", async (req, res) => {

  const body = req.body
  console.log(body)
  if (!req.files || Object.keys(req.files).length === 0 || !body.employer || !body.employee) {
    return res.status(400).send('No files were uploaded.');
  }
  var cv = req.files.cv;
  var name = cv.name.substr(0, cv.name.indexOf('.'));
  console.log(name, cv.data);
  const client = await pool.connect();
  try{
    await client.query('INSERT INTO resumes (filename, data, mime_type, employer, employee) VALUES ($1, $2, $3, $4, $5)',
      [name, cv.data, cv.mimetype, body.employer, body.employee]);
    res.render('upload_success', { });
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});


module.exports = router;
