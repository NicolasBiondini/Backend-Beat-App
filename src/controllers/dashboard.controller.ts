import { Request, Response, NextFunction } from "express";
import { User, message } from "../models/user";
import { pool } from "../database";

type frontEndGraphOneData = [
  {
    labels: string[];
    datasets: [
      {
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: 1;
      }
    ];
  }
];

const getDashboardOneData = async (person_uid: string, server?: boolean) => {
  // Get the top 5 tasks on the last 30 days
  try {
    let day = +new Date().getTime();

    const response = await pool.query(
      "SELECT task_name, SUM(time) as count_total FROM times INNER JOIN tasks ON times.task_id = tasks.task_id WHERE tasks.person_uid = $1 AND TO_TIMESTAMP(finished_at / 1000) >= TO_TIMESTAMP($2) - INTERVAL '30 days' GROUP BY task_name ORDER BY count_total DESC LIMIT 6",
      [person_uid, day / 1000]
    );

    let data: frontEndGraphOneData = [
      {
        labels: [],
        datasets: [
          {
            label: "Minutes",
            data: [],
            backgroundColor: [
              "rgba(181, 23, 158, 0.5)",
              "rgba(114, 9, 183, 0.5)",
              "rgba(86, 11, 173, 0.5)",
              "rgba(72, 12, 168, 0.5)",
              "rgba(63, 55, 201, 0.5)",
              "rgba(72, 149, 239, 0.5)",
            ],
            borderColor: [
              "rgba(181, 23, 158, 0.6)",
              "rgba(114, 9, 183, 0.6)",
              "rgba(86, 11, 173, 0.6)",
              "rgba(72, 12, 168, 0.6)",
              "rgba(63, 55, 201, 0.6)",
              "rgba(72, 149, 239, 0.6)",
            ],
            borderWidth: 1,
          },
        ],
      },
    ];

    response.rows.forEach((task) => {
      data[0].labels.push(task.task_name);
      data[0].datasets[0].data.push(task.count_total);
    });

    if (server) {
      return { ok: true, data: data };
    }

    return { status: 200, message: { message: "ok", data: data } };
  } catch (error) {
    console.log(error);
    if (server) {
      return { ok: false, data: [] };
    }
    return { status: 500, message: { message: "error", data: [] } };
  }
};

const dataCards = async (person_uid: string, server?: boolean) => {
  try {
    const response = await pool.query(
      "SELECT month_task_dashboard, year_task_dashboard FROM users WHERE person_uid = $1",
      [person_uid]
    );

    const tasks = response.rows[0];

    if (
      tasks.month_task_dashboard === null ||
      tasks.year_task_dashboard === null
    ) {
      if (server) {
        return { ok: false, data: {} };
      }
      return { status: 500, message: { message: "error", data: [] } };
    }

    try {
      let month = new Date().getMonth() + 1;
      let year = new Date().getFullYear();

      const monthResponse = await pool.query(
        "SELECT SUM(time) as total_time FROM times LEFT JOIN tasks ON tasks.person_uid = $1 AND tasks.task_id = times.task_id WHERE tasks.task_name = $2 AND EXTRACT(MONTH FROM (TO_TIMESTAMP(finished_at / 1000))) = $3",
        [person_uid, tasks.month_task_dashboard, month]
      );

      const yearResponse = await pool.query(
        "SELECT SUM(time) as total_time FROM times LEFT JOIN tasks ON tasks.person_uid = $1 AND tasks.task_id = times.task_id WHERE tasks.task_name = $2 AND EXTRACT(YEAR FROM (TO_TIMESTAMP(finished_at / 1000))) = $3",
        [person_uid, tasks.year_task_dashboard, year]
      );

      let finalResponse = {
        month: {
          task: tasks.month_task_dashboard,
          minutes:
            monthResponse.rows[0].total_time === null
              ? "0"
              : monthResponse.rows[0].total_time,
        },
        year: {
          task: tasks.year_task_dashboard,
          minutes:
            yearResponse.rows[0].total_time === null
              ? "0"
              : yearResponse.rows[0].total_time,
        },
      };

      if (server) {
        return { ok: true, data: finalResponse };
      }

      return { status: 200, message: { message: "ok", data: finalResponse } };
    } catch (err) {
      console.log(err);
      if (server) {
        return { ok: false, data: {} };
      }
      return { status: 500, message: { message: "error", data: [] } };
    }
  } catch (err) {
    console.log(err);
    if (server) {
      return { ok: false, data: {} };
    }
    return { status: 500, message: { message: "error", data: [] } };
  }
};

