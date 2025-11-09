"use client";


import { useState, useEffect } from "react";
import Loader from "../components/Loader";

export default function ClientLayout({ children }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenSplash");

    if (!hasSeen) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("hasSeenSplash", "true");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Loader show={showSplash} text="Entrando al campo..." />
      {!showSplash && children}
    </>
  );
}
