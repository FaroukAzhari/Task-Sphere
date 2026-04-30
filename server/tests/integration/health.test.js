const request = require("supertest");
const app = require("../../src/app");

describe("API health", () => {
  it("returns service healthy", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe("task-sphere-api");
  });
});
