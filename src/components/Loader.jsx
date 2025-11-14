// Loader.tsx
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const circleVariants = {
  animate: {
    scale: [1, 1.4, 1],
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const textVariants = {
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const Loader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4">
      <div className="relative flex justify-center items-center w-32 h-32">
        <motion.div
          className="absolute w-32 h-32 rounded-full border-4 border-[#031d4e] dark:border-[#7492DF]"
          variants={circleVariants}
          animate="animate"
        />
        <motion.div
          className="absolute w-20 h-20 rounded-full border-t-4 border-[#031d4e]"
          style={{ borderRightColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "transparent" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        />
        <div className="z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-[#031d4e]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M3 3a1 1 0 000 2h1v10H3a1 1 0 100 2h14a1 1 0 100-2h-1V5h1a1 1 0 100-2H3zm3 2h8v10H6V5z" />
          </svg>
        </div>
      </div>

      <motion.p
        variants={textVariants}
        animate="animate"
        className="mt-8 text-2xl font-bold tracking-wide"
      >
        <span className="truncate font-semibold"><span className="text-[#031d4e] dark:text-[#7492DF]">{t("title.Ra7al")}</span> <span className="text-[#031d4e]">{t("title.Express")}</span></span>
      </motion.p>
    </div>
  );
};

export default Loader;
