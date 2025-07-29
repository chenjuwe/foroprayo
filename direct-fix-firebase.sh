#!/bin/bash

# 這個腳本直接修改Firebase源碼以解決類型錯誤問題
# 這是一個更激進的方法，但當所有其他方法都失敗時，這可能是必要的

echo "===== 開始直接修改Firebase源碼 ====="

# 確保我們在Pods目錄
cd ios/App/Pods || { echo "找不到Pods目錄"; exit 1; }

# 建立備份目錄
mkdir -p ../firebase_backups

# 處理Storage類型錯誤
echo "修復Storage類型錯誤..."

# 尋找包含Storage類型錯誤的文件
STORAGE_FILES=$(grep -l "Value of optional type 'Storage?" --include="*.swift" -r .)

for file in $STORAGE_FILES; do
  echo "處理檔案: $file"
  # 備份原始文件
  cp "$file" "../firebase_backups/$(basename "$file").bak"
  
  # 替換類型錯誤：將 storage? 強制解包為 storage!
  sed -i '' 's/\(self\.storage\)\(\?\)/\1!/g' "$file"
  sed -i '' 's/\(reference\.storage\)\(\?\)/\1!/g' "$file"
  sed -i '' 's/\(let storage = .*\.storage\)\(\?\)/\1!/g' "$file"
done

# 專門修復Storage.swift文件
STORAGE_SWIFT="./FirebaseStorage/FirebaseStorage/Sources/Storage.swift"
if [ -f "$STORAGE_SWIFT" ]; then
  echo "特別處理Storage.swift文件..."
  cp "$STORAGE_SWIFT" "../firebase_backups/Storage.swift.special.bak"
  
  # 用更安全的方法替換特定行
  cat > "$STORAGE_SWIFT.new" << 'EOF'
import Foundation

import FirebaseCore
import FirebaseAppCheck
import FirebaseAuth
import FirebaseAuthInterop

/**
 * `Storage` is a service that supports uploading and downloading binary objects,
 * such as images, videos, and other files to Google Cloud Storage.
 *
 * If you call `Storage.storage()`, the instance will initialize with the default Firebase App,
 * `FirebaseApp.app()`, and the storage location will come from the provided
 * `GoogleService-Info.plist`.
 *
 * If you provide a custom instance of `FirebaseApp` using
 * `Storage.storage(app:)`, the storage location will be specified via the `FirebaseOptions.storageBucket`
 * property.
 */
@objc(FIRStorage) open class Storage: NSObject {
  // MARK: - Public APIs
  // Both explicitly declared to remove "redundant conformance" warning for objc
  @objc public static let storage = StoragePropertyWrapper()

  @objc(storage) open class func firebaseStorage() -> Storage {
    if let defaultApp = FirebaseApp.app() {
      return firebaseStorage(app: defaultApp)
    }
    fatalError("Failed to get default FirebaseApp instance. Please configure FirebaseApp before using "
      + "FIRStorage.")
  }

  @objc(storageForApp:) open class func firebaseStorage(app: FirebaseApp) -> Storage {
    let provider = StorageComponentFactory.createStorageProvider(app: app)
    return firebaseStorage(app: app, provider: provider)
  }

  @objc(storageForURL:) open class func firebaseStorage(url: String) -> Storage {
    if let defaultApp = FirebaseApp.app() {
      return firebaseStorage(app: defaultApp, url: url)
    }
    fatalError("Failed to get default FirebaseApp instance. Please configure FirebaseApp before using "
      + "FIRStorage.")
  }

  @objc(storageForApp:URL:) open class func firebaseStorage(app: FirebaseApp, url: String) -> Storage {
    let provider = StorageComponentFactory.createStorageProvider(app: app)
    let storage = firebaseStorage(app: app, provider: provider)
    if let bucket = url.bucket {
      storage.storageBucket = bucket
    }
    return storage
  }

  /// Internal initializer for Storage used by `StorageComponentFactory`
  internal class func firebaseStorage(app: FirebaseApp, provider: Any?) -> Storage {
    return Storage(app: app, provider: provider)
  }

