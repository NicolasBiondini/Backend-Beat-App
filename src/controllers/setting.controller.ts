import { Request, Response, NextFunction } from "express";
import { User, message } from "../models/user";
import { pool } from "../database";
import { Tasks } from "../models/tasks";

const getTasks = async (person_uid: string) => {
  try {
    const response = await pool.query(
      "SELECT task_name, goal FROM tasks WHERE person_uid = $1 ORDER BY task_name ASC",
      [person_uid]
    );

    return { status: 200, message: { message: "ok", data: response.rows } };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Server Error." };
  }
};

export const settingsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid } = req.body;
  if (person_uid === undefined || person_uid === null) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const getData = await getTasks(person_uid);

  res.status(getData.status).send(getData.message);
  return next();
};

// Change Task Goal

export const setGoalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid, task_name, newGoal } = req.body;
  if (!person_uid || !task_name || !newGoal) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const task = new Tasks();

  const getData = await task.changeGoal(person_uid, task_name, newGoal);

  res.status(getData.status).send(getData.message);
  return next();
};
