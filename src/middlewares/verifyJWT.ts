import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import config from "../config/config";
import { User } from "../models/user";

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.sendStatus(401);
  } else {
    const token = authHeader.split(" ")[1];

    let data;
    try {
      data = await jwt.verify(
        token,
        config.jwtSecret,
        async (err, decoded: JwtPayload) => {
          if (err) {
            return null;
          }

          const user = new User();

          let data = await user.checkJWT(decoded.person_uid);

          return data;
        }
      );
    } catch (error) {
      console.log(error);
      return res.sendStatus(403);
    }

    if (data !== null) return next();
    if (!data) return res.sendStatus(403);
  }
};
