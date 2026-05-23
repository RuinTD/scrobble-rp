import * as z from "zod";
import ConfigV4 from "./V4.ts";

export const OtherConfig = z.object({
  any: z.boolean().default(false),
  listening: z.boolean().default(false),
  custom: z.array(z.string().regex(/^\d+$/).max(20)).default([]),
});

export const ButtonType = z
  .enum(["song", "artist", "profile", "github", "none"])
  .default("none");
export type ButtonType = z.infer<typeof ButtonType>;

export const check = z.object({ _VERSION: z.literal(3) });
export const ConfigV3 = z.object({
  _VERSION: z.literal(3),
  lastFmUsername: z
    .string()
    .regex(/^[A-Za-z][\w-]+$/)
    .min(2)
    .max(15),

  smallImage: z.enum(["lastfm", "profile", "none"]).default("none"),

  button1: ButtonType,
  button2: ButtonType,

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
});
export default ConfigV3;

export const migrate = ConfigV3.transform((config) =>
  ConfigV4.decode({
    ...config,
    _VERSION: 4,
    provider: "lastfm",
    username: config.lastFmUsername,
    smallImage: config.smallImage == "lastfm" ? "logo" : config.smallImage,
    button1: config.button1 == "artist" ? "none" : config.button1,
    button2: config.button2 == "artist" ? "none" : config.button2,
  })
);
