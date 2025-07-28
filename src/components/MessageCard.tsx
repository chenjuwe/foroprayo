import React, { useState } from 'react';
import { UserAvatar } from './profile/UserAvatar';
import MessageIcon from '@/assets/icons/MessageIcon.svg';

interface MessageCardProps {
  userId: string;
  username: string;
  avatarUrl?: string;
}

export const MessageCard: React.FC<MessageCardProps> = ({ userId, username, avatarUrl }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    // TODO: 實際訊息送出邏輯
    setTimeout(() => {
      setSending(false);
      setMessage('');
      alert('訊息已送出！');
    }, 500);
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-md border mb-4">
      <UserAvatar userId={userId} username={username} />
      <div className="flex-1">
        <div className="font-bold text-black mb-1 flex items-center gap-1">
          <img src={MessageIcon} alt="訊息" className="w-4 h-4" />
          <span>{username}</span>
        </div>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            className="flex-1 border rounded px-2 py-1 text-sm"
            placeholder="輸入訊息..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={sending}
          />
          <button
            className="bg-blue-400 text-white rounded px-3 py-1 text-sm disabled:opacity-60"
            onClick={handleSend}
            disabled={sending || !message.trim()}
          >
            {sending ? '傳送中...' : '送出'}
          </button>
        </div>
      </div>
    </div>
  );
}; 