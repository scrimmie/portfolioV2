import { motion } from "framer-motion";

export const AnimatedText = ({
  className,
  text,
}: {
  className: string;
  text: string;
}) => {
  return (
    <motion.h2
      className={className + " h-fit whitespace-normal sm:whitespace-nowrap"}
      initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
      animate={{
        clipPath: "inset(0 0% 0 0)",
        opacity: 1,
      }}
      transition={{ duration: 0.75 }}
    >
      {text}
    </motion.h2>
  );
};
