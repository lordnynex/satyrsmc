import { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppStateProvider, useAppState } from "@/state/AppState";
import { EventType } from "@satyrsmc/shared/client";
import { Header } from "@/components/layout/Header";
import { Main } from "@/components/layout/Main";
import { BudgetingLayout } from "@/components/layout/BudgetingLayout";
import { PageLoading } from "@/components/layout/PageLoading";
import { IdParamGuard } from "@/components/layout/IdParamGuard";
import { ContactsLayout } from "@/components/layout/ContactsLayout";
import { EventsLayout } from "@/components/layout/EventsLayout";
import { MeetingsLayout } from "@/components/layout/MeetingsLayout";
import { WebsiteLayout } from "@/components/layout/WebsiteLayout";
import { MembersLayout } from "@/components/layout/MembersLayout";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ProtectedRoute, AdminRoute, MemberRoute } from "@/components/auth";

// Auth pages — small, needed immediately on cold load
import {
  LoginPage,
  RegisterPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/components/auth";

// Lazy-loaded pages — split into separate chunks
const MembersDashboard = lazy(() =>
  import("@/components/members-section").then((m) => ({ default: m.MembersDashboard })),
);
const RosterPage = lazy(() =>
  import("@/components/members-section").then((m) => ({ default: m.RosterPage })),
);
const ProfilePage = lazy(() =>
  import("@/components/members-section").then((m) => ({ default: m.ProfilePage })),
);
const MemberProfilePage = lazy(() =>
  import("@/components/members-section").then((m) => ({ default: m.MemberProfilePage })),
);
const MemberEventsPage = lazy(() =>
  import("@/components/members-section").then((m) => ({ default: m.MemberEventsPage })),
);
const MemberEventDetailPage = lazy(() =>
  import("@/components/members-section").then((m) => ({ default: m.MemberEventDetailPage })),
);

const ProfileSettingsPage = lazy(() =>
  import("@/components/settings").then((m) => ({ default: m.ProfileSettingsPage })),
);
const GarageSettingsPage = lazy(() =>
  import("@/components/settings").then((m) => ({ default: m.GarageSettingsPage })),
);
const AccountSettingsPage = lazy(() =>
  import("@/components/settings").then((m) => ({ default: m.AccountSettingsPage })),
);
const NotificationSettingsPage = lazy(() =>
  import("@/components/settings").then((m) => ({ default: m.NotificationSettingsPage })),
);

const HomePage = lazy(() =>
  import("@/components/layout/HomePage").then((m) => ({ default: m.HomePage })),
);
import { NotFoundPage } from "@/components/layout/NotFoundPage";
const EventsPage = lazy(() =>
  import("@/pages/EventsPage").then((m) => ({ default: m.EventsPage })),
);
const EventDetailPage = lazy(() =>
  import("@/components/events/EventDetailPage").then((m) => ({ default: m.EventDetailPage })),
);
const EventAttendeesPage = lazy(() =>
  import("@/components/events/EventAttendeesPage").then((m) => ({ default: m.EventAttendeesPage })),
);
const IncidentsPanel = lazy(() =>
  import("@/components/events/IncidentsPanel").then((m) => ({ default: m.IncidentsPanel })),
);
const MembersPanel = lazy(() =>
  import("@/components/members/MembersPanel").then((m) => ({ default: m.MembersPanel })),
);
const MemberDetailPage = lazy(() =>
  import("@/components/members/MemberDetailPage").then((m) => ({ default: m.MemberDetailPage })),
);
const ContactsPanel = lazy(() =>
  import("@/components/contacts/ContactsPanel").then((m) => ({ default: m.ContactsPanel })),
);
const ContactDetailPage = lazy(() =>
  import("@/components/contacts/ContactDetailPage").then((m) => ({ default: m.ContactDetailPage })),
);
const MailingListsPanel = lazy(() =>
  import("@/components/contacts/MailingListsPanel").then((m) => ({ default: m.MailingListsPanel })),
);
const QrCodesPanel = lazy(() =>
  import("@/components/contacts/QrCodesPanel").then((m) => ({ default: m.QrCodesPanel })),
);
const QrCodeDetailPage = lazy(() =>
  import("@/components/contacts/QrCodeDetailPage").then((m) => ({ default: m.QrCodeDetailPage })),
);
const MailingPanel = lazy(() =>
  import("@/components/contacts/MailingPanel").then((m) => ({ default: m.MailingPanel })),
);
const EmailPanel = lazy(() =>
  import("@/components/contacts/EmailPanel").then((m) => ({ default: m.EmailPanel })),
);
const AssetsPanel = lazy(() =>
  import("@/components/contacts/AssetsPanel").then((m) => ({ default: m.AssetsPanel })),
);
const HellenicsPanel = lazy(() =>
  import("@/components/contacts/HellenicsPanel").then((m) => ({ default: m.HellenicsPanel })),
);
const VendorsPanel = lazy(() =>
  import("@/components/contacts/VendorsPanel").then((m) => ({ default: m.VendorsPanel })),
);
const ActualSpendPanel = lazy(() =>
  import("@/components/budget/ActualSpendPanel").then((m) => ({ default: m.ActualSpendPanel })),
);
const MeetingsPanel = lazy(() =>
  import("@/components/meetings/MeetingsPanel").then((m) => ({ default: m.MeetingsPanel })),
);
const CreateMeetingPage = lazy(() =>
  import("@/components/meetings/CreateMeetingPage").then((m) => ({ default: m.CreateMeetingPage })),
);
const MeetingDetailPage = lazy(() =>
  import("@/components/meetings/MeetingDetailPage").then((m) => ({ default: m.MeetingDetailPage })),
);
const MeetingDocumentEditPage = lazy(() =>
  import("@/components/meetings/MeetingDocumentEditPage").then((m) => ({
    default: m.MeetingDocumentEditPage,
  })),
);
const TemplatesPanel = lazy(() =>
  import("@/components/meetings/TemplatesPanel").then((m) => ({ default: m.TemplatesPanel })),
);
const TemplateDetailPage = lazy(() =>
  import("@/components/meetings/TemplateDetailPage").then((m) => ({
    default: m.TemplateDetailPage,
  })),
);
const BylawsPage = lazy(() =>
  import("@/components/meetings/BylawsPage").then((m) => ({ default: m.BylawsPage })),
);
const RobertsRulesPage = lazy(() =>
  import("@/components/meetings/RobertsRulesPage").then((m) => ({ default: m.RobertsRulesPage })),
);
const OldBusinessPanel = lazy(() =>
  import("@/components/meetings/OldBusinessPanel").then((m) => ({ default: m.OldBusinessPanel })),
);
const MotionsPanel = lazy(() =>
  import("@/components/meetings/MotionsPanel").then((m) => ({ default: m.MotionsPanel })),
);
const CommitteesPanel = lazy(() =>
  import("@/components/committees").then((m) => ({ default: m.CommitteesPanel })),
);
const CommitteeDetailPage = lazy(() =>
  import("@/components/committees").then((m) => ({ default: m.CommitteeDetailPage })),
);
const CreateCommitteePage = lazy(() =>
  import("@/components/committees").then((m) => ({ default: m.CreateCommitteePage })),
);
const CreateCommitteeMeetingPage = lazy(() =>
  import("@/components/committees").then((m) => ({ default: m.CreateCommitteeMeetingPage })),
);
const CommitteeMeetingDetailPage = lazy(() =>
  import("@/components/committees").then((m) => ({ default: m.CommitteeMeetingDetailPage })),
);
const CommitteeMeetingDocumentEditPage = lazy(() =>
  import("@/components/committees").then((m) => ({ default: m.CommitteeMeetingDocumentEditPage })),
);
const PrintView = lazy(() =>
  import("@/components/export/PrintView").then((m) => ({ default: m.PrintView })),
);
const EmailView = lazy(() =>
  import("@/components/export/EmailView").then((m) => ({ default: m.EmailView })),
);
const WebsitePagesPanel = lazy(() =>
  import("@/components/website").then((m) => ({ default: m.WebsitePagesPanel })),
);
const WebsiteBlogPanel = lazy(() =>
  import("@/components/website").then((m) => ({ default: m.WebsiteBlogPanel })),
);
const WebsiteEventsFeedPanel = lazy(() =>
  import("@/components/website").then((m) => ({ default: m.WebsiteEventsFeedPanel })),
);
const WebsiteMemberProfilesPanel = lazy(() =>
  import("@/components/website").then((m) => ({ default: m.WebsiteMemberProfilesPanel })),
);
const WebsiteGalleriesPanel = lazy(() =>
  import("@/components/website").then((m) => ({ default: m.WebsiteGalleriesPanel })),
);
const WebsiteMenusPanel = lazy(() =>
  import("@/components/website").then((m) => ({ default: m.WebsiteMenusPanel })),
);
const WebsiteContactSubmissionsPanel = lazy(() =>
  import("@/components/website").then((m) => ({ default: m.WebsiteContactSubmissionsPanel })),
);
const WebsiteSettingsPanel = lazy(() =>
  import("@/components/website").then((m) => ({ default: m.WebsiteSettingsPanel })),
);
const UsersPanel = lazy(() =>
  import("@/components/users").then((m) => ({ default: m.UsersPanel })),
);
const UserDetailPage = lazy(() =>
  import("@/components/users").then((m) => ({ default: m.UserDetailPage })),
);
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { useScenarioMetrics } from "@/hooks/useScenarioMetrics";
import "./index.css";

function AdminContent() {
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
  const isPrintRoute = location.pathname === "/admin/print";

  const onPrint = () => setPrintMode(true);
  const onEmail = () => setEmailOpen(true);

  const openPrintInNewTab = () => {
    const url = `${window.location.origin}/admin/print`;
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
                isPrintRoute ? navigate("/admin/budgeting/projections") : setPrintMode(false)
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
                isPrintRoute ? navigate("/admin/budgeting/projections") : setPrintMode(false)
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
                    <EventsPage type={EventType.Badger} />
                  </Suspense>
                }
              />
              <Route
                path="anniversary"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EventsPage type={EventType.Anniversary} />
                  </Suspense>
                }
              />
              <Route
                path="pioneer-run"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EventsPage type={EventType.PioneerRun} />
                  </Suspense>
                }
              />
              <Route
                path="rides"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <EventsPage type={EventType.Rides} />
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
              <Route
                path=":id/attendees"
                element={
                  <IdParamGuard>
                    <Suspense fallback={<PageLoading />}>
                      <EventAttendeesPage />
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
              <Route index element={<Navigate to="/admin/website/pages" replace />} />
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
            <Route
              path="/users"
              element={
                <main className="space-y-6 p-4 md:p-6">
                  <Suspense fallback={<PageLoading />}>
                    <UsersPanel />
                  </Suspense>
                </main>
              }
            />
            <Route
              path="/users/:id"
              element={
                <main className="space-y-6 p-4 md:p-6">
                  <IdParamGuard>
                    <Suspense fallback={<PageLoading />}>
                      <UserDetailPage />
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
    <Routes>
      {/* Auth pages — no auth required, blue branded layout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Members section — requires authentication */}
      <Route
        element={
          <ProtectedRoute>
            <MembersLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MembersDashboard />} />
        <Route path="/events" element={<MemberEventsPage />} />
        <Route
          path="/events/:id"
          element={
            <IdParamGuard>
              <MemberEventDetailPage />
            </IdParamGuard>
          }
        />
        <Route
          path="/roster"
          element={
            <MemberRoute>
              <RosterPage />
            </MemberRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/roster/:username"
          element={
            <MemberRoute>
              <MemberProfilePage />
            </MemberRoute>
          }
        />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="/settings/profile" replace />} />
          <Route path="profile" element={<ProfileSettingsPage />} />
          <Route path="garage" element={<GarageSettingsPage />} />
          <Route path="account" element={<AccountSettingsPage />} />
          <Route path="notifications" element={<NotificationSettingsPage />} />
        </Route>
      </Route>

      {/* Admin section — requires admin role */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AppStateProvider>
              <AdminContent />
            </AppStateProvider>
          </AdminRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
