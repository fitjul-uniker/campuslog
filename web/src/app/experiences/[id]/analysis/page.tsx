import { ExperienceAnalysisClient } from "@/components/experiences/ExperienceAnalysisClient";

type ExperienceAnalysisPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExperienceAnalysisPage({
  params,
}: ExperienceAnalysisPageProps) {
  const { id } = await params;

  return <ExperienceAnalysisClient id={id} />;
}