const donutChartData = async (person_uid: string, server?: boolean) => {
  try {
    const response = await pool.query(
      "SELECT goal_task_dashboard FROM users WHERE person_uid = $1",
      [person_uid]
    );

    const tasks = response.rows[0];

    if (!tasks.goal_task_dashboard) {
      if (server) {
        return { ok: false, data: [] };
      }
      return { status: 500, message: { message: "error", data: [] } };
    }

    try {
      const response = await pool.query(
        "SELECT task_name, (goal - total_time) as goal, total_time,round( CAST(float8 (total_time/goal *100) as numeric), 2) as done FROM tasks WHERE person_uid = $1 AND task_name = $2",
        [person_uid, tasks.goal_task_dashboard]
      );

      let data = {
        percentage: response.rows[0].done,
        graph: {
          labels: ["Done", "Goal"],
          datasets: [
            {
              label: response.rows[0].task_name,
              data: [
                response.rows[0].total_time,
                Number(response.rows[0].goal) <= 0 ? 0 : response.rows[0].goal,
              ],
              backgroundColor: [
                Number(response.rows[0].goal) <= 0 ? "#56CFE1" : "#4895EF",
                "#F72585",
              ],
            },
          ],
        },
      };

      if (server) {
        return { ok: true, data: data };
      }

      return { status: 200, message: { message: "ok", data: data } };
    } catch (err) {
      console.log(err);
      if (server) {
        return { ok: false, data: {} };
      }
      return { status: 500, message: { message: "error", data: {} } };
    }
  } catch (err) {
    console.log(err);
    if (server) {
      return { ok: false, data: {} };
    }
    return { status: 500, message: { message: "error", data: {} } };
  }
};

const getMonthChartDashboard = async (
  person_uid: string,
  server?: boolean,
  task?: string,
  month?: number,
  year?: number
) => {
  try {
    let defaultMonth;
    let defaultYear;
    let defaultTask;
    if (!month) {
      defaultMonth = new Date().getMonth() + 1;
    } else {
      defaultMonth = month;
    }
    if (!year) {
      defaultYear = new Date().getFullYear();
    } else {
      defaultYear = year;
    }
    if (!task) {
      try {
        const response = await pool.query(
          "SELECT selected_task_one FROM users WHERE person_uid = $1",
          [person_uid]
        );

        if (!response.rows[0].selected_task_one) {
          if (server) {
            return { ok: false, data: {} };
          }
          return { status: 500, message: { message: "error", data: [] } };
        }

        defaultTask = response.rows[0].selected_task_one;
      } catch (err) {
        console.log(err);
        if (server) {
          return { ok: false, data: {} };
        }
        return { status: 500, message: { message: "error", data: [] } };
      }
    } else {
      defaultTask = task;
    }

    let taskId;

    try {
      const response = await pool.query(
        "SELECT task_id from tasks WHERE task_name = $1",
        [defaultTask]
      );

      if (!response.rows[0].task_id) {
        if (server) {
          return { ok: false, data: {} };
        }
        return { status: 500, message: { message: "error", data: [] } };
      }

      taskId = response.rows[0].task_id;
    } catch (err) {
      console.log(err);
      return { status: 500, message: { message: "error", data: [] } };
    }

    const response = await pool.query(
      "SELECT time, EXTRACT(DAY FROM TO_TIMESTAMP(finished_at / 1000)) AS day_number, DATE_PART('days', DATE_TRUNC('month', TO_TIMESTAMP(finished_at / 1000)) + '1 MONTH'::INTERVAL - '1 DAY'::INTERVAL) AS total_days FROM times WHERE person_uid = $1 AND EXTRACT(MONTH FROM (TO_TIMESTAMP(finished_at / 1000))) = $3 AND EXTRACT(YEAR FROM (TO_TIMESTAMP(finished_at / 1000))) = $4 AND task_id = $2",
      [person_uid, taskId, defaultMonth, defaultYear]
    );

    let months = await getMonths(person_uid, defaultTask);

    if (response.rows.length !== 0) {
      const responseData = response.rows;

      // labels
      const arrayOfDays = [];
      // values
      const arrayOfValues = [];
      let orderDays = {};

      for (let i = 1; i <= responseData[0].total_days; i++) {
        arrayOfDays.push(i);
        orderDays[i] = 0;
      }

      responseData.forEach((task) => {
        orderDays[task.day_number] =
          orderDays[task.day_number] + Number(task.time);
      });

      Object.keys(orderDays).forEach((day) => {
        arrayOfValues.push(orderDays[day]);
      });

      if (server) {
        return {
          ok: true,
          data: {
            task: defaultTask,
            month: defaultMonth,
            months: months,
            year: defaultYear,
            data: {
              labels: arrayOfDays,
              datasets: [
                {
                  label: "Minutes",
                  data: arrayOfValues,
                  borderColor: "rgba(247, 37, 133, 0.5)",
                  backgroundColor: "rgba(247, 37, 133, 0.5)",

                  pointStyle: "circle",
                  pointRadius: 10,
                  pointHoverRadius: 15,
                },
              ],
            },
          },
        };
      }

      return {
        status: 200,
        message: {
          message: "data ok.",
          data: {
            task: defaultTask,
            month: defaultMonth,
            months: months,
            year: defaultYear,
            data: {
              labels: arrayOfDays,
              datasets: [
                {
                  label: "Minutes",
                  data: arrayOfValues,
                  borderColor: "rgba(247, 37, 133, 0.5)",
                  backgroundColor: "rgba(247, 37, 133, 0.5)",

                  pointStyle: "circle",
                  pointRadius: 10,
                  pointHoverRadius: 15,
                },
              ],
            },
          },
        },
      };
    } else {
      let daysOfMonth = new Date(defaultYear, defaultMonth, 0).getDate();
      let daysArray = [];
      let valuesArray = [];
      for (let i = 1; i <= daysOfMonth; i++) {
        daysArray.push(i);
        valuesArray.push(0);
      }

      if (server) {
        return {
          ok: true,
          data: {
            task: defaultTask,
            month: defaultMonth,
            months: months,
            year: defaultYear,
            data: {
              labels: daysArray,
              datasets: [
                {
                  label: "Minutes",
                  data: valuesArray,
                  borderColor: "rgba(247, 37, 133, 0.5)",
                  backgroundColor: "rgba(247, 37, 133, 0.5)",

                  pointStyle: "circle",
                  pointRadius: 10,
                  pointHoverRadius: 15,
                },
              ],
            },
          },
        };
      }

      return {
        status: 200,
        message: {
          message: "no data",
          data: {
            task: defaultTask,
            month: defaultMonth,
            months: months,
            year: defaultYear,
            data: {
              labels: daysArray,
              datasets: [
                {
                  label: "Minutes",
                  data: valuesArray,
                  borderColor: "rgba(247, 37, 133, 0.5)",
                  backgroundColor: "rgba(247, 37, 133, 0.5)",

                  pointStyle: "circle",
                  pointRadius: 10,
                  pointHoverRadius: 15,
                },
              ],
            },
          },
        },
      };
    }
  } catch (err) {
    console.log(err);
    if (server) {
      return { ok: false, data: {} };
    }
    return { status: 500, message: { message: "error", data: [] } };
  }
};

