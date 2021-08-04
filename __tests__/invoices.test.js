process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInv;
let newtestComp;

beforeEach(async function () {
  let company = await db.query(`
    INSERT INTO
      companies (code, name, description) 
      VALUES ('AA', 'Anerican', 'Tech company')
      RETURNING code, name, description`);
  newtestComp = company.rows[0];

  let result = await db.query(`
    INSERT INTO
      invoices (comp_code, amt, paid, paid_date)
      VALUES ('AA', 100.00, true, null)
      RETURNING id, comp_code, amt, paid, paid_date`);
  testInv = result.rows[0];
});

describe('GET /invoices', function () {
  test('Returns invoice', async function () {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({invoices: [{id: testInv.id,
                                               comp_code: testInv.comp_code,
                                               amt: testInv.amt,
                                               paid: testInv.paid,
                                               paid_date: testInv.paid_date,
                                               add_date: expect.any(String),
        },
      ],
    });
  });
});

describe('GET /invoices/:id', function () {
  test('Returns invoice with matching params', async function () {
    const response = await request(app).get(`/invoices/${testInv.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({invoice: { id: testInv.id,
                                              comp_code: testInv.comp_code,
                                              description: newtestComp.description,
                                              name: newtestComp.name,
                                              amt: testInv.amt,
                                              paid: testInv.paid,
                                              paid_date: testInv.paid_date,
                                              add_date: expect.any(String),
      },
    });
  });

  test("Responds with 404 no in with that id", async function () {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});

describe('POST /invoices/add', function () {
  test('Creates a new invoice', async function () {
    const response = await request(app).post(`/invoices/add`).send({
      comp_code: 'AA',
      amt: 500,
      paid: false,
      paid_date: null,
    });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: 'AA',
        amt: 500,
        paid: false,
        paid_date: null,
        add_date: expect.any(String),
      },
    });
  });
});


describe('Put /invoices/:id', function () {
  test('Updates a invoice with id matching params', async function () {
    const response = await request(app)
      .put(`/invoices/${testInv.id}`)
      .send({
        comp_code: 'AA',
        amt: 200,
        paid: false,
        paid_date: null,
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ invoice: { id: expect.any(Number),
                                               comp_code: 'AA',
                                               amt: 200,
                                               paid: false,
                                               add_date: expect.any(String),
                                               paid_date: null,
      },
    });
  });

  test("Responds with 404 no in with that id", async function () {
    const response = await request(app).patch(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});


describe('DELETE /invoices/:id', function () {
  test('Deletes a invoice with id matching params', async function () {
    const response = await request(app).delete(`/invoices/${testInv.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: 'deleted' });
  });
});


afterEach(async function () {
  await db.query('DELETE FROM companies');
  await db.query('DELETE FROM invoices');
});

afterAll(async function () {
  await db.end();
});