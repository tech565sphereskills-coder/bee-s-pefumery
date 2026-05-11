import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  category: z.enum(["men", "women", "unisex"]).optional(),
  brand: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  component: () => <Outlet />,
});
