import { ExperienceDetailClient } from "@/components/experiences/ExperienceDetailClient";

type ExperienceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExperienceDetailPage({
  params,
}: ExperienceDetailPageProps) {
  const { id } = await params;

  return <ExperienceDetailClient id={id} />;
}
