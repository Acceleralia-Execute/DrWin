import React from 'react';
import { motion } from 'framer-motion';
import { GrantswinLogo } from '../assets/GrantswinLogo';
import { GrantswinTextLogo } from '../assets/GrantswinTextLogo';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-64 h-64 rounded-full opacity-10 bg-white"
          style={{ top: '10%', left: '10%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full opacity-15 bg-white"
          style={{ bottom: '20%', right: '15%' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div
          className="absolute w-32 h-32 rounded-full opacity-8 bg-white"
          style={{ top: '60%', right: '40%' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.25, 0.08] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>
      <div className="text-center relative z-10">
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="w-20 h-12 filter brightness-0 invert">
            <GrantswinLogo />
          </div>
        </motion.div>
        <motion.div
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
            <div className="flex justify-center mb-2">
                <div className="h-8" style={{ aspectRatio: '277 / 27' }}>
                    <GrantswinTextLogo grantsClass="fill-white" winFill="white" />
                </div>
            </div>
          <p className="text-white text-lg opacity-90">Cargando tu experiencia de IA...</p>
        </motion.div>
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="relative">
            <motion.div
              className="w-16 h-16 border-4 border-white/20 rounded-full"
              style={{ borderTopColor: 'white' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
        <motion.div
          className="flex justify-center space-x-2 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;