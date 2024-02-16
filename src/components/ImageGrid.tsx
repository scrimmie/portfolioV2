import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import image from "../assets/camera.svg";

export const ImageGrid = ({ imageSources }: { imageSources: string[] }) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [hoverEngaged, setHoverEngaged] = useState(false);

  const toggleCard = (image: string) => {
    setActiveCard(activeCard === image ? null : image);
  };

  return (
    <>
      <AnimatePresence>
        {!hoverEngaged && activeCard === null && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center flex-col pointer-events-none w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            key="logo"
          >
            <img src={image.src} alt="Camera Logo" className="w-1/3" />
            <h1 className="font-JetbrainsMono text-white mt-4 text-3xl">
              David D'Apice Photography
            </h1>
          </motion.div>
        )}
        <div className="grid w-full h-full grid-cols-3 pointer-events-auto">
          {imageSources.map((image, key) => (
            <motion.img
              className="container items-center justify-center aspect-square object-cover h-full"
              src={image}
              whileHover={{ scale: 1.025, transition: { duration: 0.5 } }}
              onHoverStart={() => setHoverEngaged(true)}
              onHoverEnd={() => setHoverEngaged(false)}
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
