import type { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import { createApp } from "../../server/app";

const appPromise = createApp();

export const handler: Handler = async (event, context) => {
  const app = await appPromise;
  const server = serverless(app, {
    basePath: "/.netlify/functions",
  });
  return server(event, context);
};
