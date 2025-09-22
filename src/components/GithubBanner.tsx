import React, { useEffect, useState } from "react";

interface GithubBannerProps {
  show: boolean;
  onClose: () => void;
}

export const GithubBanner: React.FC<GithubBannerProps> = ({ show, onClose }) => {
  const [stars, setStars] = useState<string>("-");

  useEffect(() => {
    async function fetchStars() {
      try {
        const res = await fetch(
          "https://api.github.com/repos/mylife-as-miles/askable",
          {
            headers: {
              Accept: "application/vnd.github+json",
              "User-Agent": "askable-app",
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        setStars(
          typeof data.stargazers_count === "number"
            ? data.stargazers_count.toLocaleString()
            : "-"
        );
      } catch {
        setStars("-");
      }
    }
    fetchStars();
  }, []);

  if (!show) return null;

  return (
    <a
      href="https://github.com/mylife-as-miles/askable"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed w-full h-[34px] flex items-center overflow-hidden bg-[#1d293d] border-b border-slate-200 px-4 justify-center cursor-pointer z-20"
    >
      <div className="flex items-center bg-[#314158] h-[28px] px-3 rounded mr-4">
        <img src="/star.svg" alt="star" className="size-[18px]" />
        <p className="text-sm text-white">{stars}</p>
      </div>
      <div className="flex items-center mr-4">
        <p className="text-sm text-white mr-1">Open source on</p>
        <img src="/githubLogo.svg" alt="GitHub" className="h-[18px]" />
      </div>
      <button
        className="cursor-pointer p-2 absolute right-2 z-10"
        onClick={(evt: React.MouseEvent<HTMLButtonElement>) => {
          evt.preventDefault();
          evt.stopPropagation();
          onClose();
        }}
      >
        <img src="/fileX.svg" alt="close banner" className="size-2" />
      </button>
    </a>
  );
};
