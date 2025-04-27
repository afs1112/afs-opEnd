export function run(db) {
  const insertCompany = db.prepare(`
      INSERT INTO companies (name, type, capacity, owner)
      VALUES (@name, @type, @capacity, @owner)
    `);

  const companies = [
    { name: "Company A", type: "Cargo", capacity: 1000, owner: "Owner A" },
    { name: "Company B", type: "Tanker", capacity: 2000, owner: "Owner B" },
  ];

  const insertUser = db.prepare(`
      INSERT INTO users (company_id, name, email, age)
      VALUES (@companyId, @name, @email, @age)
    `);

  const users = [
    { companyId: 1, name: "John Doe", email: "john@example.com", age: 30 },
    { companyId: 2, name: "Jane Smith", email: "jane@example.com", age: 25 },
  ];

  db.transaction(() => {
    companies.forEach((v) => insertCompany.run(v));
    users.forEach((u) => insertUser.run(u));
  })();
}
