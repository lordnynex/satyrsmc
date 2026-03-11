import type { Member } from "@satyrsmc/shared/client";
import { jsPDF } from "jspdf";
import { MONTHS } from "@/lib/date-utils";
import { escapeVCardValue } from "@/lib/vcard";

export { MONTHS };

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getYearsAsMember(memberSince: string | null): number | null {
  if (!memberSince || !/^\d{4}-\d{2}$/.test(memberSince)) return null;
  const start = new Date(memberSince + "-01");
  const today = new Date();
  const years = (today.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.round(years);
}

export function formatMemberSinceDisplay(memberSince: string | null): string {
  const key = toMemberSinceKey(memberSince);
  if (!key) return "";
  const [y, mo] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[parseInt(mo ?? "1", 10) - 1] ?? mo;
  const years = getYearsAsMember(key);
  if (years !== null) {
    return `${month} ${y} (${years} year${years === 1 ? "" : "s"})`;
  }
  return `${month} ${y}`;
}

export function formatBirthdayDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

/** Format birthday string (YYYY-MM-DD or ISO) for display, e.g. "January 15, 2025" */
export function formatBirthday(d: string | null): string {
  const dateOnly = d ? d.slice(0, 10) : "";
  if (!dateOnly || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return d ?? "";
  try {
    const [y, mo, day] = dateOnly.split("-");
    const month = MONTHS[parseInt(mo ?? "1", 10) - 1] ?? mo;
    return `${month} ${day}, ${y}`;
  } catch {
    return d ?? "";
  }
}

/** Format member_since (YYYY-MM or ISO) for display, e.g. "January 2025" */
export function formatMemberSince(d: string | null): string {
  const monthOnly = d ? d.slice(0, 7) : "";
  if (!monthOnly || !/^\d{4}-\d{2}$/.test(monthOnly)) return "";
  const [y, mo] = monthOnly.split("-");
  const month = MONTHS[parseInt(mo ?? "1", 10) - 1] ?? mo;
  return `${month} ${y}`;
}

/** Normalize API date string to YYYY-MM-DD (handles full ISO or date-only). */
function toBirthdayKey(s: string | null | undefined): string | null {
  if (!s || typeof s !== "string") return null;
  const dateOnly = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null;
}

/** Normalize API date string to YYYY-MM (handles full ISO or YYYY-MM). */
function toMemberSinceKey(s: string | null | undefined): string | null {
  if (!s || typeof s !== "string") return null;
  const monthOnly = s.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(monthOnly) ? monthOnly : null;
}

export function formatAnniversaryDate(date: Date, member: Member): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const base = `${months[date.getMonth()]} ${date.getDate()}`;
  const memberSince = toMemberSinceKey(member.member_since);
  if (!memberSince) return base;
  const joinYear = parseInt(memberSince.slice(0, 4), 10);
  const years = date.getFullYear() - joinYear;
  return `${base} (${years} year${years === 1 ? "" : "s"})`;
}

export function getUpcomingBirthdays(members: Member[], daysAhead = 90): { member: Member; date: Date }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  const result: { member: Member; date: Date }[] = [];
  for (const m of members) {
    const birthday = toBirthdayKey(m.birthday);
    if (!birthday) continue;
    const parts = birthday.split("-").map(Number);
    const month = parts[1] ?? 1;
    const day = parts[2] ?? 1;
    const thisYear = new Date(today.getFullYear(), month - 1, day);
    const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
    const bdayDate = thisYear >= today ? thisYear : nextYear;
    if (bdayDate >= today && bdayDate <= endDate) {
      result.push({ member: m, date: bdayDate });
    }
  }
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}

export function getUpcomingAnniversaries(members: Member[], daysAhead = 90): { member: Member; date: Date }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  const result: { member: Member; date: Date }[] = [];
  for (const m of members) {
    const memberSince = toMemberSinceKey(m.member_since);
    if (!memberSince) continue;
    const month = Number(memberSince.split("-")[1] ?? 1);
    const thisYear = new Date(today.getFullYear(), month - 1, 1);
    const nextYear = new Date(today.getFullYear() + 1, month - 1, 1);
    const annivDate = thisYear >= today ? thisYear : nextYear;
    if (annivDate >= today && annivDate <= endDate) {
      result.push({ member: m, date: annivDate });
    }
  }
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}

