const COLS = [
  { heading: "Product",   links: ["Features", "How it works", "FAQ", "Changelog"] },
  { heading: "Resources", links: ["Docs", "GitHub", "Support", "Status"] },
  { heading: "Legal",     links: ["Privacy", "Terms", "Cookies"] },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-white">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">

          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-[30px] h-[30px] rounded-[8px] bg-indigo-600 grid grid-cols-2 gap-[3px] p-[6px]">
                <div className="rounded-[2px] bg-white" />
                <div className="rounded-[2px] bg-white/40" />
                <div className="rounded-[2px] bg-white/40" />
                <div className="rounded-[2px] bg-white" />
              </div>
              <span className="font-display font-bold text-gray-950 text-[15px] tracking-[-0.02em]">
                VirtualSpace
              </span>
            </div>
            <p className="font-body text-[13.5px] text-gray-400 leading-relaxed max-w-[200px] mb-8">
              A simpler, more human way to connect with people remotely.
            </p>
            <p className="font-body text-[11px] text-gray-300 uppercase tracking-wider">
              React · Phaser · Socket.io · WebRTC
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.heading}>
              <p className="font-body text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">
                {col.heading}
              </p>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-body text-[13.5px] text-gray-500 hover:text-gray-900 transition-colors duration-150"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-black/[0.06] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="font-body text-[12px] text-gray-400">© 2025 VirtualSpace. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <a key={l} href="#" className="font-body text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}