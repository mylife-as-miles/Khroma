"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CHAT_MODELS } from "@/lib/models";

export function useLLMModel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const models = CHAT_MODELS;
  const defaultModel = models.find((m) => m.isDefault)?.slug;
  const slugs = models.map((m) => m.slug);
  const paramModel = searchParams.get("model");
  const selectedModelSlug =
    paramModel && slugs.includes(paramModel)
      ? models.find((m) => m.slug === paramModel)?.slug
      : defaultModel;

  const setModel = (model: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("model", model);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return {
    selectedModelSlug,
    setModel,
    models,
    defaultModel,
  };
}
