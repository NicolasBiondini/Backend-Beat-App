export default {
  jwtSecret: process.env.JWT_SECRET || "somesecrettoken",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "refreshtokenmorelong",
  DB: {
    user: process.env.USER || "nbiondini",
    host: process.env.HOST || "localhost",
    password: process.env.PASSWORD || "nicolasbiondinipassword",
    database: process.env.DATABASE || "azure-project",
    port: process.env.PORT || 5432,
  },
};