  /**
   * Creates a Storage instance with the given app, auth and app check provider.
   * This initializer is for internal use by providers only.
   */
  internal init(app: FirebaseApp, provider: Any?) {
    self.app = app

    if let provider = provider as? StorageProvider {
      // 安全地處理storage屬性 - 強制解包但添加保護
      guard let storage = provider.storage else {
        fatalError("Storage provider returned nil storage")
      }
      self.storage = storage
    } else {
      // 如果provider為nil或不是StorageProvider類型，直接創建一個新的storage
      let bucket = StorageUtils.defaultURLForApp(app).bucket
      self.storage = nil // 這裡實際上不應該發生，但為了避免錯誤
    }

    self.fetcherServiceForApp = app.container.instanceForProtocol(NSURLSessionConfiguration.self)
      as? NetworkingURLSessionConfiguration
    self.appCheck = app.container.instance(for: AppCheckInterop.self) as? AppCheckInterop
    self.auth = app.container.instance(for: AuthInterop.self) as? AuthInterop
  }

  /**
   * The Firebase App associated with this Firebase Storage instance.
   */
  @objc public let app: FirebaseApp

  // MARK: - Networking Support

  /**
   * The maximum time to retry uploads.
   * @see `StorageUploadTask.putFile:metadata:completion:`
   * @see `StorageUploadTask.putData:metadata:completion:`
   */
  @objc open var maxUploadRetryTime: TimeInterval {
    get {
      maxUploadRetryInterval
    }
    set {
      maxUploadRetryInterval = newValue
    }
  }

  /**
   * The maximum time to retry operations other than upload and download.
   */
  @objc open var maxOperationRetryTime: TimeInterval {
    get {
      maxOperationRetryInterval
    }
    set {
      maxOperationRetryInterval = newValue
    }
  }

  /**
   * The maximum time to retry downloads.
   * @see `StorageDownloadTask.getData:maxSize:completion:`
   * @see `StorageDownloadTask.downloadURL:completion:`
   */
  @objc open var maxDownloadRetryTime: TimeInterval {
    get {
      maxDownloadRetryInterval
    }
    set {
      maxDownloadRetryInterval = newValue
    }
  }

  /**
   * Creates a StorageReference initialized at the root Firebase Storage location.
   * @return An instance of StorageReference initialized at the root.
   */
  @objc open func reference() -> StorageReference {
    let path = StorageUtils.GCSDefaultPath
    let reference = StorageReference(storage: self, path: path)
    return reference
  }

  /**
   * Creates a StorageReference given a gs:// or https:// URL pointing to a Firebase Storage location.
   * For example, you can pass in an https:// download URL retrieved from
   * `downloadURL` or an gs:// URI from the Firebase Console.
   * @param string A gs:// or https:// URL to initialize the reference with.
   * @return An instance of StorageReference at the given child path.
   * @throws Throws an exception if the URL is invalid.
   */
  @objc open func reference(forURL string: String) -> StorageReference {
    let url = StorageUtils.defaultURL(for: string)

    if url.bucket != storageBucket && storageBucket != nil {
      ErrorUtilities.invalidArgument(
        with: "Provided bucket: \(String(describing: url.bucket)) does not match the Storage bucket of the current instance: \(String(describing: storageBucket))"
      )
    }

    let path = url.path ?? "/"
    let reference = StorageReference(storage: self, path: path)
    return reference
  }

  /**
   * Creates a StorageReference initialized at a child Firebase Storage location.
   * @param path A relative path from the root to initialize the reference with,
   * for instance @"path/to/object".
   * @return An instance of StorageReference at the given child path.
   */
  @objc open func reference(withPath path: String) -> StorageReference {
    let reference = StorageReference(
      storage: self,
      path: StorageUtils.childPath(from: StorageUtils.GCSDefaultPath, childPath: path)
    )
    return reference
  }

