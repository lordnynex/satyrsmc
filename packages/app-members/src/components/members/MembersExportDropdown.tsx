import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronDown, Download, FileJson, Users } from "lucide-react";
import type { Member } from "@satyrsmc/shared/client";
import {
  downloadBirthdaysIcal,
  downloadMembersJson,
  downloadMembersRosterPdf,
  downloadMembersVCard,
} from "./memberUtils";

interface MembersExportDropdownProps {
  members: Member[];
}

export function MembersExportDropdown({ members }: MembersExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Export
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadMembersRosterPdf(members)}>
          <Users className="size-4" />
          Roster
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadMembersJson(members)}>
          <FileJson className="size-4" />
          Download JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadMembersVCard(members)}>
          <Download className="size-4" />
          Download vCard (.vcf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadBirthdaysIcal(members)}>
          <Calendar className="size-4" />
          Birthdays (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
