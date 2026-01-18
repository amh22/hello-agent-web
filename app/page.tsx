import { Chat } from "./components/Chat";
import { PasswordGate } from "./components/PasswordGate";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Hello, Agent
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-2">
            Chat with an AI that can read and explain its own source code
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Built with Next.js, Claude Agent SDK, and deployed on Vercel
          </p>
        </div>

        {/* Chat Interface - Protected by Password Gate */}
        <PasswordGate>
          <Chat />
        </PasswordGate>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-zinc-400 dark:text-zinc-600">
          <p>
            Powered by{" "}
            <a
              href="https://anthropic.com"
              className="underline hover:text-zinc-600 dark:hover:text-zinc-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic
            </a>{" "}
            Claude Agent SDK
          </p>
        </footer>
      </main>
    </div>
  );
}
