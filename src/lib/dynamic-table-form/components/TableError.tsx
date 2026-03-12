import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TableErrorProps {
  error: string | null;
}

export const TableError: React.FC<TableErrorProps> = ({ error }) => {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-2.5 text-sm text-destructive font-medium">
            {error}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
