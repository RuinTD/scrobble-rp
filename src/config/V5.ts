import * as z from "zod";
import { ButtonType, OtherConfig, Provider } from "./V4.ts";

import ConfigV6 from "./V6.ts";
export { ButtonType, OtherConfig, Provider };

export const check = z.object({ _VERSION: z.literal(5) });
export const ConfigV5 = z.object({
  _VERSION: z.literal(5),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  button1: ButtonType,
  button2: ButtonType,

  useNintendoMusicArt: z.boolean().default(true),

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
export default ConfigV5;

export const migrate = ConfigV5.transform((config) =>
  ConfigV6.decode({
    ...config,
    _VERSION: 6,
    useNintendoMusicFormat: false,
  })
);
