# Firebase Storage 手動修復指南

我們已經應用了基本修復，但如果仍有錯誤，請按照以下步驟手動修改Firebase源碼文件。

## 1. 修復 Storage? 錯誤

找到 Xcode 中報錯的 StorageReference 相關文件（可能位於 `ios/App/Pods/FirebaseStorage/FirebaseStorage/Sources/` 目錄下），然後按照以下方式修改：

找到這樣的代碼：

```swift
let storage = reference.storage
```

修改為：

```swift
let storage = reference.storage!  // 使用強制解包
```

或者更安全的方式：

```swift
guard let storage = reference.storage else {
  // 適當的錯誤處理，可能是返回nil或拋出錯誤
  return nil
}
```

## 2. 修復 AuthInterop 和 AppCheckInterop 錯誤

在 `Storage.swift` 文件中，找到類似這樣的代碼：

```swift
let authInterop = auth as? AuthInterop
```

修改為：

```swift
let authInterop = auth as? any AuthInterop
```

或者：

```swift
let authInterop = auth as? AuthInterop as AnyObject
```

## 3. 如果上述修改不起作用，直接使用我們的擴展

確保使用我們提供的 `StorageForcedUnwrap.swift` 中的擴展方法來規避錯誤：

```swift
// 使用這個而不是直接使用 reference.storage
let storage = reference.unwrappedStorage

// 或者使用這個方法
let storage = reference.getStorage()

// 創建引用時使用這個方法
let ref = Storage.createReference(path: "path/to/file")
```

## 4. 禁用腳本構建階段警告（在 Xcode 中手動操作）

1. 在 Xcode 中選擇 App 目標
2. 選擇 Build Phases 標籤
3. 對於每個腳本階段：
   - 展開 "[CP] Embed Pods Frameworks" 和 "[CP] Check Pods Manifest.lock"
   - 取消選中 "Based on dependency analysis"（如果有）
   - 清空 "Input Files" 和 "Output Files" 部分

## 重要提示

- Firebase 腳本構建階段警告很常見，即使有這些警告，應用程序仍然可以運行。
- 修改 Firebase 源碼後，如果更新 Pod 或 Firebase 版本，可能需要重新應用這些修復。
- 考慮使用我們的擴展方法，這樣可以避免直接修改 Firebase 源碼。

如果以上方法仍不能解決問題，您可能需要考慮降級 Firebase SDK 版本或切回 Supabase。 