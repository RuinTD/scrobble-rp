import config, { clientID } from "./config/index.ts";
import { ActivityType, getLanyard, LanyardActivity } from "./lanyard.ts";

async function getUserActivities(): Promise<LanyardActivity[]> {
  const res = await getLanyard();
  return res?.activities || [];
}

export async function hasOtherActivity(): Promise<LanyardActivity | undefined> {
  const { disableOnPresence: opts } = config;

  const activities = (await getUserActivities()).filter(
    (v) => v.application_id != clientID && v.id != "custom",
  );

  const custom = (opts.custom || []).map((v) => v.trim().toLowerCase());
  return activities.find(
    (v) =>
      opts.any ||
      (opts.listening && v.type == ActivityType.Listening) ||
      (v.application_id && custom.includes(v.application_id)) ||
      custom.includes(v.name.trim().toLowerCase()),
  );
}
