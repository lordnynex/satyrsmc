import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
