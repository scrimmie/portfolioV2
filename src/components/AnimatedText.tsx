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
      className={className + " h-fit overflow-clip whitespace-nowrap"}
      initial={{ width: 0, opacity: 0 }}
      animate={{
        width: "100%",
        opacity: 100,
      }}
      transition={{ duration: 0.75 }}
    >
      {text}
    </motion.h2>
  );
};
