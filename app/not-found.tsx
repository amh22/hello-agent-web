import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Matrix rain effect - CSS only */}
      <div className="absolute inset-0 opacity-20 pointer-events-none select-none font-mono text-green-500 text-xs leading-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${i * 5}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {Array.from({ length: 30 }).map((_, j) => (
              <div key={j} className="opacity-50">
                {String.fromCharCode(0x30a0 + Math.random() * 96)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="text-green-500 font-mono text-sm mb-8 animate-pulse">
          &gt; SYSTEM ERROR_
        </div>

        <h1 className="text-8xl font-bold text-green-500 font-mono mb-4 tracking-wider">
          404
        </h1>

        <div className="text-green-400 font-mono text-lg mb-8 space-y-2">
          <p>The page you seek does not exist.</p>
          <p className="text-green-600">Perhaps you took the wrong pill.</p>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-green-500/10 border border-green-500 text-green-400 font-mono text-sm hover:bg-green-500/20 hover:text-green-300 transition-all duration-300"
        >
          &gt; follow <span className="text-lg">🐇</span>
        </Link>
      </div>

      {/* White rabbit ASCII art */}
      <pre className="absolute bottom-8 right-8 text-green-500/30 font-mono text-xs hidden md:block">
{`  /)  /)
 ( ^.^ )
 c(")(")
`}
      </pre>
    </div>
  );
}
