import { ActivityDetailClient } from "@/components/activities/ActivityDetailClient";

type ActivityDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ActivityDetailPage({
  params,
}: ActivityDetailPageProps) {
  const { id } = await params;

  return <ActivityDetailClient id={id} />;
}
