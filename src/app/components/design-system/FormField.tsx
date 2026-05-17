import React from 'react';
import { motion } from 'motion/react';

type FormFieldProps = {
  children: React.ReactNode;
  index?: number;
  className?: string;
};

export const FormField: React.FC<FormFieldProps> = ({ children, index = 0, className }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.08 + index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
};
