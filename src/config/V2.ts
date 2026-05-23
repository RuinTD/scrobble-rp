import * as z from "zod";
import ConfigV3 from "./V3.ts";

export const OtherConfig = z.object({
  any: z.boolean().default(false),
  listening: z.boolean().default(true),
  cider: z.boolean().default(true),
  iTunesRP: z.boolean().default(true),
  PreMiDAppleMusic: z.boolean().default(true),
  custom: z.array(z.string().regex(/^\d+$/).max(20)).optional(),
});

export const check = z.object({ _VERSION: z.literal(2) });
export const ConfigV2 = z.object({
  _VERSION: z.literal(2),
  lastFmUsername: z
    .string()
    .regex(/^[A-Za-z][\w-]+$/)
    .min(2)
    .max(15),
  shareUsername: z.boolean().default(false),
  disableOnPresence: OtherConfig.optional(),
  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
});
export default ConfigV2;

export const migrate = ConfigV2.transform((config) =>
  ConfigV3.decode({
    ...config,
    _VERSION: 3,
    smallImage: config.shareUsername ? "profile" : "lastfm",
    button1: "song",
    button2: config.shareUsername ? "profile" : "none",
  })
);
