import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SectionItem {
  key: string;
  title: string;
  summary: React.ReactNode;
  detail: React.ReactNode;
}

export interface AccordionSectionProps {
  sections: SectionItem[];
  currentState: string;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ sections, currentState }) => {
  const [openKey, setOpenKey] = useState<string>(currentState);

  useEffect(() => {
    // auto-collapse old and expand new section on state change when page is focused
    setOpenKey(currentState);
  }, [currentState]);

  const toggle = (key: string) => {
    setOpenKey(prev => (prev === key ? '' : key));
  };

  return (
    <div className="w-full">
      {sections.map(({ key, title, summary, detail }) => (
        <div key={key} className="border-b">
          <button
            type="button"
            className={`w-full flex justify-between items-center p-4 focus:outline-none ${
              openKey === key ? 'bg-gradient-to-r from-purple-100 to-blue-100' : 'bg-white'
            }`}
            aria-expanded={openKey === key}
            onClick={() => toggle(key)}
          >
            <div>
              <div className="font-medium text-lg">{title}</div>
              <div className="text-sm text-gray-600">{summary}</div>
            </div>
            <span className="text-xl">{openKey === key ? '-' : '+'}</span>
          </button>
          <AnimatePresence initial={false}>
            {openKey === key && (
              <motion.div
                key="content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={{
                  open: { height: 'auto', opacity: 1 },
                  collapsed: { height: 0, opacity: 0 }
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white">{detail}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default AccordionSection; 