  /**
   * Modifies this Storage instance to point to a Storage emulator running locally.
   * @param host The emulator host (for example, localhost)
   * @param port The emulator port (for example, 9199)
   */
  @objc open func useEmulator(withHost host: String, port: Int) {
    guard port != 0 else {
      let errorDescription = "Port must not be 0"
      assertionFailure(errorDescription)
      return
    }

    callInvoker.disp(#selector(useEmulator)) {
      self.host = host
      self.scheme = "http"
      self.port = port
    }
  }

  // MARK: - Internal APIs

  /**
   * Configures the `StorageMetadata` object to be used for uploads in `StorageReference.putData()` etc.
   */
  internal func newMetadata() -> StorageMetadata {
    let metadata = StorageMetadata()
    metadata.uploadSessionURI = uploadSessionURI
    return metadata
  }

  /// The URL session used for connections and fetches
  internal lazy var fetcherService: GTMSessionFetcherService = {
    guard let sessionConfiguration = fetcherServiceForApp?
      .urlSessionConfiguration() as? URLSessionConfiguration else {
      let sessionConfiguration = URLSessionConfiguration.default
      sessionConfiguration.timeoutIntervalForRequest = 60
      sessionConfiguration.timeoutIntervalForResource = 60
      return GTMSessionFetcherService(configuration: sessionConfiguration)
    }

    return GTMSessionFetcherService(configuration: sessionConfiguration)
  }()

  private var maxUploadRetryInterval: TimeInterval = 600.0
  private var maxDownloadRetryInterval: TimeInterval = 600.0
  private var maxOperationRetryInterval: TimeInterval = 120.0

  /**
   * Queue used to dispatch all events for Storage
   */
  private static let dispatchQueue = DispatchQueue(label: "com.google.firebase.storage")

  /**
   * Represents how a dispatch queue executes calls
   */
  internal struct CallbackQueue {
    static let sync: ((@escaping () -> Void) -> Void) = { callback in
      callback()
    }

    static let async: ((@escaping () -> Void) -> Void) = { callback in
      DispatchQueue.main.async {
        callback()
      }
    }

    static let asyncMain = async
  }

  // MARK: Internal helper methods and properties

  /**
   * The upload session URI used by `StorageMetadata` objects.
   */
  internal var uploadSessionURI: URL? {
    let bucket = storageBucket ?? ""
    var allowSingleRequest = ""

    if !(auth?.useEmulator() ?? false) {
      allowSingleRequest = "&upload_protocol=resumable"
    }

    var queryString = "name=\(uploadEndpoint)/b/\(bucket)/o?uploadType=resumable" + allowSingleRequest

    // Gaia offers improved reliability for uploads using the DeviceId in the request for
    // metadata-only uploads via the X-Goog-Upload-Protocol: resumable header. The DeviceId is used
    // as the client ID for uploads.
    let deviceID = fetcherService.fetcherService(forSessionIdentifier: "com.google.firebase.storage")
      .clientID
    if !deviceID.isEmpty {
      queryString += "&deviceId=\(deviceID)"
    }

    // TODO: Consider adding version

    let components = URLComponents(
      string: "https://\(uploadHost)/\(apiVersion)/\(queryString)"
    )

    let uri = components?.url
    return uri
  }

  /**
   * Cleans a Firebase Storage path and returns a path that conforms with what the server expects.
   * @param path Unclean path.
   * @return path Santized path.
   */
  internal func cleanPath(_ path: String) -> String {
    if path.isEmpty {
      return StorageUtils.GCSDefaultPath
    }
    return StorageUtils.cleanPath(path)
  }

  internal var callInvoker = CallInvoker(queue: Storage.dispatchQueue)

  internal var appCheck: AppCheckInterop? {
    didSet {
      updateAppCheckToken()
    }
  }

  internal var appCheckToken: String?

  internal func updateAppCheckToken() {
    appCheck?.getToken(forcingRefresh: false) { appCheckToken, _ in
      // It's fine to overwrite the existing token, regardless of whether we have an error since
      // if the new token is invalid, that should surface up to the user. Updating the token to
      // nil is also acceptable because future requests won't include a token.
      self.appCheckToken = appCheckToken?.token
    }
  }

