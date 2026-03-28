export const fadeInItem = (i = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" },
});

export const glowHover = {
  whileHover: {
    boxShadow: "0 0 25px rgba(229,9,20,0.3)",
    borderColor: "rgba(229,9,20,0.5)",
  },
  transition: { duration: 0.3, ease: "easeOut" },
};
