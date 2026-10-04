interface ErrorBannerProps {
  title: string;
  messages: string[];
}

export default function ErrorBanner({ title, messages }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
    >
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
