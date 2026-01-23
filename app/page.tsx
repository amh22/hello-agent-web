import { Chat } from "./components/Chat";
import { PasswordGate } from "./components/PasswordGate";
import { ThemeToggle } from "./components/ThemeToggle";
import { MatrixBackground } from "./components/MatrixBackground";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-[#F5F0EB] dark:bg-[#1c1b18] relative flex flex-col">
      <MatrixBackground />

      {/* Theme Toggle - fixed position, aligned with header */}
      <div className="fixed top-2.5 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Main App - Password Protected */}
      <PasswordGate>
        <Chat />
      </PasswordGate>

      {/* Footer - fixed at very bottom, shown subtly */}
      <footer className="fixed bottom-0 left-0 right-0 py-2 text-center text-xs text-[#888888] dark:text-[#666666] bg-gradient-to-t from-[#F5F0EB] dark:from-[#1c1b18] to-transparent pointer-events-none z-10">
        <div className="pointer-events-auto inline-block">
          <span>
            Orchestrated by{" "}
            <a
              href="https://github.com/amh22"
              className="underline hover:text-[#1a1a1a] dark:hover:text-[#a8a49c]"
              target="_blank"
              rel="noopener noreferrer"
            >
              amh
            </a>
          </span>
          <span className="mx-2">|</span>
          <span>
            Powered by{" "}
            <a
              href="https://anthropic.com"
              className="underline hover:text-[#1a1a1a] dark:hover:text-[#a8a49c]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
