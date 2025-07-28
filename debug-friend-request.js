console.log(`
要調試朋友請求卡片頭像問題，請在瀏覽器控制台中執行以下腳本：

// 詳細檢查好友請求和頭像的關係
async function debugFriendRequestAvatar() {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    console.error('請先登入應用才能查詢');
    return;
  }
  
  console.log('正在查詢好友請求和頭像關係...');
  
  // 1. 查詢所有好友請求
  const { data: requests, error: requestError } = await window.supabase
    .from('friend_requests')
    .select('*');
    
  if (requestError) {
    console.error('查詢好友請求失敗:', requestError);
    return;
  }
  
  console.log('找到 ' + requests.length + ' 個好友請求');
  
  // 2. 收集所有發送者和接收者的ID
  const userIds = new Set();
  requests.forEach(req => {
    if (req.sender_id) userIds.add(req.sender_id);
    if (req.receiver_id) userIds.add(req.receiver_id);
  });
  
  console.log('相關用戶IDs:', Array.from(userIds));
  
  // 3. 查詢所有相關用戶的配置檔案
  const { data: profiles, error: profileError } = await window.supabase
    .from('user_profiles')
    .select('*')
    .in('id', Array.from(userIds));
    
  if (profileError) {
    console.error('查詢用戶配置檔案失敗:', profileError);
    return;
  }
  
  // 4. 查詢所有相關用戶的頭像
  const { data: avatars, error: avatarError } = await window.supabase
    .from('user_avatars')
    .select('*')
    .in('user_id', Array.from(userIds));
    
  if (avatarError) {
    console.error('查詢用戶頭像失敗:', avatarError);
    return;
  }
  
  // 5. 創建用戶ID到配置檔案和頭像的映射
  const userMap = {};
  profiles.forEach(profile => {
    if (!userMap[profile.id]) userMap[profile.id] = {};
    userMap[profile.id].profile = profile;
  });
  
  avatars.forEach(avatar => {
    if (!userMap[avatar.user_id]) userMap[avatar.user_id] = {};
    userMap[avatar.user_id].avatar = avatar;
  });
  
  // 6. 對每個請求，檢查發送者和接收者的資料
  const enrichedRequests = requests.map(req => {
    const senderInfo = userMap[req.sender_id] || {};
    const receiverInfo = userMap[req.receiver_id] || {};
    
    return {
      requestId: req.id,
      status: req.status,
      created_at: req.created_at,
      sender: {
        id: req.sender_id,
        username: senderInfo.profile?.username,
        avatar_url: senderInfo.profile?.avatar_url,
        avatar_details: senderInfo.avatar
      },
      receiver: {
        id: req.receiver_id,
        username: receiverInfo.profile?.username,
        avatar_url: receiverInfo.profile?.avatar_url,
        avatar_details: receiverInfo.avatar
      }
    };
  });
  
  // 7. 顯示詳細資訊
  console.log('========== 好友請求詳細資訊 ==========');
  enrichedRequests.forEach((req, index) => {
    console.log(\`請求 #\${index + 1} (ID: \${req.requestId}, 狀態: \${req.status || 'pending'})\`);
    console.log('發送者:', req.sender);
    console.log('接收者:', req.receiver);
    console.log('-------------------');
  });
  
  // 8. 返回查詢結果供進一步分析
  return {
    requests: enrichedRequests,
    userMap,
    originalRequests: requests,
    originalProfiles: profiles,
    originalAvatars: avatars
  };
}

// 執行調試功能
const debugData = await debugFriendRequestAvatar();

// 找出頭像問題的請求
function findAvatarIssues(debugData) {
  if (!debugData || !debugData.requests) {
    console.error('沒有可用的調試數據');
    return [];
  }
  
  const issues = [];
  
  debugData.requests.forEach((req, index) => {
    // 檢查發送者是否有頭像問題
    const sender = req.sender;
    if (sender && sender.id) {
      if (!sender.avatar_url && !sender.avatar_details) {
        issues.push({
          type: 'sender_missing_avatar',
          requestIndex: index,
          requestId: req.requestId,
          userId: sender.id,
          username: sender.username
        });
      } else if (sender.avatar_url && sender.avatar_details && 
                sender.avatar_url !== sender.avatar_details.avatar_url_48 && 
                sender.avatar_url !== sender.avatar_details.avatar_url_30 && 
                sender.avatar_url !== sender.avatar_details.avatar_url_96) {
        issues.push({
          type: 'sender_avatar_mismatch',
          requestIndex: index,
          requestId: req.requestId,
          userId: sender.id,
          username: sender.username,
          profileAvatar: sender.avatar_url,
          avatarDetails: sender.avatar_details
        });
      }
    }
  });
  
  console.log(\`發現 \${issues.length} 個頭像問題\`);
  issues.forEach((issue, i) => {
    console.log(\`問題 #\${i+1}: \${issue.type} - 用戶 \${issue.username || issue.userId}\`);
  });
  
  return issues;
}

// 找出有問題的頭像
const avatarIssues = findAvatarIssues(debugData);

// 額外的修復功能 - 自動修復所有發現的問題
async function autoFixAllAvatarIssues() {
  if (!debugData || !avatarIssues || avatarIssues.length === 0) {
    console.log('沒有需要修復的頭像問題');
    return;
  }
  
  console.log(\`開始修復 \${avatarIssues.length} 個頭像問題...\`);
  
  const results = [];
  for (const issue of avatarIssues) {
    try {
      const userId = issue.userId;
      if (!userId) continue;
      
      // 獲取用戶配置檔案
      const { data: profile } = await window.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (!profile || !profile.avatar_url) {
        console.log(\`用戶 \${userId} 沒有頭像URL\`);
        continue;
      }
      
      // 檢查user_avatars表中是否有記錄
      const { data: avatar, error } = await window.supabase
        .from('user_avatars')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      let result;
      if (error && error.code === 'PGRST116') {
        // 沒有找到記錄，創建新記錄
        const { data: newAvatar, error: insertError } = await window.supabase
          .from('user_avatars')
          .insert({
            user_id: userId,
            avatar_url_96: profile.avatar_url,
            avatar_url_48: profile.avatar_url,
            avatar_url_30: profile.avatar_url,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error(\`創建頭像記錄失敗 (用戶 \${userId}):\`, insertError);
          result = { success: false, userId, error: insertError };
        } else {
          console.log(\`成功創建頭像記錄 (用戶 \${userId}):\`, newAvatar);
          result = { success: true, userId, action: 'created', data: newAvatar };
        }
      } else if (avatar) {
        // 更新現有記錄
        const { data: updatedAvatar, error: updateError } = await window.supabase
          .from('user_avatars')
          .update({
            avatar_url_96: profile.avatar_url,
            avatar_url_48: profile.avatar_url,
            avatar_url_30: profile.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();
          
        if (updateError) {
          console.error(\`更新頭像記錄失敗 (用戶 \${userId}):\`, updateError);
          result = { success: false, userId, error: updateError };
        } else {
          console.log(\`成功更新頭像記錄 (用戶 \${userId}):\`, updatedAvatar);
          result = { success: true, userId, action: 'updated', data: updatedAvatar };
        }
      }
      
      results.push(result);
    } catch (error) {
      console.error('修復過程中發生錯誤:', error);
      results.push({ success: false, error });
    }
  }
  
  return results;
}

// 強制更新React Query緩存
function clearAllCaches() {
  try {
    // 找到全局React Query客戶端
    let queryClient = null;
    if (window.__REACT_QUERY_GLOBAL_CLIENT__) {
      queryClient = window.__REACT_QUERY_GLOBAL_CLIENT__;
    }
    
    if (!queryClient) {
      console.warn('找不到React Query客戶端，嘗試在組件中尋找');
      
      // 嘗試另一種方法獲取React Query客戶端
      const reactInternals = Object.keys(window).find(key => 
        key.startsWith('__REACT_DEVTOOLS_GLOBAL_HOOK__') || 
        key.startsWith('_reactListening') ||
        key.startsWith('__reactContainer')
      );
      
      if (reactInternals) {
        console.log('找到React相關對象，但無法直接訪問React Query客戶端');
      }
      
      console.log('使用替代方法：手動重新載入頁面');
      return false;
    }
    
    // 清除所有查詢緩存
    queryClient.resetQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    console.log('已清除friend-requests相關緩存');
    
    // 嘗試清除其他可能相關的緩存
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['avatar'] });
    console.log('已清除user和avatar相關緩存');
    
    return true;
  } catch (error) {
    console.error('清除緩存時出錯:', error);
    return false;
  }
}

// 完整的修復流程
async function fixAndRefresh() {
  try {
    console.log('開始執行完整修復流程...');
    
    // 1. 修復所有頭像問題
    const fixResults = await autoFixAllAvatarIssues();
    console.log('修復結果:', fixResults);
    
    // 2. 清除所有緩存
    const cacheCleared = clearAllCaches();
    console.log('緩存清除結果:', cacheCleared);
    
    // 3. 如果需要，刷新頁面
    if (!cacheCleared) {
      console.log('建議手動刷新頁面以應用所有更改');
    }
    
    return {
      fixResults,
      cacheCleared
    };
  } catch (error) {
    console.error('修復流程失敗:', error);
    return {
      success: false,
      error
    };
  }
}

// 使用說明
console.log(\`
調試和修復指令:
1. 檢查所有好友請求和頭像: await debugFriendRequestAvatar()
2. 查找頭像問題: findAvatarIssues(debugData)
3. 自動修復所有頭像問題: await autoFixAllAvatarIssues()
4. 清除所有緩存: clearAllCaches()
5. 執行完整修復流程: await fixAndRefresh()

例如，要執行完整的修復流程，請輸入: await fixAndRefresh()
\`);

// 自動執行修復流程（如需立即執行）
// await fixAndRefresh();
`); 