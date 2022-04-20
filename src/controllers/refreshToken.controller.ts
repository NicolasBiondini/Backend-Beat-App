import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import config from "../config/config";

export const handleRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = req.cookies;

  if (!cookies.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;

  const user = new User();
  //find user on DB where has the same refresh token
  const data = await user.checkDBRefreshToken(refreshToken);

  if (!data) {
    res.sendStatus(403); // forbiden
    return next();
  }

  jwt.verify(refreshToken, config.jwtRefreshSecret, (err, decoded) => {
    // if err or user_id it's different to the token user_id
    if (err) {
      res.sendStatus(403);
      return next();
    }

    const token = user.createToken(decoded.person_uid, decoded.email);
    return res.json({ token, person_uid: decoded.person_uid });
  });
};
