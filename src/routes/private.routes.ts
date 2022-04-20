import { Router } from "express";
import {
  dashboardController,
  monthGraphRefresh,
} from "../controllers/dashboard.controller";
import {
  settingsController,
  setGoalController,
} from "../controllers/setting.controller";
import {
  setSelectedTask,
  setGoalsMainTasks,
  setSelectedMonthTask,
  setSelectedYearTask,
  setSelectedGoalTaskDashboard,
} from "../controllers/users.controllers";
import {
  getTasks,
  createTask,
  createTimeTask,
  finishTimeTask,
  getActiveTimeTask,
} from "../controllers/tasks.controller";
import {
  homeController,
  mainDashboardData,
  getGoalsMainDashboard,
  firstTask,
} from "../controllers/home.controller";

const router = Router();

// Home page routes
router.post("/home", homeController);
router.post("/firsttask", firstTask);
router.post("/mainDashboard", mainDashboardData);
router.post("/goalscharts", getGoalsMainDashboard);

// Tasks routes
router.post("/tasks", getTasks);
router.post("/createtask", createTask);
router.post("/createnewtimetask", createTimeTask);
router.put("/finishtask", finishTimeTask);
router.post("/getActiveTimeTask", getActiveTimeTask);

// Settings routes
router.post("/settings", settingsController);
router.put("/setgoal", setGoalController);

// Dashboard
router.post("/dashboard", dashboardController);
router.post("/refreshgraph", monthGraphRefresh);

// User prefferences
router.put("/setSelectedTasks", setSelectedTask);
router.put("/setgoalmaintasks", setGoalsMainTasks);
router.put("/setmonthtask", setSelectedMonthTask);
router.put("/setyeartask", setSelectedYearTask);
router.put("/setgoaltaskdashboard", setSelectedGoalTaskDashboard);

export default router;
