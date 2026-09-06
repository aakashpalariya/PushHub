import { getRequiredUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TemplatesClient } from "@/components/templates/templates-client";

export const revalidate = 0;

export default async function TemplatesPage() {
  const user = await getRequiredUser();
  if (!user) return null;

  const rawTemplates = await prisma.template.findMany({
    where: {
      OR: [{ isSystemTemplate: true }, { userId: user.id }],
    },
    orderBy: [{ isSystemTemplate: "desc" }, { createdAt: "asc" }],
  });

  const templates = rawTemplates.map((t) => {
    let parsedConfig = {
      title: t.name,
      body: "",
      icon: "",
      image: "",
      actions: [],
      tag: "",
      style: {},
    };

    try {
      parsedConfig = JSON.parse(t.configuration);
    } catch (err) {
      console.error("Error parsing template JSON", err);
    }

    return {
      id: t.id,
      userId: t.userId,
      name: t.name,
      description: t.description,
      category: t.category,
      configuration: t.configuration,
      isSystemTemplate: t.isSystemTemplate,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      parsedConfig,
    };
  });

  return <TemplatesClient initialTemplates={templates} />;
}
