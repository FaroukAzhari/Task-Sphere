const request = require("supertest");
const app = require("../../src/app");

describe("Auth route validation", () => {
  it("rejects invalid register payload", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "",
      email: "bad",
      password: "123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects unauthorized me request", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