const getMonths = async (person_uid, task) => {
  try {
    const response = await pool.query(
      "SELECT DISTINCT ON (EXTRACT(MONTH FROM (TO_TIMESTAMP(finished_at / 1000)))) EXTRACT(MONTH FROM (TO_TIMESTAMP(finished_at / 1000))) FROM times JOIN tasks ON tasks.person_uid = $1 WHERE tasks.task_name = $2",
      [person_uid, task]
    );

    let months;
    let today = new Date().getMonth() + 1;

    if (response.rows.length !== 0) {
      months = [Number(response.rows[0].extract)];
      if (months[months.length - 1] < today) {
        for (let i = months[months.length - 1] + 1; i <= today; i++) {
          months.push(i);
        }
      }
    } else {
      months = [today];
    }

    return months;
  } catch (err) {
    let today = new Date().getMonth() + 1;
    console.log(err);
    return [today];
  }
};

export const monthGraphRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid, taskName, month } = req.body;
  if (!person_uid || !taskName || !month) {
    return res.sendStatus(401); // bad Request
  }

  const response = await getMonthChartDashboard(
    person_uid,
    false,
    taskName,
    month
  );
  res.status(response.status).send(response.message);
  return next();
};

export const dashboardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { person_uid } = req.body;
  if (!person_uid) {
    res.sendStatus(401); // bad Request
    return next();
  }

  const user = new User();

  Promise.all([
    getDashboardOneData(person_uid, true),
    dataCards(person_uid, true),
    donutChartData(person_uid, true),
    getMonthChartDashboard(person_uid, true),
    user.checkDBWithPersonUid(person_uid),
  ])
    .then((values) => {
      if (values[0].ok && values[1].ok && values[2].ok && values[3].ok) {
        let data = {
          firstDashboard: values[0].data,
          cards: values[1].data,
          donut: values[2].data,
          monthChart: values[3].data,
          tasks: values[4].message,
        };

        res.status(200).send({ message: "ok", data });
        return next();
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({ message: "Error" });
      return next();
    });
};
