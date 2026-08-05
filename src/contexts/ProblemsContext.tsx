import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';

type ProblemsContextType = {
  problems: Record<string, any[]>;
  setProblems: Dispatch<SetStateAction<Record<string, any[]>>>;
};

const ProblemsContext = createContext<ProblemsContextType | undefined>(undefined);

export const ProblemsProvider = ({ children }: { children: ReactNode }) => {
  const [problems, setProblems] = useState<Record<string, any[]>>({});
  
  return (
    <ProblemsContext.Provider value={{ problems, setProblems }}>
      {children}
    </ProblemsContext.Provider>
  );
};

export const useProblems = () => {
  const context = useContext(ProblemsContext);
  if (context === undefined) {
    throw new Error('useProblems must be used within a ProblemsProvider');
  }
  return context;
};
