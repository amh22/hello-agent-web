import { Chat } from "./components/Chat";
import { PasswordGate } from "./components/PasswordGate";
import { ThemeToggle } from "./components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F0EB] dark:bg-[#1c1b18]">
      <main className="max-w-4xl mx-auto px-4 py-12 relative">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1a1a1a] dark:text-[#F5F0EB] mb-4">
            Neo
          </h1>
          <p className="text-xl text-[#666666] dark:text-[#a8a49c] mb-2">
            See the code for what it really is
          </p>
          <p className="text-sm text-[#666666] dark:text-[#a8a49c] max-w-md mx-auto">
            Point Neo at any public GitHub repository. It reads, searches, and decodes the codebase for you.
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
