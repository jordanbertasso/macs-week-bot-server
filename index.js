const l = require("luxon");
const { createCanvas, loadImage } = require("canvas");
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

let random = "";

app.get("/week.png", (req, res) => {
    random = Math.random().toString(36).substring(7);
    res.redirect(`/image/${random}.png`);
});

app.get("/image/:random.png", (req, res) => {
    const canvas = createCanvas(50, 50);
    const ctx = canvas.getContext("2d");
    const week = l.DateTime.local().setZone("Australia/Sydney").minus({weeks: 32}).plus({days: 2}).toFormat("W");

    ctx.font = "34px Roboto";
    ctx.fillStyle = "white";
    ctx.fillText(week, 5, 35);
    console.log(week);

    res.set("Cache-Control", "no-store");
    res.set("Expires", "0");
    res.end(canvas.toBuffer(), "binary");
});

app.listen(port, "0.0.0.0", () =>
    console.log(`listening on http://localhost:${port}`)
);

