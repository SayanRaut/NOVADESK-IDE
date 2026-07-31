import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';

export const ChatPanel = () => {
  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList />
      <div className="flex-1 min-w-0">
        <ChatArea showHeader={true} />
      </div>
    </div>
  );
};
