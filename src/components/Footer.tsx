import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-16 bg-[#0e0e0e] border-t border-white/5 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 max-w-[1280px] mx-auto items-center">
        <div>
          <a href="#" className="font-headline-md text-2xl text-[#dbfcff] font-bold mb-2 block">
            FrameInGoa
          </a>
          <p className="font-body-sm text-sm text-[#b9cacb]">
            © 2026 HH Goa — FrameInGoa. Built for the elite.
          </p>
        </div>
        <div className="flex gap-6 md:justify-end items-center flex-wrap">
          <a
            href="#"
            className="font-body-sm text-sm text-[#b9cacb] hover:text-[#00dbe9] transition-colors"
          >
            Privacy
          </a>
          <a
            href="#"
            className="font-body-sm text-sm text-[#b9cacb] hover:text-[#00dbe9] transition-colors"
          >
            Terms
          </a>
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noreferrer"
            className="font-body-sm text-sm text-[#b9cacb] hover:text-[#00dbe9] transition-colors"
          >
            Discord
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="font-body-sm text-sm text-[#b9cacb] hover:text-[#00dbe9] transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};
