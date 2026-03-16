import { useParams } from "react-router-dom";
import { isValidUuid } from "@/lib/utils";
import { NotFoundPage } from "./NotFoundPage";

type IdParamGuardProps = {
  children: React.ReactNode;
  /** Route param name (default: "id"). Use "listId", "batchId", "meetingId", etc. for other routes. */
  param?: "id" | "listId" | "batchId" | "meetingId";
};

/**
 * Renders children only when the route param is a valid UUID.
 * Otherwise renders NotFoundPage without triggering any data fetches.
 */
export function IdParamGuard({ children, param = "id" }: IdParamGuardProps) {
  const params = useParams();
  const value = params[param];
  if (!value || !isValidUuid(value)) {
    return <NotFoundPage />;
  }
  return <>{children}</>;
}
