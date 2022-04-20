import { Request, Response, NextFunction } from "express";

import { User, message } from "../models/user";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.user_name || !req.body.email || !req.body.password) {
    res.status(400).json({ message: "Please, send your email and password." });
    return next();
  }
  const { user_name, email, password } = req.body;
  try {
    const user = new User(user_name, email, password);
    let message = await user.createNewUser();
    res.status(message.status).json(message.message);
    return next();
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error.");
    return next();
  }
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ message: "Please, send your email and password." });
  }

  const user = new User();
  const message: message = await user.comparePassword(
    req.body.email,
    req.body.password
  );

  if (message.status === 200) {
    res.cookie("jwt", message.refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  return res.status(message.status).json(message.message);
};

export const setSelectedTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid, task_id1, task_id2, task_id3 } = req.body;
  if (person_uid === undefined || person_uid === null) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const user = new User();

  const response = await user.selectedTasksConfig(
    person_uid,
    task_id1,
    task_id2,
    task_id3
  );

  res.status(response.status).send(response.message);
  return next();
};

export const setGoalsMainTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid, task_id1, task_id2 } = req.body;
  if (!person_uid || !task_id1) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const user = new User();

  const response = await user.selectedGoalTasks(person_uid, task_id1, task_id2);

  res.status(response.status).send(response.message);
  return next();
};

export const setSelectedMonthTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid, task_name } = req.body;
  if (!person_uid || !task_name) {
    res.sendStatus(401); // bad Request
    return next();
  }
  const user = new User();

  const response = await user.selectMonthTasks(person_uid, task_name);

  res.status(response.status).send(response.message);
  return next();
};

export const setSelectedYearTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid, task_name } = req.body;
  if (!person_uid || !task_name) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const user = new User();

  const response = await user.selectYearTasks(person_uid, task_name);

  res.status(response.status).send(response.message);
  return next();
};

export const setSelectedGoalTaskDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid, task_name } = req.body;
  if (!person_uid || !task_name) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const user = new User();

  const response = await user.selectGoalTaskDashboard(person_uid, task_name);

  res.status(response.status).send(response.message);
  return next();
};
