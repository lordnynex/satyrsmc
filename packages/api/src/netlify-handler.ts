import "reflect-metadata";
import serverless from "serverless-http";
import { getDbInstance } from "./db/dbAdapter";
import { getDataSource } from "./db/dataSource";
import { createApi } from "./services/api";
import { createExpressApp } from "./server";

let cachedHandler: serverless.Handler | undefined;

async function getHandler(): Promise<serverless.Handler> {
  if (!cachedHandler) {
    const db = await getDbInstance();
    const ds = await getDataSource();
    const api = createApi(db, ds);
    const app = createExpressApp({ api });
    cachedHandler = serverless(app);
  }
  return cachedHandler;
}

export const handler: serverless.Handler = async (event, context) => {
  const fn = await getHandler();
  return fn(event, context);
};
