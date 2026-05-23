import {
  Image,
  mainloop,
  WindowCanvas,
} from "https://deno.land/x/dwm@0.3.4/ext/canvas.ts";
import { genPlayImage } from "../src/nowPlayGen.ts";

const renderImg: Image = new Image();

// TODO: make this actually run the main loop

async function run() {
  const canvas = new WindowCanvas({
    title: "Last.fm Rich Presence",
    width: 350,
    height: 100,
    resizable: false,
  });

  canvas.onDraw = (ctx) => {
    ctx.drawImage(renderImg, 0, 0);
  };

  await mainloop(async () => {
    renderImg.src = await genPlayImage(false);
    canvas.draw();
  });
}

if (import.meta.main) await run();
