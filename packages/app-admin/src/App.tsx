import { Suspense, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppStateProvider, useAppState } from "@/state/AppState";
import { Header } from "@/components/layout/Header";
import { Main } from "@/components/layout/Main";
import { BudgetingLayout } from "@/components/layout/BudgetingLayout";
import { PageLoading } from "@/components/layout/PageLoading";
import { IdParamGuard } from "@/components/layout/IdParamGuard";
import { ContactsLayout } from "@/components/layout/ContactsLayout";
import { EventsLayout } from "@/components/layout/EventsLayout";
import { MeetingsLayout } from "@/components/layout/MeetingsLayout";
import { WebsiteLayout } from "@/components/layout/WebsiteLayout";
import {
  HomePage,
  NotFoundPage,
  EventsPage,
  EventDetailPage,
  IncidentsPanel,
  MembersPanel,
  MemberDetailPage,
  ContactsPanel,
  ContactDetailPage,
  MailingListsPanel,
  QrCodesPanel,
  QrCodeDetailPage,
  MailingPanel,
  EmailPanel,
  AssetsPanel,
  HellenicsPanel,
  VendorsPanel,
  ActualSpendPanel,
  MeetingsPanel,
  CreateMeetingPage,
  MeetingDetailPage,
  MeetingDocumentEditPage,
  TemplatesPanel,
  TemplateDetailPage,
  BylawsPage,
  RobertsRulesPage,
  OldBusinessPanel,
  MotionsPanel,
  CommitteesPanel,
  CommitteeDetailPage,
  CreateCommitteePage,
  CreateCommitteeMeetingPage,
  CommitteeMeetingDetailPage,
  CommitteeMeetingDocumentEditPage,
  PrintView,
  EmailView,
  WebsitePagesPanel,
  WebsiteBlogPanel,
  WebsiteEventsFeedPanel,
  WebsiteMemberProfilesPanel,
  WebsiteGalleriesPanel,
  WebsiteMenusPanel,
  WebsiteContactSubmissionsPanel,
  WebsiteSettingsPanel,
} from "@/pages";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { useScenarioMetrics } from "@/hooks/useScenarioMetrics";
import "./index.css";

