import * as z from "zod";
import { OtherConfig, Provider } from "./V6.ts";
export { OtherConfig, Provider };
import ConfigV8 from "./V8.ts";

export const ButtonType = z.enum([
  "song",
  "songlink",
  "song-lastfm",
  "song-listenbrainz",
  "song-musicbrainz",
  "profile",
  "github",
  "none",
]);
export type ButtonType = z.infer<typeof ButtonType>;

export const check = z.object({ _VERSION: z.literal(7) });
export const ConfigV7 = z.object({
  _VERSION: z.literal(7),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),
  showDuration: z.boolean().default(false),

  button1: ButtonType.default("none"),
  button2: ButtonType.default("none"),

  useNintendoMusicArt: z.boolean().default(false),
  useNintendoMusicFormat: z.boolean().default(false),

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
export default ConfigV7;

export const migrate = ConfigV7.transform((config) =>
  ConfigV8.decode({
    ...config,
    _VERSION: 8,
    showElapsedTime: true,
    showRemainingTime: config.showDuration,
  })
);
