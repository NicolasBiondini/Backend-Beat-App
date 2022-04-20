import { Request, Response, NextFunction } from "express";
import { User, message } from "../models/user";
import { pool } from "../database";
import { Tasks } from "../models/tasks";

export const homeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid } = req.body;
  if (person_uid === undefined || person_uid === null) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const user = new User();

  const getData = await user.checkDBWithPersonUid(person_uid);

  /**
   * Response type:
   * 
    {
      "message": "data ",
      "data": [
        {
          "person_uid": "061a6964-54bd-4f73-8c59-3c2e349a0fb9",
          "user_name": "test555",
          "task_id": "f65d3827-f746-4e98-b819-013ae7a39adb",
          "task_name": "Study"
        }
      ]
    }
   */

  res.status(getData.status).send(getData.message);
  return next();
};

type dashboardData = {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  pointStyle: string;
  pointRadius: number;
  pointHoverRadius: number;
};

type dashboardResponse = {
  status: number;
  message: string;
  data: {
    labels: string[];
    datasets: dashboardData[];
  };
};

const orderWeekDays = () => {
  const allDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let actualDay = new Date().getDay();

  let firstOrder = allDays.splice(0, actualDay + 1);

  return allDays.concat(firstOrder);
};

const mainDashboardGetData = async (
  person_uid: string
): Promise<dashboardResponse> => {
  // Order the week days
  const weekDays = orderWeekDays();
  let task_id1: string | null = "";
  let task_id2: string | null = "";
  let task_id3: string | null = "";

  try {
    const response = await pool.query(
      "SELECT selected_task_one,selected_task_two, selected_task_three FROM users WHERE person_uid = $1 ",
      [person_uid]
    );

    task_id1 = response.rows[0].selected_task_one;
    task_id2 = response.rows[0].selected_task_two;
    task_id3 = response.rows[0].selected_task_three;
  } catch (error) {
    console.log(error);
  }

  // Make the query to filter only those three tasks
  let taskQuery = "";

  if (task_id1) {
    if (task_id2) {
      if (task_id3) {
        taskQuery = `AND (task_name='${task_id1}' OR task_name='${task_id2}' OR task_name='${task_id3}')`;
      } else {
        taskQuery = `AND (task_name='${task_id1}' OR task_name='${task_id2}')`;
      }
    } else {
      taskQuery = `AND task_name='${task_id1}'`;
    }
  } else {
    taskQuery = "";
    return {
      status: 200,
      message: "no data.",
      data: {
        labels: weekDays,
        datasets: [
          {
            label: "hola",
            data: [1, 3, 4, 2, 15, 8, 2],
            borderColor: "rgba(255, 99, 132, 0.5)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            pointStyle: "circle",
            pointRadius: 10,
            pointHoverRadius: 15,
          },
        ],
      },
    };
  }

  // The day to compare and search by the past 7 days
  let day = +new Date().getTime();
  let actualDayOfTheWeek = new Date().getDay();
  try {
    const response = await pool.query(
      `SELECT finished_at,task_name, time, TO_TIMESTAMP(finished_at / 1000), (extract(isodow from TO_TIMESTAMP(finished_at / 1000))) AS dayoftheweek FROM times LEFT JOIN tasks ON tasks.person_uid = $1 WHERE times.task_id = tasks.task_id AND TO_TIMESTAMP(finished_at / 1000) >= TO_TIMESTAMP($2) - INTERVAL '6 days' ${taskQuery} ORDER BY finished_at ASC`,
      [person_uid, day / 1000]
    );

    let dataTasks = {};
    let dataTime = {};
    // Sunday it's day 0 for JS and for Postgres
    // I just find the actual day, and order the arrays

    dataTasks[task_id1] = {
      label: task_id1,
      data: [],
      borderColor: "rgba(247, 37, 133, 0.5)",
      backgroundColor: "rgba(247, 37, 133, 0.5)",
      pointStyle: "circle",
      pointRadius: 10,
      pointHoverRadius: 15,
    };
    if (task_id2) {
      dataTasks[task_id2] = {
        label: task_id2,
        data: [],
        borderColor: "rgba(114, 9, 183, 0.5)",
        backgroundColor: "rgba(114, 9, 183, 0.5)",
        pointStyle: "circle",
        pointRadius: 10,
        pointHoverRadius: 15,
      };
    }
    if (task_id3) {
      dataTasks[task_id3] = {
        label: task_id3,
        data: [],
        borderColor: "rgba(72, 12, 168, 0.5)",
        backgroundColor: "rgba(72, 12, 168, 0.5)",
        pointStyle: "circle",
        pointRadius: 10,
        pointHoverRadius: 15,
      };
    }

    response.rows.forEach((row) => {
      if (!dataTasks[row.task_name]) {
        dataTasks[row.task_name] = {
          label: row.task_name,
          data: [],
          borderColor: "rgba(255, 99, 132, 0.5)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          pointStyle: "circle",
          pointRadius: 10,
          pointHoverRadius: 15,
        };
      }
      if (!dataTime[row.dayoftheweek]) {
        dataTime[row.dayoftheweek] = {};
        // Create dataTime object, with all the days who return the req and with the numeric values for every task made it on that day
        if (!dataTime[row.dayoftheweek][row.task_name]) {
          dataTime[row.dayoftheweek][row.task_name] = Number(row.time);
        } else {
          dataTime[row.dayoftheweek][row.task_name] =
            dataTime[row.dayoftheweek][row.task_name] + Number(row.time);
        }
      } else {
        if (!dataTime[row.dayoftheweek][row.task_name]) {
          dataTime[row.dayoftheweek][row.task_name] = Number(row.time);
        } else {
          dataTime[row.dayoftheweek][row.task_name] =
            dataTime[row.dayoftheweek][row.task_name] + Number(row.time);
        }
      }
    });

    Object.keys(dataTasks).forEach((task, index) => {
      //TODO:  With the index change the color of dataTasks[task].borderColor, backgroundColor, etc
      let tempData = [];
      for (let i = 0; i < 7; i++) {
        if (!dataTime[i]) {
          tempData.push(0);
        } else {
          if (!dataTime[i][task]) {
            tempData.push(0);
          } else {
            tempData.push(dataTime[i][task]);
          }
        }
      }
      let firstOrder = tempData.splice(0, actualDayOfTheWeek + 1);
      dataTasks[task].data = tempData.concat(firstOrder);
    });

    let finalData = Object.keys(dataTasks).map((task) => dataTasks[task]);

    return {
      status: 200,
      message: "data ok.",
      data: {
        labels: weekDays,
        datasets: finalData,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      status: 200,
      message: "no data.",
      data: {
        labels: weekDays,
        datasets: [
          {
            label: "hola",
            data: [1, 3, 4, 2, 5, 8, 2],
            borderColor: "rgba(255, 99, 132, 0.5)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            pointStyle: "circle",
            pointRadius: 10,
            pointHoverRadius: 15,
          },
        ],
      },
    };
  }
};

export const mainDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid } = req.body;
  if (!person_uid) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const dashboardData = await mainDashboardGetData(person_uid);

  res
    .status(dashboardData.status)
    .send({ data: dashboardData.data, message: dashboardData.message });
  return next();
};

