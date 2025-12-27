import serverless from "serverless-http";
import { createApp } from "../../server/app";

const app = await createApp();

export const handler = serverless(app, {
  basePath: "/.netlify/functions",
});
