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
  var employer_user = req.params.employer;
  try {
    const client = await pool.connect();
    const employer = await client.query(`SELECT * FROM employer WHERE username = $1`, [employer_user])

    if(employer.rows.length == 0) {
      res.redirect('/register')
      return
    }
    const result = await client.query(`SELECT employer, employee, id FROM resumes WHERE employer = $1`, [employer])
    const results = { 'results': (result) ? result.rows : null , 'employer': employer.rows[0]};

    res.render('dashboard', results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

router.get("/qr/:employer", async (req, res) => {

  const employer_user = req.params.employer
  const qrurl = req.get('host') + '/upload?employer=' + employer_user

  try {
    const client = await pool.connect();
    const employer = await client.query(`SELECT * FROM employer WHERE username = $1`, [employer_user])

    if(employer.rows.length == 0) {
      res.redirect('/register')
      return
    }

    const qrdata = await qr.toDataURL(qrurl)
    res.render("qr", { qrdata, "employer": employer.rows[0] });

    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }


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

router.get('/register', function (req, res, next) {
  res.render('register', {"body": {}});
});

router.post('/register', async (req, res) => {

    const body = req.body

    if (!body.username || !body.display_name) {
      return res.render('register', {"body": body, "error": "Nombre de la empresa y de usuario son requeridos."});
    }

    const client = await pool.connect();

    try{
      const employer = await client.query('SELECT * from employer where username = $1', [body.username]);
      
      if(employer.rows.length > 0) {
        return res.render('register', {"body": body, "error": 'El nombre de usuario ya esta en uso'});
        return;
      }

      await client.query('INSERT INTO employer (username, display_name, description) VALUES ($1, $2, $3)',
      [body.username, body.display_name, body.desc]);
      res.redirect(`/dashboard/${body.username}`);

    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
});

router.get('/login', function (req, res, next) {
  res.render('login', {});
});

router.get('/upload', function (req, res, next) {
  var employer = req.query.employer;
  res.render('upload', {"employer": employer});
});

router.post("/upload", async (req, res) => {

  const body = req.body
  if (!req.files || Object.keys(req.files).length === 0 || !body.employer || !body.employee) {
    return res.status(400).send('No files were uploaded.');
  }
  var cv = req.files.cv;
  var name = cv.name.substr(0, cv.name.indexOf('.'));
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
