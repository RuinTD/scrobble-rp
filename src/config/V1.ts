import * as z from "zod";
import ConfigV2 from "./V2.ts";

export const OtherConfig = z.object({
  any: z.boolean().default(false),
  listening: z.boolean().default(true),
  cider: z.boolean().default(true),
  iTRP: z.boolean().default(true),
  AMPMD: z.boolean().default(true),
  custom: z.array(z.string().regex(/^\d+$/).max(20)),
});

export const check = z.object({ _VERSION: z.literal(1) });
export const ConfigV1 = z.object({
  _VERSION: z.literal(1),
  username: z
    .string()
    .regex(/^[A-Za-z][\w-]+$/)
    .min(2)
    .max(15),
  shareName: z.boolean().default(false),
  otherEnabled: z.boolean().default(true),
  other: OtherConfig.optional(),
  advanced: z.object({
    lastFmKey: z.string().optional(),
    appId: z.string().optional(),
  }),
});
export default ConfigV1;

export const migrate = ConfigV1.transform((config) =>
  ConfigV2.decode({
    _VERSION: 2,
    lastFmUsername: config.username,
    shareUsername: config.shareName,
    disableOnPresence: config.otherEnabled
      ? {
        any: config.other?.any,
        listening: config.other?.listening,
        cider: config.other?.cider,
        iTunesRP: config.other?.iTRP,
        PreMiDAppleMusic: config.other?.AMPMD,
        custom: config.other?.custom,
      }
      : undefined,
    lastFmApiKey: config.advanced.lastFmKey,
    discordClientId: config.advanced.appId,
  })
);
