class UserService {
  async getUserList() {
    return window.electronAPI.db.query(
      `SELECT 
        users.*, 
        companies.name as company_name 
      FROM users 
      LEFT JOIN companies ON users.company_id = companies.id`
    );
  }
  async createUser(user): Promise<void> {
    const sql = `INSERT INTO users 
        (name, email, age, company_id) 
        VALUES (?, ?, ?, ?)`;

    const params = [user.name, user.email, user.age, user.company_id];

    const res = await window.electronAPI.db.execute(sql, params);
    if (res.success) {
      console.log("User created successfully");
    } else {
      console.error("Failed to create user", res.error);
    }
  }
  async updateUser(user): Promise<void> {
    const sql = `UPDATE users SET 
        name = ?, 
        email = ?, 
        age = ?, 
        company_id = ? 
       WHERE id = ?`;

    const params = [user.name, user.email, user.age, user.company_id, user.id];

    const res = await window.electronAPI.db.execute(sql, params);
    if (res.success) {
      console.log("User updated successfully");
    } else {
      console.error("Failed to update user", res.error);
    }
  }
  async deleteUser(id: number): Promise<void> {
    const res = await window.electronAPI.db.execute(
      "DELETE FROM users WHERE id = ?",
      [id]
    );
    if (res.success) {
      console.log("User deleted successfully");
    } else {
      console.error("Failed to delete user", res.error);
    }
  }
}

export const userService = new UserService();