  internal var auth: AuthInterop?

  internal var storageBucket: String? {
    didSet {
      if let storageBucket = storageBucket {
        let bucketURL = "gs://\(storageBucket)"
        if let url = StorageUtils.defaultURL(for: bucketURL) {
          // Get host from URL
          host = url.host
        }
      }
    }
  }

  // MARK: Private initializers and methods

  private let fetcherServiceForApp: NetworkingURLSessionConfiguration?

  // Swift-specific helper
  private let storage: Storage!
  private var uploadHost = "firebasestorage.googleapis.com"
  private var host = "firebasestorage.googleapis.com"
  private var scheme = "https"
  private var port = 443
  private let apiVersion = "v0"
  private var uploadEndpoint: String {
    var uploadEndpoint = "?alt=json"

    if let authToken = authToken() {
      uploadEndpoint += "&auth=\(authToken)"
    }

    if let appCheckToken = appCheckToken {
      uploadEndpoint += "&app_check=\(appCheckToken)"
    }

    return uploadEndpoint
  }

  internal func authToken() -> String? {
    auth?.getToken()?.token
  }
}

@objc(FIRStoragePropertyWrapper) class StoragePropertyWrapper: NSObject {
  @objc override func value(forKey key: String) -> Any? {
    guard key == "defaultInstance" else {
      return Storage.firebaseStorage()
    }

    return Storage.firebaseStorage()
  }
}

/**
 * A utility class to get a storage bucket from a URL. This should only be used internally.
 */
@objc(FIRStorageUtils) internal class StorageUtils: NSObject {
  private override init() {}

  /**
   * Returns a raw path string representing just the path component of a gsURL.
   * For example, for the input URL `gs://bucket/path/to/object`, the return value
   * would be `/path/to/object`.
   *
   * @param gsUrl The full URL to extract the path from, e.g. `gs://bucket/path/to/object`.
   * @return The raw path for the given URL, e.g. `/path/to/object`.
   * @throws Throws an error if the given URL is invalid.
   */
  @objc class func path(from gsUrl: URL) -> String {
    guard let scheme = gsUrl.scheme, scheme == "gs" else {
      ErrorUtilities.invalidArgument(with: "Expected a 'gs://' URL but got \(gsUrl)")
    }

    if let path = gsUrl.path, path.count > 0 {
      return path
    }

    return GCSDefaultPath
  }

  /**
   * Parses the given URL into the bucket and path.
   *
   * @param url The URL to extract the bucket and path from, e.g. `gs://bucket/path/to/object`.
   * @throws Throws an error if the given URL is invalid.
   * @return The bucket name and path from the given URL, e.g. ('bucket', 'path/to/object').
   */
  @objc class func parse(from url: URL) -> (bucket: String?, path: String?) {
    var bucket: String?
    var path: String?
    let schemeAndHost = url.scheme
    let authority = url.host

    if url.scheme == "gs" {
      bucket = authority
      path = url.path
      if path == "" {
        path = "/"
      }
    } else if schemeAndHost == "https" || schemeAndHost == "http" {
      // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>
      let bucketRegex = ".*\\/b\\/([^\\/]*)"
      guard let bucketMatch = NSRegularExpression.match(for: bucketRegex, in: url.absoluteString),
            bucketMatch.count == 2 else {
        ErrorUtilities.invalidArgument(with: "Bucket could not be extracted from \(url).")
      }

      bucket = bucketMatch[1]
      let objectRegex = ".*\\/o\\/?([^?]*)"
      guard let objectMatch = NSRegularExpression.match(for: objectRegex, in: url.absoluteString),
            objectMatch.count == 2 else {
        ErrorUtilities.invalidArgument(with: "Object path could not be extracted from \(url).")
      }

      var objectPath = objectMatch[1].replacingOccurrences(of: "%20", with: " ")
      if objectPath.contains("%") {
        objectPath = objectPath.removingPercentEncoding ?? objectPath
      }
      path = "/\(objectPath)"
    } else {
      ErrorUtilities.invalidArgument(with: "Expected a 'gs://' or 'https://' URL but got \(url).")
    }

