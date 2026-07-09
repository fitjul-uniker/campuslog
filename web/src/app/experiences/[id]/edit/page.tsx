import { EditExperienceClient } from "@/components/experiences/EditExperienceClient";

type EditExperiencePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditExperiencePage({
  params,
}: EditExperiencePageProps) {
  const { id } = await params;

  return <EditExperienceClient id={id} />;
}
