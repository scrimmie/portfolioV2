import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const ImageGrid = ({ imageSources }: { imageSources: string[] }) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggleCard = (image: string) => {
    setActiveCard(activeCard === image ? null : image);
  };

  return (
    <>
      <div className="grid w-full h-full grid-cols-2 sm:grid-cols-3 pointer-events-auto">
        {imageSources.map((image, index) => (
          <motion.img
            className="container items-center justify-center aspect-square object-cover h-full"
            src={image}
            whileHover={{ scale: 1.025, transition: { duration: 0.5 } }}
            layout
            alt={`Photograph ${index + 1} by David D'Apice`}
            key={image}
            onClick={() => toggleCard(image)}
            layoutId={`image-${image}`}
          />
        ))}
      </div>

      <AnimatePresence>
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
            <img
              src={activeCard}
              alt="Enlarged photograph by David D'Apice"
              className="max-w-full max-h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
