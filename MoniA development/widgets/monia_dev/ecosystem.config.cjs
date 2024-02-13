module.exports = {
  apps : [{
    name: "MoniADev",
    script: "npm",
    args: "start",
    ignore_watch: ['node_modules'],
    env: {
      NODE_ENV: "development",
    }
  }]
}