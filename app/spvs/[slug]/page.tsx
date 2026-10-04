import type { Metadata } from "next";
import SpvDetailView from "./_components/SpvDetailView";

export const metadata: Metadata = {
  title: "SPV details | SPV Commitment Tracker",
  description: "Target, funding progress and every investor's commitment for one SPV.",
};

export default async function SpvDetailPage({ params }: PageProps<"/spvs/[slug]">) {
  const { slug } = await params;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <SpvDetailView slug={slug} />
    </main>
  );
}
