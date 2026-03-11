import { NAV_LINKS } from "../constants/landing_cs";

export default function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-[30px] h-[30px] rounded-[8px] bg-indigo-600 grid grid-cols-2 gap-[3px] p-[6px] group-hover:bg-indigo-700 transition-colors duration-200">
            <div className="rounded-[2px] bg-white" />
            <div className="rounded-[2px] bg-white/40" />
            <div className="rounded-[2px] bg-white/40" />
            <div className="rounded-[2px] bg-white" />
          </div>
          <span className="font-display font-bold text-gray-950 text-[15px] tracking-[-0.02em]">
            VirtualSpace
          </span>
        </a>

        {/* Nav */}
        <nav className="hidden md:flex items-center">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="font-body text-[13.5px] text-gray-500 hover:text-gray-900 transition-colors duration-150 px-4 py-2 rounded-lg hover:bg-black/[0.04]"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* GitHub */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 font-body text-[13.5px] text-gray-500 hover:text-gray-900 border border-black/[0.09] hover:border-black/[0.18] px-4 py-2 rounded-lg transition-all duration-150"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.031 1.531 1.031.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          GitHub
        </a>

      </div>
    </header>
  );
}