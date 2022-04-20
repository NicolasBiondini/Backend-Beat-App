import { Request, Response } from "express";
import { User } from "../models/user";
import config from "../config/config";

export const handleLogout = async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(204);

  const refreshToken = cookies.jwt;

  const user = new User();
  //find user on DB where has the same refresh token

  const data = await user.checkDBRefreshToken(refreshToken);

  if (!data) {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.sendStatus(204);
  }

  //if(!user) return res.sendStatus(403) // forbiden

  if (data) {
    await user.deleteRefreshToken(refreshToken);

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.sendStatus(204);
  }

  // delete DB refreshToken
  // secure: true | If we are on servers HTTPS
  // res.clearCookie('jwt', {httpOnly: true,  maxAge: 24*60*60*1000}))
};
