module.exports = {
  apps: [
    {
      name: "souvenirs-api",
      cwd: __dirname + "/apps/api",
      script: "pnpm",
      args: "start:prod",
      env: { NODE_ENV: "production" },
    },
    {
      name: "souvenirs-web",
      cwd: __dirname + "/apps/web",
      script: "pnpm",
      args: "start",
      env: { NODE_ENV: "production" },
    },
  ],
};
