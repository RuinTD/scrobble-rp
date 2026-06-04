import * as z from "zod";
import { ButtonType, OtherConfig, Provider } from "./V7.ts";

import ConfigV9 from "./V9.ts";
export { ButtonType, OtherConfig, Provider };

export const check = z.object({ _VERSION: z.literal(8) });
export const ConfigV8 = z.object({
  _VERSION: z.literal(8),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  showElapsedTime: z.boolean().default(false),
  showRemainingTime: z.boolean().default(false),

  button1: ButtonType.default("none"),
  button2: ButtonType.default("none"),

  useNintendoMusicArt: z.boolean().default(false),
  useNintendoMusicFormat: z.boolean().default(false),

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
export default ConfigV8;

export const migrate = ConfigV8.transform((config) =>
  ConfigV9.decode({
    ...config,
    _VERSION: 9,
    nintendoMusic: {
      useSongArt: config.useNintendoMusicArt,
      formatSplatoonArtist: config.useNintendoMusicFormat,
    },
  })
);