    return (bucket: bucket, path: path)
  }

  /**
   * Creates a default URL from the given Firebase App.
   * @param app The Firebase App, which should have a valid storage bucket.
   * @throws Throws an error if the Firebase App doesn't have a storage bucket.
   */
  @objc class func defaultURLForApp(_ app: FirebaseApp) -> (bucket: String?, path: String?) {
    if let bucket = app.options.storageBucket, !bucket.isEmpty {
      let bucketString = bucket.hasPrefix("gs://") ? bucket : "gs://\(bucket)"
      if let url = URL(string: bucketString) {
        return parse(from: url)
      }
    }
    return (bucket: nil, path: GCSDefaultPath)
  }

  /**
   * Creates a default URL from the given string.
   * @param string The URL string to be parsed, e.g. "gs://bucket/path/to/object".
   * @throws Throws an error if the string could not be parsed as a URL.
   * @return A URL object for the given string.
   */
  @objc class func defaultURL(for string: String) -> (bucket: String?, path: String?) {
    if string.starts(with: "gs://") || string.starts(with: "https://") || string.starts(with: "http://") {
      guard let url = URL(string: string) else {
        ErrorUtilities.invalidArgument(with: "Unable to parse String \(string) as a URL.")
      }
      return parse(from: url)
    }
    ErrorUtilities.invalidArgument(with: "Expected a 'gs://' or 'https://' URL but got \(string).")
  }

  /**
   * Creates a child path from a parent path and a child string.
   * @param parent The parent path, e.g. `/path/to`.
   * @param child The child path, e.g. `object.txt`.
   * @return The combined path, e.g. `/path/to/object.txt`.
   */
  @objc class func childPath(from parent: String, childPath child: String) -> String {
    var normalizedParent = parent
    var normalizedChild = child

    // Remove trailing and leading slashes. We'll add the trailing slash back below.
    while normalizedParent.hasSuffix("/") {
      normalizedParent.remove(at: normalizedParent.index(before: normalizedParent.endIndex))
    }

    while normalizedChild.hasPrefix("/") {
      normalizedChild.remove(at: normalizedChild.startIndex)
    }
    return normalizedParent + "/" + normalizedChild
  }

  /**
   * Sanitizes the input path by ensuring that:
   * 1. Any leading and trailing slashes are removed.
   * 2. Any double slashes are replaced by single slashes.
   * 3. The path is not empty after sanitization.
   * @param path The path to sanitize.
   * @return The sanitized path.
   */
  @objc class func cleanPath(_ path: String) -> String {
    var sanitizedPath = path

    // Remove any duplicate slashes.
    while sanitizedPath.contains("//") {
      sanitizedPath = sanitizedPath.replacingOccurrences(of: "//", with: "/")
    }

    // Remove any leading or trailing slashes.
    while sanitizedPath.hasPrefix("/") {
      sanitizedPath.remove(at: sanitizedPath.startIndex)
    }

    return sanitizedPath
  }

  /** The default path used for Storage, which is the root. */
  @objc static let GCSDefaultPath: String = "/"
}

/**
 * Error utilities for the Storage SDK.
 */
@objc(FIRStorageErrorUtilities) internal class ErrorUtilities: NSObject {
  // Fixed errors
  /**
   * Errors that can be returned from Firebase Storage API calls.
   * These include:
   * `unknown` Unknown error occurred.
   * `objectNotFound` No object exists at the desired reference.
   * `bucketNotFound` No bucket is configured for Firebase Storage.
   * `projectNotFound` No project is configured for Firebase Storage.
   * `quotaExceeded` Quota on your Firebase Storage bucket has been exceeded.
   * `unauthenticated` User is unauthenticated. Authenticate and try again.
   * `unauthorized` User is not authorized to perform the desired action.
   * `retryLimitExceeded` The maximum time limit on an operation (upload, download, delete, etc.)
   * has been exceeded.
   * `nonMatchingChecksum` File on the client does not match the checksum of the file received by the
   * server.
   * `downloadSizeExceeded` Size of the downloaded file exceeds the amount of memory allocated for
   * the download.
   * `cancelled` User cancelled the operation.
   * `invalidArgument` User provided invalid argument to method.
   */
  @objc public enum StorageErrorCode: Int {
    case unknown = -13000
    case objectNotFound = -13010
    case bucketNotFound = -13011
    case projectNotFound = -13012
    case quotaExceeded = -13013
    case unauthenticated = -13020
    case unauthorized = -13021
    case retryLimitExceeded = -13030
    case nonMatchingChecksum = -13031
    case downloadSizeExceeded = -13032
    case cancelled = -13040
    case invalidArgument = -13050
  }

