import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import privateRoutes from "./routes/private.routes";
import { verifyJWT } from "./middlewares/verifyJWT";
import config from "./config/config";

// initializations
const app = express();

/**
 * 
 * dev:
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000/");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Pass to next layer of middleware
  return next();
});
 */
// settings
app.set("port", config.port || 4000);

// middlwares
app.use(morgan("dev"));
app.use(cors({ origin: "https://www.beatapp.live/" }));
// { origin: "http://localhost:3000" } dev
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// routes
app.use(authRoutes);

//middelware of JWT
app.use("/private", verifyJWT);

app.use("/private", privateRoutes);

app.listen(app.get("port"), () => {
  console.log(`App listening on port ${app.get("port")}`);
});
