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
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];

  let data = await jwt.verify(
    token,
    config.jwtSecret,
    async (err, decoded: JwtPayload) => {
      // Invalid token, res 403.
      if (err) {
        res.sendStatus(403);
        return next();
      }

      const user = new User();

      let data = await user.checkJWT(decoded.person_uid);

      return data;
    }
  );

  if (data !== null) return next();
};
