import { Request, Response, NextFunction } from "express";
import { User, message } from "../models/user";
import { Times } from "../models/times";
import { Tasks } from "../models/tasks";

// Create a task name into the DB

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.task_name || !req.body.person_uid) {
    res.status(400).json({ message: "Please, send the correct data." });
    return next();
  }

  const { task_name, person_uid } = req.body;

  const task = new Tasks(task_name, person_uid);

  const taskCreated = await task.createTask();

  res.status(taskCreated.status).send(taskCreated.message);
  return next();
};

//Create Time Task on the DB

export const createTimeTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.task_id || !req.body.person_uid || !req.body.started_at) {
    res.status(400).json({ message: "Please, send the correct data." });
    return next();
  }

  const { task_id, person_uid, started_at } = req.body;
  const time = new Times(task_id, person_uid, started_at);

  const data = await time.pushTimesIntoDB();

  res.status(data.status).send(data.message);
  return next();
};

//Finish Time Task on the DB

export const finishTimeTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.body.times_id ||
    !req.body.finished_at ||
    !req.body.minutes ||
    !req.body.task_id
  ) {
    res.status(400).json({ message: "Please, send the correct data." });
    return next();
  }

  const { times_id, finished_at, minutes, task_id } = req.body;
  const time = new Times();

  const data = await time.finishTimes(times_id, finished_at, minutes, task_id);

  res.status(data.status).send(data.message);
  return next();
};

// Get the last Times of Tasks

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid, page } = req.body;
  if (!person_uid || !page) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const times = new Times();
  const tasksData = await times.getTheLastsTimes(person_uid, page);
  res.status(tasksData.status).send(tasksData.data);
  return next();
};

// Find if there is a task ACTIVE

export const getActiveTimeTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid } = req.body;
  if (person_uid === undefined || person_uid === null) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const times = new Times();
  const tasksData = await times.getActiveTimeTask(person_uid);
  res.status(tasksData.status).send(tasksData.data);
  return next();
};
