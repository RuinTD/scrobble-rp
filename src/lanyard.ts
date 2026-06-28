import chalk from "chalk";
import { getLogger } from "./lib/logger.ts";
import $ from "dax";
import { ActivityType } from "discord-api-types/v10";
import { z } from "zod/v4";
import { getDiscordUser } from "./discord.ts";
import { noop, once } from "es-toolkit";

const log = getLogger(chalk.hex("#d7bb87")("Lanyard"));

export { ActivityType };

const Snowflake = z.string();

export const LanyardActivity = z.object({
  id: Snowflake,
  name: z.string(),
  type: z.enum(ActivityType),
  application_id: Snowflake.optional(),
});
export type LanyardActivity = z.infer<typeof LanyardActivity>;

export const LanyardData = z.object({
  discord_user: z.object({ id: Snowflake }),
  activities: z.array(LanyardActivity),
  listening_to_spotify: z.boolean(),
});
export type LanyardData = z.infer<typeof LanyardData>;

enum LanyardWSOpcodes {
  Event = 0,
  Hello = 1,
  Initialize = 2,
  Heartbeat = 3,
}

const LanyardWSInitState = z.object({
  op: z.literal(LanyardWSOpcodes.Event),
  t: z.literal("INIT_STATE"),
  d: z.union([LanyardData, z.record(Snowflake, LanyardData)]),
});

const LanyardWSPresenceUpdate = z.object({
  op: z.literal(LanyardWSOpcodes.Event),
  t: z.literal("PRESENCE_UPDATE"),
  d: LanyardData,
});

const LanyardWSHello = z.object({
  op: z.literal(LanyardWSOpcodes.Hello),
  d: z.object({
    heartbeat_interval: z.number(),
  }),
});

const LanyardWSMsg = z.union([
  LanyardWSHello,
  LanyardWSInitState,
  LanyardWSPresenceUpdate,
]);

let ws: WebSocket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
const connectIDs = new Set<string>();
const lanyardCache = new Map<string, LanyardData>();

let initPromise: Promise<void> = Promise.resolve();
let resolveInitSignal: () => void = noop;

function resetInitSignal() {
  initPromise = new Promise((resolve) => {
    resolveInitSignal = resolve;
  });
}

const joinWarn = once(() => {
  log.error(chalk.red("Please join discord.gg/lanyard"));
});

function isData(d: unknown): d is LanyardData {
  return LanyardData.safeParse(d).success;
}

function sendSubscribe() {
  if (ws && ws.readyState == WebSocket.OPEN && connectIDs.size > 0) {
    log.debug("Subscribing to IDs:", connectIDs);
    resetInitSignal();
    ws.send(
      JSON.stringify({
        op: LanyardWSOpcodes.Initialize,
        d: { subscribe_to_ids: [...connectIDs] },
      }),
    );
  }
}

function connect() {
  if (
    ws &&
    (ws.readyState == WebSocket.CONNECTING || ws.readyState == WebSocket.OPEN)
  ) {
    return;
  }

  ws = new WebSocket("wss://api.lanyard.rest/socket");

  ws.onopen = () => {
    log.info(chalk.bold.green("Connected!"));
    sendSubscribe();
  };

  ws.onmessage = (event) => {
    try {
      const obj = JSON.parse(event.data);
      log.debug("Received:", obj);

      const msg = LanyardWSMsg.parse(obj);
      switch (msg.op) {
        case LanyardWSOpcodes.Event: {
          let { d } = msg;
          if (msg.t === "INIT_STATE") {
            lanyardCache.clear();
          }
          if (isData(d)) {
            d = { [d.discord_user.id]: d };
          }
          for (const [userID, data] of Object.entries(d)) {
            lanyardCache.set(userID, data);
          }
          if (msg.t === "INIT_STATE") {
            resolveInitSignal();
          }
          break;
        }
        case LanyardWSOpcodes.Hello: {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          const interval = msg.d.heartbeat_interval;
          heartbeatTimer = setInterval(() => {
            if (ws && ws.readyState == WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: LanyardWSOpcodes.Heartbeat }));
            }
          }, interval);
          break;
        }
      }
    } catch (err) {
      log.error("Failed to process WS message:", err);
    }
  };

  ws.onclose = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    log.warn(chalk.red("Disconnected!"));
  };

  ws.onerror = (e) => {
    log.error(chalk.red("WebSocket Error:"), e);
  };
}

async function addID(id: string) {
  const isNew = !connectIDs.has(id);
  connectIDs.add(id);
  connect();

  if (isNew) {
    while (!ws || ws.readyState !== WebSocket.OPEN) {
      await $.sleep(50);
    }
    sendSubscribe();
  }
}

export async function getLanyard() {
  const { id } = await getDiscordUser();
  await addID(id);
  await initPromise;

  const ret = lanyardCache.get(id);
  if (!ret) joinWarn();
  return ret;
}
