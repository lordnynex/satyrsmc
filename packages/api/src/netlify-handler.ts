import "reflect-metadata";
import serverlessExpress from "@vendia/serverless-express";
import { getDbInstance } from "./db/dbAdapter";
import { getDataSource } from "./db/dataSource";
import { createApi } from "./services/api";
import { createExpressApp } from "./server";

let cachedHandler: ReturnType<typeof serverlessExpress> | undefined;

async function getHandler() {
  if (!cachedHandler) {
    const db = await getDbInstance();
    const ds = await getDataSource();
    const api = createApi(db, ds);
    const app = createExpressApp({ api });
    cachedHandler = serverlessExpress({ app });
  }
  return cachedHandler;
}

export const handler = async (event: unknown, context: unknown) => {
  const fn = await getHandler();
  return fn(event, context);
};
