import React from 'react';

interface AuthInputsProps {
  email: string;
  password: string;
  isLoading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AuthInputs({ 
  email, 
  password, 
  isLoading, 
  onEmailChange, 
  onPasswordChange 
}: AuthInputsProps) {
  const inputStyle = {
    fontSize: '14px', 
    borderColor: '#1694da',
  };

  const placeholderStyle = `
    input::placeholder {
      color: #1694da;
      opacity: 1;
    }
  `;

  return (
    <>
      <style>{placeholderStyle}</style>
      <div className="relative" style={{ width: '270px' }}>
        <input
          type="email"
          value={email}
          onChange={onEmailChange}
          placeholder="電子信箱"
          className="w-full bg-transparent border-b pb-2 text-black focus:outline-none rounded-none"
          style={inputStyle}
          required
          disabled={isLoading}
          autoComplete="off"
          name="email"
        />
      </div>

      <div className="relative" style={{ width: '270px' }}>
        <input
          type="password"
          value={password}
          onChange={onPasswordChange}
          placeholder="輸入密碼"
          className="w-full bg-transparent border-b pb-2 text-black focus:outline-none rounded-none"
          style={inputStyle}
          required
          disabled={isLoading}
          autoComplete="new-password"
          name="password"
        />
      </div>
    </>
  );
}
