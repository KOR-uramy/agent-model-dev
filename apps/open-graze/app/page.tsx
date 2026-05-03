import { Suspense } from "react";
import {
  HomeLoadingFallback,
  HomePageContent,
} from "@/app/components/home-page-content";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoadingFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