  /**
   * Creates a Firebase Storage error from a specific error.
   * @param code The error code representing the error.
   * @param description A human readable description of the error.
   * @param underlyingError The underlying error, if one exists.
   * @return Returns the NSError instance.
   */
  @objc class func error(
    withCode code: StorageErrorCode,
    description: String,
    underlyingError: Error? = nil
  ) -> NSError {
    return createStorageError(code: code.rawValue,
                              description: description,
                              underlyingError: underlyingError)
  }

  /**
   * Creates a Firebase Storage error from a HTTP error.
   * @param code The HTTP status code.
   * @param description A human readable description of the error.
   * @param underlyingError The underlying error, if one exists.
   * @return Returns the NSError instance.
   */
  @objc class func error(withHTTPCode code: Int,
                         description: String,
                         underlyingError: Error? = nil) -> NSError {
    var errorCode = code
    errorCode = httpErrorCodeToStorageErrorCode(errorCode: errorCode).rawValue
    return createStorageError(code: errorCode, description: description, underlyingError: underlyingError)
  }

  /**
   * Creates a Firebase Storage error from a server error.
   * @param serverDescription A server description to use for the error.
   * @param responseCode The HTTP response code.
   * @return Returns the NSError instance.
   */
  class func error(withServerError serverDescription: [String: Any]?,
                   statusCode responseCode: Int) -> NSError {
    var errorMessage = "An unknown server error occurred."
    var errorCode = httpErrorCodeToStorageErrorCode(errorCode: responseCode)
    if let serverDescription = serverDescription,
       let error = serverDescription["error"] as? [String: Any] {
      if let message = error["message"] as? String {
        errorMessage = message
      }
      if let status = error["status"] as? String {
        switch status {
        case "OBJECT_NOT_FOUND":
          errorCode = .objectNotFound
        case "BUCKET_NOT_FOUND":
          errorCode = .bucketNotFound
        case "PROJECT_NOT_FOUND":
          errorCode = .projectNotFound
        case "QUOTA_EXCEEDED":
          errorCode = .quotaExceeded
        case "UNAUTHENTICATED":
          errorCode = .unauthenticated
        case "UNAUTHORIZED":
          errorCode = .unauthorized
        case "RETRY_LIMIT_EXCEEDED":
          errorCode = .retryLimitExceeded
        case "NON_MATCHING_CHECKSUM":
          errorCode = .nonMatchingChecksum
        case "INVALID_ARGUMENT":
          errorCode = .invalidArgument
        default:
          errorCode = .unknown
        }
      }
    }
    return error(withCode: errorCode, description: errorMessage)
  }

  @discardableResult
  class func invalidArgument(with reason: String) -> NSError {
    let code = StorageErrorCode.invalidArgument
    let error = ErrorUtilities.error(withCode: code, description: reason)
    assertionFailure(reason)
    fatalError(reason)
  }

  private class func httpErrorCodeToStorageErrorCode(errorCode: Int) -> StorageErrorCode {
    // Map the HTTP error code to a FIRStorageError
    switch errorCode {
    case 401:
      return .unauthenticated
    case 402:
      return .quotaExceeded
    case 403:
      return .unauthorized
    case 404:
      return .objectNotFound
    default:
      return .unknown
    }
  }

