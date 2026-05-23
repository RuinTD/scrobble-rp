import * as z from "zod";
import ConfigV5 from "./V5.ts";

export const Provider = z.enum(["lastfm", "listenbrainz"]);

export const OtherConfig = z.object({
  any: z.boolean().default(false),
  listening: z.boolean().default(false),
  custom: z.array(z.string('"" are required for app IDs')).default([]),
});

export const ButtonType = z
  .enum(["song", "profile", "github", "none"])
  .default("none");
export type ButtonType = z.infer<typeof ButtonType>;

export const check = z.object({ _VERSION: z.literal(4) });
export const ConfigV4 = z.object({
  _VERSION: z.literal(4),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  button1: ButtonType,
  button2: ButtonType,

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
export default ConfigV4;

export const migrate = ConfigV4.transform((config) =>
  ConfigV5.decode({
    ...config,
    _VERSION: 5,
    useNintendoMusicArt: false,
  })
);
