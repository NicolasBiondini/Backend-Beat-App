import { QueryResult } from "pg";
import { pool } from "../database";
import { message } from "./user";

interface tasks {
  task_name: string;
  person_uid: string;
  goal: number;
  total_time: number;
}

export class Tasks implements tasks {
  public task_name: string;
  public person_uid: string;
  public goal: number;
  public total_time: number;

  constructor(task_name?: string, person_uid?: string, goal?: number) {
    this.task_name = task_name;
    this.person_uid = person_uid;
    this.goal = goal | 100;
  }

  async checkTask(task_name: string, person_uid: string) {
    try {
      const isTask = await pool.query(
        "SELECT task_name FROM tasks WHERE person_uid = $1 AND task_name = $2",
        [person_uid, task_name]
      );
      if (isTask.rowCount) {
        return true;
      }
      return false;
    } catch (err) {
      console.log(err);
      return true;
    }
  }

  async createTask() {
    const itsCreated = await this.checkTask(this.task_name, this.person_uid);
    if (itsCreated) return { status: 422, message: "Task is already created." };
    try {
      await pool.query(
        "INSERT INTO tasks (task_id, task_name, person_uid, goal, total_time) VALUES (uuid_generate_v4(), $1, $2, $3, $4)",
        [this.task_name, this.person_uid, this.goal, 0]
      );
      return {
        status: 200,
        message: `Task created.`,
      };
    } catch (err) {
      console.log(err);
      return { status: 500, message: "Server Failded" };
    }
  }

  async changeGoal(person_uid: string, task_name: string, newGoal: number) {
    try {
      await pool.query(
        "UPDATE tasks SET goal = $3 WHERE person_uid = $1 AND task_name = $2",
        [person_uid, task_name, newGoal]
      );
      return {
        status: 200,
        message: `Task Updated.`,
      };
    } catch (err) {
      console.log(err);
      return { status: 500, message: "Server Failded" };
    }
  }
}