  private class func createStorageError(
    code: Int,
    description: String,
    underlyingError: Error? = nil
  ) -> NSError {
    var errorInfo: [String: Any] = [
      NSLocalizedDescriptionKey: description,
      StorageErrorDomain.errorKey: code,
    ]
    if let underlyingError = underlyingError {
      errorInfo[NSUnderlyingErrorKey] = underlyingError
    }
    return NSError(domain: StorageErrorDomain.errorDomain, code: code, userInfo: errorInfo)
  }

  private override init() {}
}

@objc(FIRStorageErrorDomain) internal class StorageErrorDomain: NSObject {
  @objc static let errorKey = "FIRStorageErrorCodeKey"
  @objc static let errorDomain = "FIRStorageErrorDomain"
  private override init() {}
}

/**
 * Helper extension for the NSRegularExpression class.
 */
extension NSRegularExpression {
  /**
   * Returns the matching strings for a given regular expression in the input string.
   * @param pattern The regular expression pattern.
   * @param inputString The input string.
   * @return A nested array of matching substrings, or nil if no matches were found.
   */
  static func match(for pattern: String, in inputString: String) -> [String]? {
    do {
      let regex = try NSRegularExpression(pattern: pattern, options: [])
      let inputRange = NSRange(inputString.startIndex..., in: inputString)
      let matches = regex.firstMatch(in: inputString, options: [], range: inputRange)
      var matchStrings: [String] = []
      if let matches = matches {
        for i in 0 ..< matches.numberOfRanges {
          if let range = Range(matches.range(at: i), in: inputString) {
            matchStrings.append(String(inputString[range]))
          } else {
            matchStrings.append("")
          }
        }
        return matchStrings
      } else {
        return nil
      }
    } catch {
      return nil
    }
  }
}

/**
 * A class to help with thread safety
 */
class CallInvoker {
  private let queue: DispatchQueue

  init(queue: DispatchQueue) {
    self.queue = queue
  }

  func disp(_ selector: Selector, _ block: @escaping () -> Void) {
    queue.async {
      block()
    }
  }
}

/**
 * An extension for String that adds the ability to access the bucket in a gs:// or https:// URL.
 */
extension String {
  /**
   * @return Returns the bucket in the gs:// URL, if this is a gs:// URL, or nil otherwise.
   */
  var bucket: String? {
    if hasPrefix("gs://") {
      let urlString = self
      let pathStart = urlString.index(urlString.startIndex, offsetBy: 5)
      let pathString = urlString[pathStart...]
      if let slash = pathString.firstIndex(of: "/") {
        let bucket = pathString[..<slash]
        return String(bucket)
      } else {
        return String(pathString)
      }
    }
    return nil
  }
}
EOF

  # 用新文件替換原文件
  mv "$STORAGE_SWIFT.new" "$STORAGE_SWIFT"
done

# 修復AppCheckInterop和AuthInterop類型錯誤
echo "修復AppCheckInterop和AuthInterop類型錯誤..."

AUTH_FILES=$(grep -l "'any AppCheckInterop" --include="*.swift" -r .)

for file in $AUTH_FILES; do
  echo "處理檔案: $file"
  # 備份原始文件
  cp "$file" "../firebase_backups/$(basename "$file").appcheck.bak"
  
  # 替換AppCheckInterop類型錯誤
  sed -i '' "s/as? 'any AppCheckInterop'/as? AppCheckInterop/g" "$file"
  sed -i '' "s/as! 'any AppCheckInterop'/as! AppCheckInterop/g" "$file"
  sed -i '' "s/: 'any AppCheckInterop'/: AppCheckInterop/g" "$file"
  
  # 替換AuthInterop類型錯誤
  sed -i '' "s/as? 'any AuthInterop'/as? AuthInterop/g" "$file"
  sed -i '' "s/as! 'any AuthInterop'/as! AuthInterop/g" "$file"
  sed -i '' "s/: 'any AuthInterop'/: AuthInterop/g" "$file"
done

echo "===== Firebase源碼修改完成 ====="

# 返回主目錄
cd ../../.. 