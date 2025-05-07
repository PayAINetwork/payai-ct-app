import React, { useState, useEffect, ReactElement } from 'react';
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

interface SummaryProps {
  children: React.ReactNode[];
}

interface TimestampProps {
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ sections, currentState }) => {
  // Default: no panel open until we verify currentState matches a section key
  const [openKey, setOpenKey] = useState<string>('');

  useEffect(() => {
    // Expand only if currentState corresponds to an existing section key
    const match = sections.find(s => s.key === currentState);
    if (match) {
      setOpenKey(currentState);
    }
  }, [currentState, sections]);

  const toggle = (key: string) => {
    setOpenKey(prev => (prev === key ? '' : key));
  };

  const extractContent = (summary: React.ReactNode): { content: React.ReactNode; timestamp: React.ReactNode } => {
    if (!React.isValidElement(summary)) {
      return { content: summary, timestamp: null };
    }

    const element = summary as ReactElement<SummaryProps>;
    if (!element.props?.children || !Array.isArray(element.props.children)) {
      return { content: summary, timestamp: null };
    }

    const timestampElement = element.props.children[1] as ReactElement<TimestampProps>;
    if (!React.isValidElement(timestampElement) || !timestampElement.props?.children) {
      return { content: element.props.children[0], timestamp: null };
    }

    return {
      content: element.props.children[0],
      timestamp: timestampElement.props.children
    };
  };

  return (
    <div className="w-full">
      {sections.map(({ key, title, summary, detail }) => {
        const { content, timestamp } = extractContent(summary);
        return (
          <div key={key} className="border-b">
            <button
              type="button"
              className={`w-full flex flex-col p-4 focus:outline-none ${
                openKey === key ? 'bg-gradient-to-r from-purple-100 to-blue-100' : 'bg-white'
              }`}
              aria-expanded={openKey === key}
              onClick={() => toggle(key)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-lg">{title}</span>
                <span className="text-sm text-gray-600">{content}</span>
              </div>
              {timestamp && (
                <div className="text-xs text-gray-500 mt-1 text-left">
                  {timestamp}
                </div>
              )}
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
        );
      })}
    </div>
  );
};

export default AccordionSection; 