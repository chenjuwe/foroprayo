import Foundation
import FirebaseStorage

// 擴展 StorageReference 以解決強制解包問題
extension StorageReference {
    // 安全獲取 storage 屬性
    var unwrappedStorage: Storage {
        // 強制解包，但在擴展中集中處理
        return self.storage!
    }
    
    // 函數形式獲取 storage
    func getStorage() -> Storage {
        return self.storage!
    }
}

// 靜態輔助方法
class FirebaseFixer {
    // 創建 StorageReference 的輔助方法
    static func createReference(path: String) -> StorageReference {
        return Storage.storage().reference().child(path)
    }
    
    // 修復 StorageProvider 問題
    static func fixStorageProvider(_ provider: Any?) -> Storage? {
        guard let provider = provider as? StorageProvider else { return nil }
        return provider.storage
    }
    
    // 修復 AuthInterop 問題
    static func fixAuthInterop(_ auth: Any?) -> AnyObject? {
        return auth as? AuthInterop as AnyObject
    }
    
    // 修復 AppCheckInterop 問題
    static func fixAppCheckInterop(_ appCheck: Any?) -> AnyObject? {
        return appCheck as? AppCheckInterop as AnyObject
    }
} 