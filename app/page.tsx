import { Chat } from "./components/Chat";
import { PasswordGate } from "./components/PasswordGate";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F0EB] dark:bg-[#1c1b18]">
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1a1a1a] dark:text-[#F5F0EB] mb-4">
            Hello, Agent
          </h1>
          <p className="text-xl text-[#666666] dark:text-[#a8a49c] mb-2">
            Chat with an Agent that can read and explain a codebase
          </p>
          <p className="text-sm text-[#666666] dark:text-[#a8a49c] max-w-md mx-auto">
            An AI codebase explorer. By default, the agent explores its own source code - or point it at any public GitHub repo.
          </p>
        </div>

        {/* Chat Interface - Protected by Password Gate */}
        <PasswordGate>
          <Chat />
        </PasswordGate>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-[#666666] dark:text-[#a8a49c]">
          <p>
            Powered by{" "}
            <a
              href="https://anthropic.com"
              className="underline hover:text-[#1a1a1a] dark:hover:text-[#F5F0EB]"
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
