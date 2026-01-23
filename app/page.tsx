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
    </div>
  );
}
