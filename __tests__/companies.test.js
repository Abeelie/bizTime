process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testComp;

beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO
      companies (code, name, description) 
      VALUES ('Tesla', 'Tesla', 'The voom voom')
      RETURNING code, name, description`);
  testComp = result.rows[0];
});

describe("GET /companies", function() {
  test("Returns all companies", async function() {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [testComp]
    });
  });
});

describe("GET /companies/:code", function() {
  test("Returns a company with id matching params", async function() {
    const response = await request(app).get(`/companies/${testComp.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({company: testComp, invoiceID: []});
  });

  test("Responds with 404 company code not found", async function() {
    const response = await request(app).get(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /companies/add", function() {
  test("Adds a new company", async function() {
    const response = await request(app)
      .post(`/companies/add`)
      .send({
        code: "Microsoft",
        name: "Microsoft",
        description: "Tech company"
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {  code: "Microsoft", 
                  name: "Microsoft", 
                  description: "Tech company"}
    });
  });
});

describe("PUT /companies/:code", function() {
  test("Updates one company", async function() {
    const response = await request(app)
      .put(`/companies/${testComp.code}`)
      .send({
        name: "Google",
        description: "Tech company"
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {code: testComp.code, 
                name: "Google", 
                description: "Tech company"}
    });
  });

  test("Responds with 404 company id not found", async function() {
    const response = await request(app).patch(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:code", function() {
  test("Deletes a single company", async function() {
    const response = await request(app)
      .delete(`/companies/${testComp.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
  });
});


afterEach(async function() {
  await db.query("DELETE FROM companies");
});

afterAll(async function() {
  await db.end();
});
