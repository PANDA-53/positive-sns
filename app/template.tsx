"use client";

import { motion, AnimatePresence, Variants, Transition } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

const iosTransition: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 30,
  mass: 1,
};

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [direction, setDirection] = useState<"push" | "pop">("push");

  useEffect(() => {
    // パスの長さや特定のルールで方向を決定
    if (prevPathname.current.length > pathname.length || pathname === "/") {
      setDirection("pop");
    } else {
      setDirection("push");
    }
    prevPathname.current = pathname;
  }, [pathname]);

  const variants: Variants = {
    initial: (custom: "push" | "pop") => ({
      x: custom === "push" ? "100%" : "-30%",
      opacity: custom === "push" ? 1 : 0.6,
      zIndex: custom === "push" ? 20 : 10,
    }),
    animate: {
      x: 0,
      opacity: 1,
      zIndex: 15,
      transition: iosTransition,
    },
    exit: (custom: "push" | "pop") => ({
      x: custom === "push" ? "-30%" : "100%",
      opacity: custom === "push" ? 0.6 : 1,
      zIndex: custom === "push" ? 10 : 20,
      transition: iosTransition,
    }),
  };

  return (
    // アニメーションが出ない場合は、まずmodeをデフォルトに戻して検証
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        custom={direction} // directionをvariantsに渡す
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-0 bg-[#F2F2F7] overflow-hidden"
        style={{ willChange: "transform, opacity" }}
      >
        <div className="w-full h-full overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}