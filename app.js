const express = require("express");
const redis = require("redis");
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var client = redis.createClient({
  host: "eu1-poetic-foal-31430.upstash.io",
  port: "31430",
  password: "421e104b21a54ebf8cc89476538104e2",
});

client.on("error", function (err) {
  throw err;
});

function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

/*app.get("/api", (req, res, next) => {
  var key = req.query["api-key"];

  if (!key) return next(error(400, "api key required"));

  if (!~apiKeys.indexOf(key)) return next(error(401, "invalid api key"));

  req.key = key;
  next();
});*/

app.param("boardid", function (req, res, next, boardid) {
  if (!boardid) return next(error(400, "board id required"));

  client.lrange(req.query["api-key"], 0, -1, function (err, reply) {
    if (!reply)
      return next(error(400, "API key ile ilişkili board bulunamadı"));
    if (!~reply.indexOf(boardid)) next(error(400, "Bu boarda erişiminiz yok."));
  });

  next();
});

app.get("/api/getallscores/:boardid/", function (req, res) {
  client.zrange(req.params.boardid, 0, -1, "WITHSCORES", function (err, reply) {
    if (err) throw err;
    res.send(reply);
  });
});

app.post("/api/storescore/:boardid/", function (req, res) {
  var userName = req.body.userName;
  var userScore = req.body.userScore;

  client.zadd(
    req.params.boardid,
    parseFloat(userScore),
    userName,
    function (err, reply) {
      if (err) throw err;
      res.send(reply > 0 ? "Başarıyla eklendi." : "Eklenemedi");
    }
  );
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
