import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from "@/lib/utils";

// 菜單觸發器
interface MenuTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MenuTrigger: React.FC<MenuTriggerProps> = ({ 
  children, 
  onClick,
  className 
}) => {
  return (
    <div className={cn("inline-flex", className)} onClick={onClick}>
      {children}
    </div>
  );
};

// 菜單內容
interface MenuContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  anchorEl?: HTMLElement | null;
  onClose?: () => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export const MenuContent: React.FC<MenuContentProps> = ({
  children,
  isOpen,
  anchorEl,
  onClose,
  align = 'end',
  className
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const menuRect = menuRef.current?.getBoundingClientRect();
      const menuHeight = menuRect?.height || 0;
      const menuWidth = menuRect?.width || 0;

      let left = 0;
      switch (align) {
        case 'start':
          left = rect.left;
          break;
        case 'center':
          left = rect.left + rect.width / 2 - menuWidth / 2;
          break;
        case 'end':
          left = rect.right - menuWidth;
          break;
      }

      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: Math.max(0, left + window.scrollX)
      });
    }
  }, [isOpen, anchorEl, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (isOpen === false) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "absolute z-50 text-popover-foreground",
        className
      )}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        backgroundColor: 'white',
        // 不再設置 width、padding、border、boxShadow 等
      }}
    >
      {children}
    </div>,
    document.body
  );
};

// 菜單項
interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({ 
  children, 
  onClick,
  className,
  disabled = false 
}) => {
  // 不再設置任何 style，全部交給 className 控制
  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement;
    target.style.backgroundColor = '#f3f4f6';
  };

  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement;
    target.style.backgroundColor = 'transparent';
  };

  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-none text-sm",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
};

// 菜單分隔線
export const MenuSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />;
};

// 主菜單組件
interface MenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Menu: React.FC<MenuProps> = ({ children, className, isOpen: controlledOpen, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  // 受控模式判斷
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange! : setUncontrolledOpen;

  const handleToggle = () => {
    setOpen(!isOpen);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div ref={anchorRef} className={cn("relative inline-flex", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === MenuTrigger) {
            return React.cloneElement(child as React.ReactElement<MenuTriggerProps>, {
              onClick: handleToggle
            });
          } else if (child.type === MenuContent) {
            return React.cloneElement(child as React.ReactElement<MenuContentProps>, {
              isOpen,
              anchorEl: anchorRef.current,
              onClose: handleClose
            });
          }
          return child;
        }
        return null;
      })}
    </div>
  );
}; 