import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";

/** Data: SitePageResponse[] */
export function useWebsitePagesOptional() {
  return trpc.admin.website.listPages.useQuery();
}

/** Data: SiteSettingsResponse */
export function useWebsiteSettingsOptional() {
  return trpc.admin.website.getSettings.useQuery();
}

export function useWebsiteMenusOptional() {
  return trpc.admin.website.getMenus.useQuery();
}

export function useWebsiteContactSubmissions() {
  const api = useApi();
  return useQuery({
    queryKey: ["website", "contact-submissions"],
    queryFn: () => api.website.listContactSubmissions(),
  });
}

export function useWebsiteContactMemberSubmissions() {
  const api = useApi();
  return useQuery({
    queryKey: ["website", "contact-member-submissions"],
    queryFn: () => api.website.listContactMemberSubmissions(),
  });
}

export function useWebsiteBlogAll() {
  const api = useApi();
  return useQuery({
    queryKey: ["website", "blog", "admin"],
    queryFn: () => api.website.listBlogAll(),
  });
}

export function useWebsiteMembersFeed() {
  const api = useApi();
  return useQuery({
    queryKey: ["website", "members-feed"],
    queryFn: () => api.website.getMembersFeed(),
  });
}

export function useWebsiteEventsFeed() {
  return trpc.website.getEventsFeed.useQuery();
}

export function useWebsiteCreatePage() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.website.createPage(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.websitePages }),
  });
}

export function useWebsiteUpdatePage() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.website.updatePage(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.websitePages }),
  });
}

export function useWebsiteDeletePage() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.website.deletePage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.websitePages }),
  });
}

export function useWebsiteUpdateSettings() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.website.updateSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.websiteSettings }),
  });
}

export function useWebsiteUpdateMenu() {
  const api = useApi();
  const _qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      items,
    }: {
      key: string;
      items: {
        label: string;
        url?: string | null;
        internal_ref?: string | null;
        sort_order?: number;
      }[];
    }) => api.website.updateMenu(key, items),
    onSuccess: () => {},
  });
}
