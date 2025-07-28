-- 為friend_requests表添加sender_name_at_time欄位，用於存儲發送請求時的用戶名
ALTER TABLE friend_requests ADD COLUMN IF NOT EXISTS sender_name_at_time TEXT;

-- 為現有的請求填充用戶名（從user_profiles表獲取）
UPDATE friend_requests fr
SET sender_name_at_time = (
  SELECT username
  FROM user_profiles up
  WHERE up.id = fr.sender_id
  LIMIT 1
)
WHERE fr.sender_name_at_time IS NULL;

-- 創建一個觸發器，在插入新請求時自動填充用戶名
CREATE OR REPLACE FUNCTION set_sender_name_at_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sender_name_at_time := (
    SELECT username
    FROM user_profiles
    WHERE id = NEW.sender_id
    LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_set_sender_name_at_time
BEFORE INSERT ON friend_requests
FOR EACH ROW
EXECUTE FUNCTION set_sender_name_at_time(); 