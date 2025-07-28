-- 檢查 sender_name_at_time 欄位是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'friend_requests' AND column_name = 'sender_name_at_time';

-- 檢查欄位是否已被填充
SELECT id, sender_id, receiver_id, sender_name_at_time
FROM friend_requests
LIMIT 10;

-- 檢查觸發器是否存在
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'friend_requests' AND trigger_name = 'trigger_set_sender_name_at_time';

-- 手動更新現有記錄的值（如果需要）
UPDATE friend_requests fr
SET sender_name_at_time = (
  SELECT username
  FROM user_profiles up
  WHERE up.id = fr.sender_id
  LIMIT 1
)
WHERE fr.sender_name_at_time IS NULL; 