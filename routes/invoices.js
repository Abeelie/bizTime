const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


router.get("/", async function (req, res, next) {
  try {
    const allInvoices = await db.query(`SELECT * FROM invoices`);
    return res.json({"invoices": allInvoices.rows});

  } catch (err) {
    return next(err);
  }
});


router.get("/:id", async function (req, res, next) {
  try {
    let { id } = req.params;

    const getInvoiceId = await db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date, name, description 
       FROM invoices 
       INNER JOIN companies ON (invoices.comp_code = companies.code)  
       WHERE id = $1`,
       [id]);

    if (getInvoiceId.rows.length === 0) {
      throw new ExpressError(`No invoice with ID: ${id}`,404);
    }
    
    return res.json({"invoice": getInvoiceId.rows[0]});

  } catch (err) {
    return next(err);
  }
});


router.post("/add", async function (req, res, next) {
  try {
    let { comp_code, amt } = req.body;

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) 
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
       [comp_code, amt]);

    return res.json({"invoice": result.rows[0]});

  } catch (err) {
    return next(err);
  }
});


router.put("/:id", async function (req, res, next) {
  try {
    let { amt, paid } = req.body;
    let { id } = req.params;
    let paidDate;

    const searchID = await db.query(`
      SELECT paid FROM invoices WHERE id = $1`, [id]);

    if (searchID.rows.length === 0) {
      throw new ExpressError(`No invoice with ID: ${id}`, 404);
    }

    if (!searchID.rows[0].paid_date && paid) {
      paidDate = new Date().toISOString().slice(0, 10);
    } else if (!paid) {
      paidDate = null
    } else {
      paidDate = searchID.rows[0].paid_date;
    }

    const update = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3
       WHERE id=$4
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
       [amt, paid, paidDate, id]);

    return res.json({"invoice": update.rows[0]});

  } catch (err) {
    return next(err);
  }

});

router.delete("/:id", async function (req, res, next) {
  try {
    let { id } = req.params;

    const result = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      throw new ExpressError(`No invoice with ID: ${id}`, 404);
    }

    return res.json({"status": "deleted"});

  } catch (err) {
    return next(err);
  }
});


module.exports = router;