const getGoalsFromDB = async (person_uid: string) => {
  try {
    const getTasks = await pool.query(
      "SELECT goal_task_one, goal_task_two FROM users WHERE person_uid = $1",
      [person_uid]
    );

    let { goal_task_one, goal_task_two } = getTasks.rows[0];

    if (!goal_task_one) {
      return {
        status: 200,
        message: {
          message: "fail.",
          data: [
            {
              percentage: 0,
              graph: {
                labels: ["Done", "Goal"],
                datasets: [
                  {
                    label: "no task",
                    data: [1, 10],
                    backgroundColor: ["#F72585", "red"],
                  },
                ],
              },
            },
          ],
        },
      };
    } else {
      const response = await pool.query(
        "SELECT task_name, (goal - total_time) as goal, total_time,round( CAST(float8 (total_time/goal *100) as numeric), 2) as done FROM tasks WHERE person_uid = $1 AND (task_name = $2 OR task_name = $3)",
        [person_uid, goal_task_one, goal_task_two]
      );

      let realData = [];

      if (response.rows.length > 0) {
        response.rows.forEach((task) => {
          let { task_name, total_time, goal, done } = task;

          let data = {
            percentage: done,
            graph: {
              labels: ["Done", "Goal"],
              datasets: [
                {
                  label: task_name,
                  data: [total_time, Number(goal) <= 0 ? 0 : goal],
                  backgroundColor: [
                    Number(goal) <= 0 ? "#56CFE1" : "#4895EF",
                    "#F72585",
                  ],
                },
              ],
            },
          };
          realData.push(data);
        });
        return {
          status: 200,
          message: { message: "correct.", data: realData },
        };
      } else {
        return {
          status: 404,
          message: {
            message: "fail.",
            data: [
              {
                percentage: 0,
                graph: {
                  labels: ["Done", "Goal"],
                  datasets: [
                    {
                      label: "no task",
                      data: [1, 10],
                      backgroundColor: ["green", "red"],
                    },
                  ],
                },
              },
            ],
          },
        };
      }
    }

    /**
     * 
     * FRONTED: 
       const data = {
    labels: ["Done", "All"],
    datasets: [
      {
        label: "Dataset 1",
        data: [1, 10],
        backgroundColor: ["green", "red"],
      },
    ],
  };     
     */
  } catch (error) {
    console.log(error);
    return {
      status: 400,
      message: {
        message: "fail.",
        data: [
          {
            percentage: 0,
            graph: {
              labels: ["Done", "Goal"],
              datasets: [
                {
                  label: "no task",
                  data: [1, 10],
                  backgroundColor: ["green", "red"],
                },
              ],
            },
          },
        ],
      },
    };
  }
};

export const getGoalsMainDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid } = req.body;
  if (!person_uid) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const goalsData = await getGoalsFromDB(person_uid);

  res.status(goalsData.status).send(goalsData.message);
  return next();
};

export const firstTask = async (
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

  const task = new Tasks(task_name, person_uid);

  const response = await task.createTask();

  const tasks = await user.howManyTasks(person_uid);

  if (response.status === 200) {
    if (tasks === 1) {
      await user.selectedTasksConfig(person_uid, task_name);
      await user.selectedGoalTasks(person_uid, task_name);
      await user.selectMonthTasks(person_uid, task_name);
      await user.selectYearTasks(person_uid, task_name);
      await user.selectGoalTaskDashboard(person_uid, task_name);
    }
    if (tasks === 2) {
      await user.selectedTasksConfig(person_uid, null, task_name);
      await user.selectedGoalTasks(person_uid, null, task_name);
    }
    if (tasks === 3) {
      await user.selectedTasksConfig(person_uid, null, null, task_name);
    }
  }

  res.status(response.status).send({ message: "All ok." });
  return next();
};
