class CompanyService {
  async getCompanyList() {
    return window.electronAPI.db.query(
      "SELECT * FROM companies ORDER BY name ASC"
    );
  }
  async createCompany(company): Promise<void> {
    const sql = `INSERT INTO companies 
        (name, type, capacity, owner) 
        VALUES (?, ?, ?, ?)`;

    const params = [company.name, company.type, company.capacity, company.owner];

    const res = await window.electronAPI.db.execute(sql, params);
    if (res.success) {
      console.log("User deleted successfully");
    } else {
      console.error("Failed to delete user", res.error);
    }
  }
  async updateCompany(company): Promise<void> {
    const sql = `UPDATE companies SET 
        name = ?, 
        type = ?, 
        capacity = ?, 
        owner = ? 
       WHERE id = ?`;

    const params = [
      company.name,
      company.type,
      company.capacity,
      company.owner,
      company.id,
    ];

    const res = await window.electronAPI.db.execute(sql, params);
    if (res.success) {
      console.log("User deleted successfully");
    } else {
      console.error("Failed to delete user", res.error);
    }
  }
  async deleteCompany(id: number): Promise<void> {
    const res = await window.electronAPI.db.execute(
      "DELETE FROM companies WHERE id = ?",
      [id]
    );
    if (res.success) {
      console.log("User deleted successfully");
    } else {
      console.error("Failed to delete user", res.error);
    }
  }
}

export const companyService = new CompanyService();