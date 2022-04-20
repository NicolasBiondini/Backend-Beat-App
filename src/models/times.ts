import { QueryResult } from "pg";
import { pool } from "../database";
import { message } from "./user";

interface data {
  status: number;
  data: object;
}

interface times {
  times_id: string;
  task_id: string;
  person_uid: string;
  status: boolean;
  started_at: number;
  finished_at: number;
  time: number;
}

export class Times implements times {
  public times_id: string;
  public task_id: string;
  public person_uid: string;
  public status: boolean;
  public started_at: number;
  public finished_at: number;
  public time: number;

  constructor(task_id?: string, person_uid?: string, started_at?: number) {
    this.task_id = task_id;
    this.person_uid = person_uid;
    this.started_at = started_at;
    this.status = false;
  }

  // Send to DB the times when start
  async pushTimesIntoDB(): Promise<message> {
    try {
      const newTime = await pool.query(
        "INSERT INTO times (times_id, task_id, person_uid, status, started_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4) RETURNING times_id",
        [this.task_id, this.person_uid, this.status, this.started_at]
      );
      return {
        status: 200,
        message: { mesagge: `Task started.`, finalData: newTime.rows[0] },
      };
    } catch (err) {
      console.log(err);
      return { status: 500, message: "Server Failded" };
    }
  }

  // Finish the times of the task active
  async finishTimes(
    times_id: string,
    finished_at: number,
    minutes: number,
    task_id: string
  ): Promise<message> {
    try {
      await pool.query(
        "UPDATE times SET status = TRUE, finished_at = $2, time = $3 WHERE times_id = $1",
        [times_id, finished_at, minutes]
      );
      await pool.query(
        "UPDATE tasks SET total_time = total_time + $1 WHERE task_id = $2",
        [minutes, task_id]
      );

      return {
        status: 200,
        message: `Task finished.`,
      };
    } catch (err) {
      console.log(err);
      return { status: 500, message: "Server Failded" };
    }
  }

  // Get the last Times
  async getTheLastsTimes(person_uid: string, page: number): Promise<data> {
    try {
      const times = await pool.query(
        "SELECT task_name,times_id, status, started_at, finished_at, time, count(*) OVER() AS full_count FROM times LEFT JOIN tasks ON tasks.person_uid = $1 WHERE times.task_id = tasks.task_id ORDER BY finished_at DESC LIMIT 8 OFFSET (($2 - 1)*8)",
        [person_uid, page]
      );
      /**
          SELECT task_name,times_id, status, started_at, finished_at, time FROM times LEFT JOIN tasks ON tasks.person_uid = '061a6964-54bd-4f73-8c59-3c2e349a0fb9' WHERE times.task_id = tasks.task_id
         SOLVED
         */

      return { status: 200, data: { message: times.rows } };
    } catch (err) {
      console.log(err);
      return { status: 500, data: { message: "Internal Server Error." } };
    }
  }

  // Get the time who is active
  async getActiveTimeTask(person_uid: string): Promise<data> {
    try {
      const times = await pool.query(
        "SELECT task_name, times_id, started_at FROM times LEFT JOIN tasks ON tasks.person_uid = $1 WHERE times.task_id = tasks.task_id AND times.status = FALSE",
        [person_uid]
      );

      if (times.rows.length !== 0) {
        const task_name = await pool.query(
          "SELECT task_id FROM tasks WHERE task_name = $1 AND person_uid = $2",
          [times.rows[0].task_name, person_uid]
        );

        let orderTaskObject = {
          name: times.rows[0].task_name,
          task_id: task_name.rows[0]?.task_id,
          key: 1,
        };

        let finalResult = {
          task: orderTaskObject,
          started_at: times.rows[0].started_at,
          times_id: times.rows[0].times_id,
        };

        return { status: 200, data: { message: finalResult } };
      }

      return {
        status: 200,
        data: {
          message: {
            task: { name: "", task_id: "", key: 1 },
            times_id: "",
            started_at: 0,
          },
        },
      };
    } catch (err) {
      console.log(err);
      return { status: 500, data: { message: "Internal Server Error." } };
    }
  }
}
