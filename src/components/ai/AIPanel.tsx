import { ChatArea } from './ChatPanel/ChatArea';

export const AIPanel = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatArea compact showHeader={false} />
    </div>
  );
};
