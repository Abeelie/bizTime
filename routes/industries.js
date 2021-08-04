const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');


router.get('/', async function (req, res, next) {
  try {
    const result = await db.query(`SELECT * FROM industries`);
    return res.json({ "industries": result.rows});
  } catch(error){
  	next(error);
  }
});


router.get('/search/:code', async function (req, res, next) {
  try {
  	let {code} = req.params; 

  	const results = await db.query(`
      SELECT industry_code, company_code FROM company_industry 
      WHERE industry_code = $1`, 
      [code]);

 	const company = await db.query(`
 	  SELECT * FROM companies WHERE code = $1`, [results.rows[0].company_code]);

 	const industry = await db.query(`
 	  SELECT * FROM industries WHERE code = $1`, [results.rows[0].industry_code]);

 	results.company = [{"name": company.rows[0].name, 
 	                   "description": company.rows[0].description}];

 	results.industry = industry.rows[0].industry;
 	// console.log(results)

    if (results.rows.length === 0) {
      throw new ExpressError(`Message not found with id ${code}`, 404)
    }

  
    return res.json({ "industries": results.rows, 
    	              "company":    results.company,
    	              "industry":   results.industry
    	           });
  } catch(error){
  	next(error)
  }
});


router.post('/add-to-industries', async function (req, res, next) {
  try {
    const { code, industry } = req.body;

    const industries = await db.query(
     `INSERT INTO industries (code, industry) VALUES ($1, $2) 
      RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ "industry": industries.rows[0] }); 
  } catch (err) {
    return next(err);
  }
});

router.post('/add-to-company-industry', async function (req, res, next){
	try{
	 const { industry_code , company_code } = req.body;

	 const company_industry = await db.query(
     `INSERT INTO company_industry (industry_code, company_code) VALUES ($1, $2) 
      RETURNING industry_code, company_code`,
      [industry_code , company_code]
    );

	 return res.status(201).json({ "company_industry": company_industry.rows[0] }); 

	} catch(err){
	return next(err)
  }	
});





module.exports = router;