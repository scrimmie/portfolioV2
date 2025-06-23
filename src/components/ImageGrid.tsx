import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import image from "../assets/camera.svg"; // Keeping import commented for future use

export const ImageGrid = ({ imageSources }: { imageSources: string[] }) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggleCard = (image: string) => {
    setActiveCard(activeCard === image ? null : image);
  };

  return (
    <>
      <AnimatePresence>
        <div className="grid w-full h-full grid-cols-3 pointer-events-auto">
          {imageSources.map((image, key) => (
            <motion.img
              className="container items-center justify-center aspect-square object-cover h-full"
              src={image}
              whileHover={{ scale: 1.025, transition: { duration: 0.5 } }}
              layout
              alt=""
              key={key}
              onClick={() => toggleCard(image)}
              layoutId={"image" + key}
            />
          ))}
        </div>
        {activeCard !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex justify-center items-center bg-white"
            key="fullImage"
            onClick={() => toggleCard(activeCard)}
          >
            <img src={activeCard} className="max-w-full max-h-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
