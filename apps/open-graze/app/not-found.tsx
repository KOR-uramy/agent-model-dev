import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <p className="text-sm text-zinc-500">페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        OpenGraze로
      </Link>
    </div>
  );
}
