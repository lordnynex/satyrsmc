import { initTRPC } from "@trpc/server";
import type { TRPCPanelMeta } from "trpc-ui";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().meta<TRPCPanelMeta>().create();
