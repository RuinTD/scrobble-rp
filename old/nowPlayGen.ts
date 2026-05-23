import { getLastTrack } from "./lastFm.ts";
import { DateTime } from "luxon";
import { Canvas, CanvasRenderingContext2D, Image } from "dwm";
import config from "../src/config/index.ts";
import { encodeBase64 } from "@std/encoding";

const debug = false;
const font = "sans-serif";

function getRelTime(uts: number) {
  // TODO: Figure out how to do this without luxon
  return DateTime.fromSeconds(uts).toRelative();
}

export async function genPlayText() {
  const track = await getLastTrack();
  if (!track) throw "Error: No recently played tracks";
  const { nowplaying } = track["@attr"] || {};
  let ret = "🎧 __**";
  if (!nowplaying) ret += "Now Playing**__";
  else {
    const uts = track.date?.uts || 0;
    const rel = getRelTime(uts);
    // const rel = "59 minutes ago";
    ret += `Recently Played**__ (${rel})`;
  }
  ret += `\n**${track.name}**\nby ${track.artist}`;
  return ret;
}

const lastImage = "";
export async function genPlayImage(roundBorder = true): Promise<string> {
  const canvas: Canvas = new Canvas(350, 100);
  canvas.width = 350;
  canvas.height = 100;
  await drawToCanvas(canvas.getContext("2d"), roundBorder);

  // TypeError: encodeBase64 is not a function
  // return canvas.toDataURL();

  const encoded = encodeBase64(canvas.encode());
  if (lastImage != encoded) canvas.save("nowPlaying.png");
  return `./nowPlaying.png`;
}

const bgImg = new Image();
bgImg.src = "assets/np-background.png";

const bgImgSq = new Image();
bgImgSq.src = "assets/np-background-square.png";

export async function drawToCanvas(
  ctx: CanvasRenderingContext2D,
  roundBorder = true,
) {
  const track = await getLastTrack();
  if (!track) throw "Error: No recently played tracks";
  const { nowplaying } = track["@attr"] || {};

  ctx.drawImage(roundBorder ? bgImg : bgImgSq, 0, 0);

  const albumArt = new Image();
  // albumArt.crossOrigin = "anonymous";
  albumArt.src = track.image.large || "assets/albumPlaceholder.webp";
  await new Promise((resolve) => {
    albumArt.onload = resolve;
  });

  ctx.save();
  roundImage(ctx, 5, 5, 90, 90, 10);
  ctx.clip();
  ctx.drawImage(albumArt, 5, 5, 90, 90);
  ctx.restore();

  // TODO: Add Loved indicator?

  ctx.textAlign = "center";
  ctx.fillStyle = "#404040";
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 16px " + font;
  centerText(ctx, nowplaying ? "Now Playing" : "Recently Played", 100, 25, 190);

  ctx.textAlign = "start";
  ctx.fillStyle = "black";

  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 14px " + font;
  text(ctx, track.name, 105, 55, 240);

  ctx.textBaseline = "hanging";
  ctx.fillStyle = "black";
  ctx.font = "12px " + font;
  text(ctx, "by " + track.artist, 105, 60, 240);

  ctx.fillStyle = "#808080";
  ctx.textBaseline = "alphabetic";

  ctx.font = "8px " + font;
  let last_text = nowplaying ? "Scrobbling now " : "Scrobbled ";
  last_text += config.shareUsername
    ? `as ${config.lastFmUsername}`
    : "on Last.fm";
  text(ctx, last_text, 100, 90, 150);

  if (!nowplaying) {
    const uts = track.date?.uts || 0;
    const rel = getRelTime(uts);
    ctx.textAlign = "right";
    ctx.font = "10px " + font;
    text(ctx, rel, 340, 90, 80);
  }
}

function roundImage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.closePath();
}

function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
) {
  const halfW = width / 2;
  const halfX = x + halfW;
  debug && ctx.strokeRect(x, y, width, 0);
  ctx.fillText(text, halfX, y, width);
}

function text(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width?: number,
) {
  if (debug) {
    const measure = ctx.measureText(text);
    console.log(text, measure);
    const debugY = y;
    const debugH = 1;
    const debugW = (ctx.textAlign == "right" ? -1 : 1) * (width || 1);
    ctx.strokeRect(x, debugY, debugW, debugH);
  }
  ctx.fillText(text, x, y, width);
}
