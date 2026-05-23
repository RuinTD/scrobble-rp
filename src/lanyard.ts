import { ActivityType } from "discord-api-types/v10";
import { z } from "zod/v4";
import { getDiscordUser } from "./discord.ts";
import chalk from "chalk";
import { consola } from "consola";
import $ from "dax";

const log = consola.withTag(chalk.hex("#d7bb87")("Lanyard"));

export { ActivityType };

export const LanyardActivity = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(ActivityType),
  application_id: z.string().optional(),
});
export type LanyardActivity = z.infer<typeof LanyardActivity>;

export const LanyardData = z.object({
  discord_user: z.object({ id: z.string() }),
  activities: z.array(LanyardActivity),
  listening_to_spotify: z.boolean(),
});
export type LanyardData = z.infer<typeof LanyardData>;

const EmptyObject = z.strictObject({});
export type EmptyObject = z.infer<typeof EmptyObject>;

enum LanyardWSOpcodes {
  Event,
  Hello,
  Initalize,
  Heartbeat,
}

const LanyardWSInitState = z.object({
  op: z.literal(LanyardWSOpcodes.Event),
  t: z.literal("INIT_STATE"),
  d: z.union([LanyardData, EmptyObject, z.record(z.string(), LanyardData)]),
});
const LanyardWSPresenceUpdate = z.object({
  op: z.literal(LanyardWSOpcodes.Event),
  t: z.literal("PRESENCE_UPDATE"),
  d: LanyardData,
});
type LanyardWSPresenceUpdate = z.infer<typeof LanyardWSPresenceUpdate>;

const LanyardWSHello = z.object({
  op: z.literal(LanyardWSOpcodes.Hello),
  d: z.object({
    heartbeat_interval: z.number(),
  }),
});

const LanyardWSMsg = z.union([
  LanyardWSInitState,
  LanyardWSPresenceUpdate,
  LanyardWSHello,
]);

let lanyardCache: LanyardData | undefined;
let gotFirstData = false;
let ws: WebSocket;
const connectIDs: string[] = [];
let firstWarn = false;

function isData(d: unknown): d is LanyardData {
  return LanyardData.safeParse(d).success;
}

function isEmpty(d: unknown): d is EmptyObject {
  return EmptyObject.safeParse(d).success;
}

function connect() {
  ws = new WebSocket("wss://api.lanyard.rest/socket");

  ws.onmessage = async (event) => {
    const obj = JSON.parse(event.data);
    log.debug(obj);
    const msg = LanyardWSMsg.parse(obj);
    const { id } = await getDiscordUser();
    log.debug(msg);
    switch (msg.op) {
      case LanyardWSOpcodes.Event: {
        const { d } = msg;
        if (isEmpty(d)) {
          if (!firstWarn) {
            log.error(chalk.red("Please join discord.gg/lanyard"));
          }
          firstWarn = true;
          lanyardCache = undefined;
        } else if (isData(d)) {
          if (d.discord_user.id == id) lanyardCache = d;
        } else if (d[id]) lanyardCache = d[id];
        gotFirstData = true;
        break;
      }
      case LanyardWSOpcodes.Hello: {
        setInterval(() => {
          ws.send(JSON.stringify({ op: LanyardWSOpcodes.Heartbeat }));
        }, msg.d.heartbeat_interval);
        await addID(id);
        break;
      }
    }
  };

  ws.onopen = () => {
    log.success(chalk.bold.green("Connected!"));
  };

  ws.onclose = async () => {
    log.warn(chalk.red("Disconnected"));
    await $.sleep(5000);
    connect();
  };

  ws.onerror = async (e) => {
    log.error(chalk.red("Error"), e);
    ws.onclose = null;
    ws.close();
    await $.sleep(5000);
    connect();
  };
}
connect();

async function addID(id: string) {
  if (connectIDs.includes(id)) return;
  connectIDs.push(id);

  while (ws.readyState != WebSocket.OPEN) {
    await $.sleep(0);
  }

  gotFirstData = false;
  log.debug("subscribing", connectIDs);
  ws.send(
    JSON.stringify({
      op: LanyardWSOpcodes.Initalize,
      d: { subscribe_to_ids: connectIDs },
    }),
  );
}

export async function getLanyard() {
  while (!gotFirstData) await $.sleep(0);

  const { id } = await getDiscordUser();
  await addID(id);

  return lanyardCache;
}