function memberToVCard(m: Member): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`FN:${escapeVCardValue(m.name)}`);
  const nameParts = m.name.trim().split(/\s+/);
  const family = nameParts.length > 1 ? nameParts.pop()! : "";
  const given = nameParts.join(" ");
  lines.push(`N:${escapeVCardValue(family)};${escapeVCardValue(given)};;;`);
  if (m.phone_number) lines.push(`TEL;TYPE=CELL:${m.phone_number.replace(/\s/g, "")}`);
  if (m.email) lines.push(`EMAIL:${m.email}`);
  if (m.address) lines.push(`ADR;TYPE=HOME:;;${escapeVCardValue(m.address)};;;;`);
  if (m.birthday) lines.push(`BDAY:${m.birthday.replace(/-/g, "")}`);
  if (m.position) lines.push(`TITLE:${escapeVCardValue(m.position)}`);
  const noteParts: string[] = [];
  if (m.member_since) {
    const [y, mo] = m.member_since.split("-");
    noteParts.push(`Member since ${mo}/${y}`);
  }
  if (m.emergency_contact_name || m.emergency_contact_phone) {
    const ec = [m.emergency_contact_name, m.emergency_contact_phone].filter(Boolean).join(": ");
    noteParts.push(`Emergency contact: ${ec}`);
  }
  if (noteParts.length > 0) {
    lines.push(`NOTE:${escapeVCardValue(noteParts.join(". "))}`);
  }
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function escapeIcalText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadMembersJson(members: Member[]) {
  const json = JSON.stringify(members, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "members.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMembersVCard(members: Member[]) {
  const vcf = members.map(memberToVCard).join("\r\n");
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "members.vcf";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBirthdaysIcal(members: Member[]) {
  const withBirthday = members.filter((m) => m.birthday && /^\d{4}-\d{2}-\d{2}$/.test(m.birthday));
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Badger Budget//Members Birthdays//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const m of withBirthday) {
    const dt = (m.birthday ?? "").replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:member-${m.id}-birthday@satyrsmc`);
    lines.push(`DTSTART;VALUE=DATE:${dt}`);
    lines.push("RRULE:FREQ=YEARLY");
    lines.push(`SUMMARY:${escapeIcalText(m.name)}'s Birthday`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const ics = lines.join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "member-birthdays.ics";
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchPhotoAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Export members as a 2-column PDF roster with photo, birthday, join date, address, phone, emergency contact */
export async function downloadMembersRosterPdf(members: Member[]): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const gapX = 18;
  const colWidth = (pageWidth - margin * 2 - gapX) / 2;
  const photoSize = 48;
  const lineHeight = 12;
  const cardPadding = 8;
  const cardGapY = 12;
  const fontSizeName = 11;
  const fontSizeDetail = 9;

  let col = 0;
  let rowY = margin;
  let maxY = margin;

  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));

  for (const m of sortedMembers) {
    if (col === 0 && rowY + 80 > pageHeight - margin) {
      doc.addPage();
      rowY = margin;
      maxY = margin;
    }

    const x = margin + col * (colWidth + gapX);
    const y = rowY;
    const contentWidth = colWidth - cardPadding * 2;
    const textStartX = x + cardPadding;

    let lineY = y + cardPadding;

    let photoDrawn = false;
    if (m.photo_url || m.photo_thumbnail_url) {
      const photoUrl = m.photo_thumbnail_url ?? m.photo_url ?? "";
      const dataUrl = await fetchPhotoAsDataUrl(photoUrl);
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, "JPEG", textStartX, lineY, photoSize, photoSize);
          photoDrawn = true;
        } catch {
          try {
            doc.addImage(dataUrl, "PNG", textStartX, lineY, photoSize, photoSize);
            photoDrawn = true;
          } catch {
            // Fall through to placeholder
          }
        }
      }
    }
    if (!photoDrawn) {
      doc.setFillColor(235, 235, 235);
      doc.setDrawColor(200, 200, 200);
      doc.circle(textStartX + photoSize / 2, lineY + photoSize / 2, photoSize / 2 - 2, "FD");
      doc.setTextColor(160, 160, 160);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text("?", textStartX + photoSize / 2, lineY + photoSize / 2 + 2, { align: "center" });
      doc.setTextColor(0, 0, 0);
    }

    const textAreaWidth = contentWidth - photoSize - 8;
    const textX = textStartX + photoSize + 8;
    let textY = lineY + fontSizeName;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSizeName);
    const nameLines = doc.splitTextToSize(m.name, textAreaWidth);
    doc.text(nameLines, textX, textY);
    textY += nameLines.length * lineHeight;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSizeDetail);

    const details: string[] = [];
    if (m.birthday) details.push(`Birthday: ${formatBirthday(m.birthday)}`);
    if (m.member_since) details.push(`Joined: ${formatMemberSince(m.member_since)}`);
    if (m.address) details.push(`Address: ${m.address}`);
    if (m.phone_number) details.push(`Phone: ${m.phone_number}`);
    if (m.emergency_contact_name || m.emergency_contact_phone) {
      const ec = [m.emergency_contact_name, m.emergency_contact_phone].filter(Boolean).join(" ");
      details.push(`Emergency: ${ec}`);
    }

    for (const line of details) {
      const wrapped = doc.splitTextToSize(line, textAreaWidth);
      for (const w of wrapped) {
        doc.text(w, textX, textY);
        textY += lineHeight;
      }
    }

    const cardBottom = textY + cardPadding;
    maxY = Math.max(maxY, cardBottom);

    col++;
    if (col >= 2) {
      col = 0;
      rowY = maxY + cardGapY;
    }
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "member-roster.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
