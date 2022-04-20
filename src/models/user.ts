import { QueryResult } from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../database";
import config from "../config/config";

interface user {
  person_uid: string;
  user_name: string;
  email: string;
  password: string;
}

type fullMessage = {
  message: string;
  token: string;
  person_uid?: string;
};

type data = {
  mesagge: string;
  finalData: object;
};

export interface message {
  status: number;
  message: string | fullMessage | data;
  refreshToken?: string;
}

export class User {
  public user_name: string;
  public email: string;
  private password: string;
  private encrypted_password: string;

  constructor(user_name?: string, email?: string, password?: string) {
    this.user_name = user_name;
    this.email = email;
    this.password = password;
  }

  async createNewUser(): Promise<message> {
    try {
      const data: QueryResult = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [this.email]
      );
      const arr: Array<string> = data.rows;
      if (arr.length != 0) {
        return { status: 400, message: "Email already there" };
      }

      this.encrypted_password = bcrypt.hashSync(this.password, 10);

      // Inserting data into DB

      await pool.query(
        "INSERT INTO users (person_uid, user_name, email, password) VALUES(uuid_generate_v4(), $1, $2, $3) ",
        [this.user_name, this.email, this.encrypted_password]
      );

      return {
        status: 200,
        message: `User ${this.user_name} created Succesfully.`,
      };
    } catch (error) {
      return { status: 500, message: "Database Error." };
    }
  }

  async comparePassword(email: string, password: string): Promise<message> {
    try {
      const data: QueryResult = await pool.query(
        "SELECT person_uid, email, password FROM users WHERE email = $1",
        [email]
      );
      const user = data.rows;
      if (user.length === 0) {
        return {
          status: 400,
          message: "User is not registered, Sing Up first.",
        };
      }
      const response: boolean = await bcrypt.compare(
        password,
        user[0].password
      );

      if (response) {
        const token = this.createToken(user[0].person_uid, user[0].email);
        const refreshToken = this.createRefreshToken(
          user[0].person_uid,
          user[0].email
        );

        // You need to save this refreshToken into the DB
        await pool.query(
          "UPDATE users SET refresh_token = $1 WHERE person_uid = $2",
          [refreshToken, user[0].person_uid]
        );

        return {
          status: 200,
          message: {
            message: "Correct password. User signed in!",
            token: token,
            person_uid: user[0].person_uid,
          },
          refreshToken: refreshToken,
        };
      } else {
        if (!response) {
          return {
            status: 400,
            message: "Invalid password. Enter the correct password!",
          };
        }
      }
    } catch (err) {
      console.log(err);
      return { status: 500, message: "Database error!." };
    }
  }

  async checkJWT(person_uid: string) {
    const data: QueryResult = await pool.query(
      "SELECT person_uid, email, password FROM users WHERE person_uid = $1",
      [person_uid]
    );

    if (data.rows.length === 0) {
      return null;
    } else {
      return data.rows[0];
    }
  }

  createToken(person_uid: string, email: string): string {
    return jwt.sign(
      {
        person_uid,
        email,
      },
      config.jwtSecret,
      { expiresIn: "5m" }
    );
  }

  createRefreshToken(person_uid: string, email: string): string {
    return jwt.sign(
      {
        person_uid,
        email,
      },
      config.jwtRefreshSecret,
      { expiresIn: "1d" }
    );
  }

  async checkDBRefreshToken(token: string): Promise<Boolean> {
    try {
      const data: QueryResult = await pool.query(
        "SELECT email FROM users WHERE refresh_token = $1",
        [token]
      );

      if (data.rows.length === 0) {
        return false;
      } else {
        return true;
      }
    } catch {
      return false;
    }
  }

  async deleteRefreshToken(token: string): Promise<Boolean> {
    try {
      await pool.query(
        "UPDATE users SET refresh_token = NULL WHERE person_uid = $1",
        [token]
      );

      return true;
    } catch {
      return false;
    }
  }

  async checkDBWithPersonUid(person_uid: string) {
    try {
      const data: QueryResult = await pool.query(
        "SELECT user_name, task_id, task_name FROM users, tasks WHERE users.person_uid = $1 AND tasks.person_uid = $1",
        [person_uid]
      );

      if (data.rows.length === 0) {
        try {
          const data: QueryResult = await pool.query(
            "SELECT user_name FROM users WHERE users.person_uid = $1",
            [person_uid]
          );
          return {
            status: 200,
            message: { message: "no data, but user found.", data: data.rows },
          };
        } catch {
          return { status: 401, message: "No user found." };
        }
      } else {
        return { status: 200, message: { message: "data ", data: data.rows } };
      }
    } catch {
      return { status: 500, message: "Error" };
    }
  }

  async selectedTasksConfig(
    person_uid: string,
    task_id1?: string | null,
    task_id2?: string | null,
    task_id3?: string | null
  ) {
    let flag: boolean[] = [];

    if (task_id1) {
      try {
        await pool.query(
          "UPDATE users SET selected_task_one = $2 WHERE users.person_uid = $1",
          [person_uid, task_id1]
        );
        flag[0] = true;
      } catch (error) {
        console.log(error);
        flag[0] = false;
      }
    }
    if (task_id2) {
      try {
        await pool.query(
          "UPDATE users SET selected_task_two = $2 WHERE users.person_uid = $1",
          [person_uid, task_id2]
        );
        flag[1] = true;
      } catch (error) {
        console.log(error);
        flag[1] = false;
      }
    }
    if (task_id3) {
      try {
        await pool.query(
          "UPDATE users SET selected_task_three = $2 WHERE users.person_uid = $1",
          [person_uid, task_id3]
        );
        flag[2] = true;
      } catch (error) {
        console.log(error);
        flag[2] = false;
      }
    }

    if (flag[0] || flag[1] || flag[2]) {
      return {
        status: 204,
        message: "User selected tasks updated.",
      };
    } else {
      return {
        status: 400,
        message: "DB error, try again.",
      };
    }
  }

  async selectedGoalTasks(
    person_uid: string,
    task_id1?: string | null,
    task_id2?: string | null
  ) {
    let flag: boolean[] = [];

    if (task_id1) {
      try {
        await pool.query(
          "UPDATE users SET goal_task_one = $2 WHERE users.person_uid = $1",
          [person_uid, task_id1]
        );
        flag[0] = true;
      } catch (error) {
        console.log(error);
        flag[0] = false;
      }
    }
    if (task_id2) {
      try {
        await pool.query(
          "UPDATE users SET goal_task_two = $2 WHERE users.person_uid = $1",
          [person_uid, task_id2]
        );
        flag[1] = true;
      } catch (error) {
        console.log(error);
        flag[1] = false;
      }
    }
    if (flag[0] || flag[1] || flag[2]) {
      return {
        status: 204,
        message: "User goals tasks updated.",
      };
    } else {
      return {
        status: 400,
        message: "DB error, try again.",
      };
    }
  }

  async selectMonthTasks(person_uid: string, task_name: string) {
    if (task_name !== null) {
      try {
        await pool.query(
          "UPDATE users SET month_task_dashboard = $2 WHERE users.person_uid = $1",
          [person_uid, task_name]
        );
        return {
          status: 204,
          message: "User month task updated.",
        };
      } catch (error) {
        console.log(error);
        return {
          status: 400,
          message: "DB error, try again.",
        };
      }
    }
  }

  async selectYearTasks(person_uid: string, task_name: string) {
    if (task_name !== null) {
      try {
        await pool.query(
          "UPDATE users SET year_task_dashboard = $2 WHERE users.person_uid = $1",
          [person_uid, task_name]
        );
        return {
          status: 204,
          message: "User year task updated.",
        };
      } catch (error) {
        console.log(error);
        return {
          status: 400,
          message: "DB error, try again.",
        };
      }
    }
  }

  async selectGoalTaskDashboard(person_uid: string, task_name: string) {
    if (task_name !== null) {
      try {
        await pool.query(
          "UPDATE users SET goal_task_dashboard = $2 WHERE users.person_uid = $1",
          [person_uid, task_name]
        );
        return {
          status: 204,
          message: "User goal task updated.",
        };
      } catch (error) {
        console.log(error);
        return {
          status: 400,
          message: "DB error, try again.",
        };
      }
    }
  }

  async howManyTasks(person_uid: string): Promise<number> {
    try {
      const response = await pool.query(
        "SELECT task_name FROM tasks WHERE person_uid = $1",
        [person_uid]
      );

      const countTasks = response.rowCount;
      return countTasks;
    } catch (error) {
      return 100;
    }
  }
}
