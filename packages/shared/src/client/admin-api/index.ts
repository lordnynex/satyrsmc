import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTrpcClient } from "../trpcClientContext";
import type { TrpcClient } from "../trpc";
import { EventsApiClient } from "./EventsApiClient";
import { BudgetsApiClient } from "./BudgetsApiClient";
import { MembersApiClient } from "./MembersApiClient";
import { ScenariosApiClient } from "./ScenariosApiClient";
import { ContactsApiClient } from "./ContactsApiClient";
import { MailingListsApiClient } from "./MailingListsApiClient";
import { MailingBatchesApiClient } from "./MailingBatchesApiClient";
import { QrCodesApiClient } from "./QrCodesApiClient";
import { MeetingsApiClient } from "./MeetingsApiClient";
import { MeetingTemplatesApiClient } from "./MeetingTemplatesApiClient";
import { DocumentsApiClient } from "./DocumentsApiClient";
import { CommitteesApiClient } from "./CommitteesApiClient";
import { WebsiteApiClient } from "./WebsiteApiClient";
import { IncidentsApiClient } from "./IncidentsApiClient";

export type { TrpcClient } from "../trpc";

export type Api = ReturnType<typeof buildApi>;

export function buildApi(client: TrpcClient) {
  return {
    events: new EventsApiClient(client),
    budgets: new BudgetsApiClient(client),
    members: new MembersApiClient(client),
    scenarios: new ScenariosApiClient(client),
    contacts: new ContactsApiClient(client),
    mailingLists: new MailingListsApiClient(client),
    mailingBatches: new MailingBatchesApiClient(client),
    qrCodes: new QrCodesApiClient(client),
    meetings: new MeetingsApiClient(client),
    meetingTemplates: new MeetingTemplatesApiClient(client),
    documents: new DocumentsApiClient(client),
    committees: new CommitteesApiClient(client),
    website: new WebsiteApiClient(client),
    incidents: new IncidentsApiClient(client),
  };
}

const ApiContext = createContext<Api | null>(null);

export function ApiProvider({ api, children }: { api: Api; children: ReactNode }) {
  return React.createElement(ApiContext.Provider, { value: api }, children);
}

export function useApi(): Api {
  const injected = useContext(ApiContext);
  if (injected) return injected;
  const client = useTrpcClient();
  return useMemo(() => buildApi(client), [client]);
}

export { unwrap, getErrorMessage } from "../helpers";
export type { CreateMemberBody } from "./MembersApiClient";
export { createMockApi } from "./mockApi";