function AppContent() {
  const { getInputs, getLineItems, currentBudget, currentScenario } = useAppState();
  const metrics = useScenarioMetrics(getInputs(), getLineItems());
  const location = useLocation();
  const [printMode, setPrintMode] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const stateForExport = {
    inputs: getInputs(),
    lineItems: getLineItems(),
    budget: currentBudget,
    scenario: currentScenario,
  };

  const navigate = useNavigate();
  const isPrintRoute = location.pathname === "/print";

  const onPrint = () => setPrintMode(true);
  const onEmail = () => setEmailOpen(true);

  const openPrintInNewTab = () => {
    const base = window.location.pathname.replace(/\/[^/]*$/, "") || "";
    const url = `${window.location.origin}${base}/print`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {printMode || isPrintRoute ? (
        <div className="relative min-h-screen bg-white p-4 md:p-8">
          <div className="print:hidden fixed right-4 top-4 z-50 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100 hover:text-gray-900"
              onClick={() => window.print()}
              aria-label="Print"
            >
              <Printer className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100 hover:text-gray-900"
              onClick={() =>
                isPrintRoute ? navigate("/budgeting/projections") : setPrintMode(false)
              }
              aria-label="Close print view"
            >
              <X className="size-5" />
            </Button>
          </div>
          <PrintView state={stateForExport} metrics={metrics} />
          <div className="mt-8 flex gap-4 print:hidden">
            <Button variant="outline" onClick={openPrintInNewTab}>
              Open in new tab
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                isPrintRoute ? navigate("/budgeting/projections") : setPrintMode(false)
              }
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="sticky top-0 z-40 bg-background">
            <Header />
          </div>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/events"
              element={
                <main className="space-y-6 p-4 md:p-6">
                  <EventsLayout />
                </main>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EventsPage />
                  </Suspense>
                }
              />
              <Route
                path="badger"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EventsPage type="badger" />
                  </Suspense>
                }
              />
              <Route
                path="anniversary"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EventsPage type="anniversary" />
                  </Suspense>
                }
              />
              <Route
                path="pioneer-run"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EventsPage type="pioneer_run" />
                  </Suspense>
                }
              />
              <Route
                path="rides"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EventsPage type="rides" />
                  </Suspense>
                }
              />
              <Route
                path="incidents"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <IncidentsPanel />
                  </Suspense>
                }
              />
              <Route
                path=":id"
                element={
                  <IdParamGuard>
                    <Suspense fallback={<PageLoading />}>
                      <EventDetailPage />
                    </Suspense>
                  </IdParamGuard>
                }
              />
            </Route>
            <Route
              path="/meetings"
              element={
                <main className="space-y-6 p-4 md:p-6">
                  <MeetingsLayout />
                </main>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<PageLoading />}>
                    <MeetingsPanel />
                  </Suspense>
                }
              />
              <Route
                path="new"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <CreateMeetingPage />
                  </Suspense>
                }
              />
              <Route
                path="committees"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <CommitteesPanel />
                  </Suspense>
                }
              />
              <Route
                path="committees/new"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <CreateCommitteePage />
                  </Suspense>
                }
              />
              <Route
                path="committees/:id"
                element={
                  <IdParamGuard param="id">
                    <Suspense fallback={<PageLoading />}>
                      <CommitteeDetailPage />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path="committees/:id/meetings/new"
                element={
                  <IdParamGuard param="id">
                    <Suspense fallback={<PageLoading />}>
                      <CreateCommitteeMeetingPage />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path="committees/:id/meetings/:meetingId"
                element={
                  <IdParamGuard param="id">
                    <IdParamGuard param="meetingId">
                      <Suspense fallback={<PageLoading />}>
                        <CommitteeMeetingDetailPage />
                      </Suspense>
                    </IdParamGuard>
                  </IdParamGuard>
                }
              />
              <Route
                path="committees/:id/meetings/:meetingId/agenda/edit"
                element={
                  <IdParamGuard param="id">
                    <IdParamGuard param="meetingId">
                      <Suspense fallback={<PageLoading />}>
                        <CommitteeMeetingDocumentEditPage documentType="agenda" />
                      </Suspense>
                    </IdParamGuard>
                  </IdParamGuard>
                }
              />
              <Route
                path="committees/:id/meetings/:meetingId/minutes/edit"
                element={
                  <IdParamGuard param="id">
                    <IdParamGuard param="meetingId">
                      <Suspense fallback={<PageLoading />}>
                        <CommitteeMeetingDocumentEditPage documentType="minutes" />
                      </Suspense>
                    </IdParamGuard>
                  </IdParamGuard>
                }
              />
              <Route
                path="templates"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <TemplatesPanel />
                  </Suspense>
                }
              />
              <Route
                path="templates/:id"
                element={
                  <IdParamGuard param="id">
                    <Suspense fallback={<PageLoading />}>
                      <TemplateDetailPage />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path="bylaws"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <BylawsPage />
                  </Suspense>
                }
              />
              <Route
                path="roberts-rules"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <RobertsRulesPage />
                  </Suspense>
                }
              />
              <Route
                path="old-business"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <OldBusinessPanel />
                  </Suspense>
                }
              />
              <Route
                path="motions"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <MotionsPanel />
                  </Suspense>
                }
              />
              <Route
                path=":id"
                element={
                  <IdParamGuard>
                    <Suspense fallback={<PageLoading />}>
                      <MeetingDetailPage />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path=":id/agenda/edit"
                element={
                  <IdParamGuard>
                    <Suspense fallback={<PageLoading />}>
                      <MeetingDocumentEditPage documentType="agenda" />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path=":id/minutes/edit"
                element={
                  <IdParamGuard>
                    <Suspense fallback={<PageLoading />}>
                      <MeetingDocumentEditPage documentType="minutes" />
                    </Suspense>
                  </IdParamGuard>
                }
              />
            </Route>
            <Route
              path="budgeting"
              element={<BudgetingLayout onPrint={onPrint} onEmail={onEmail} />}
            >
              <Route index element={<Navigate to="projections" replace />} />
              <Route
                path="projections"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Main activeTab="projections" onPrint={onPrint} onEmail={onEmail} />
                  </Suspense>
                }
              />
              <Route
                path="budget"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Main activeTab="budget" onPrint={onPrint} onEmail={onEmail} />
                  </Suspense>
                }
              />
              <Route
                path="budget/:id"
                element={
                  <IdParamGuard param="id">
                    <Suspense fallback={<PageLoading />}>
                      <Main activeTab="budget" onPrint={onPrint} onEmail={onEmail} />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path="scenarios"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Main activeTab="scenarios" onPrint={onPrint} onEmail={onEmail} />
                  </Suspense>
                }
              />
              <Route
                path="scenarios/:id"
                element={
                  <IdParamGuard param="id">
                    <Suspense fallback={<PageLoading />}>
                      <Main activeTab="scenarios" onPrint={onPrint} onEmail={onEmail} />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path="actual-spend"
                element={
                  <main className="space-y-6 p-4 md:p-6">
                    <Suspense fallback={<PageLoading />}>
                      <ActualSpendPanel />
                    </Suspense>
                  </main>
                }
              />
            </Route>
            <Route
              path="/contacts"
              element={
                <main className="space-y-6 p-4 md:p-6">
                  <ContactsLayout />
                </main>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<PageLoading />}>
                    <ContactsPanel />
                  </Suspense>
                }
              />
              <Route
                path="lists"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <MailingListsPanel />
                  </Suspense>
                }
              />
              <Route
                path="lists/:listId"
                element={
                  <IdParamGuard param="listId">
                    <Suspense fallback={<PageLoading />}>
                      <MailingListsPanel />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path="qr-codes"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <QrCodesPanel />
                  </Suspense>
                }
              />
              <Route
                path="qr-codes/:id"
                element={
                  <IdParamGuard param="id">
                    <Suspense fallback={<PageLoading />}>
                      <QrCodeDetailPage />
                    </Suspense>
                  </IdParamGuard>
                }
              />
              <Route
                path="compose/mailing"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <MailingPanel />
                  </Suspense>
                }
              />
              <Route
                path="compose/email"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EmailPanel />
                  </Suspense>
                }
              />
              <Route
                path="compose/assets"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <AssetsPanel />
                  </Suspense>
                }
              />
              <Route
                path="hellenics"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <HellenicsPanel />
                  </Suspense>
                }
              />
              <Route
                path="vendors"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <VendorsPanel />
                  </Suspense>
                }
              />
              <Route
                path=":id"
                element={
                  <IdParamGuard>
                    <Suspense fallback={<PageLoading />}>
                      <ContactDetailPage />
                    </Suspense>
                  </IdParamGuard>
                }
              />
            </Route>
            <Route
              path="/website"
              element={
                <main className="space-y-6 p-4 md:p-6">
                  <WebsiteLayout />
                </main>
              }
            >
              <Route index element={<Navigate to="/website/pages" replace />} />
              <Route
                path="pages"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <WebsitePagesPanel />
                  </Suspense>
                }
              />
              <Route
                path="blog"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <WebsiteBlogPanel />
                  </Suspense>
                }
              />
              <Route
                path="events-feed"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <WebsiteEventsFeedPanel />
                  </Suspense>
                }
              />
              <Route
                path="member-profiles"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <WebsiteMemberProfilesPanel />
                  </Suspense>
                }
              />
              <Route
                path="galleries"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <WebsiteGalleriesPanel />
                  </Suspense>
                }
              />
              <Route
                path="menus"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <WebsiteMenusPanel />
                  </Suspense>
                }
              />
              <Route
                path="contact-submissions"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <WebsiteContactSubmissionsPanel />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <WebsiteSettingsPanel />
                  </Suspense>
                }
              />
            </Route>
            <Route
              path="/members"
              element={
                <main className="space-y-6 p-4 md:p-6">
                  <Suspense fallback={<PageLoading />}>
                    <MembersPanel />
                  </Suspense>
                </main>
              }
            />
            <Route
              path="/members/:id"
              element={
                <main className="space-y-6 p-4 md:p-6">
                  <IdParamGuard>
                    <Suspense fallback={<PageLoading />}>
                      <MemberDetailPage />
                    </Suspense>
                  </IdParamGuard>
                </main>
              }
            />
            <Route path="/print" element={null} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </>
      )}

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email-friendly Summary</DialogTitle>
          </DialogHeader>
          <EmailView state={stateForExport} metrics={metrics} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
