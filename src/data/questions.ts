export type Question = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type Subject = {
  id: string
  label: string
  questions: Question[]
}

export const SUBJECTS: Subject[] = [
  {
    id: 'network',
    label: '網路基礎',
    questions: [
      {
        id: 'nw-1',
        prompt: 'OSI 七層模型中，負責端到端傳輸與重傳控制的是哪一層？',
        options: ['應用層', '傳輸層', '網路層', '資料連結層'],
        correctIndex: 1,
        explanation: '傳輸層（TCP/UDP）負責端到端傳輸、流量控制與重傳機制。',
      },
      {
        id: 'nw-2',
        prompt: '在同一個區域網路內，主機通常先透過哪個協定解析目標 MAC 位址？',
        options: ['DNS', 'DHCP', 'ARP', 'ICMP'],
        correctIndex: 2,
        explanation: 'ARP 用來把已知的 IP 位址解析成 MAC 位址。',
      },
      {
        id: 'nw-3',
        prompt: 'IPv4 位址長度為幾個位元（bit）？',
        options: ['16', '32', '64', '128'],
        correctIndex: 1,
        explanation: 'IPv4 是 32-bit，IPv6 才是 128-bit。',
      },
      {
        id: 'nw-4',
        prompt: '子網路遮罩 255.255.255.0 對應的 CIDR 是？',
        options: ['/16', '/24', '/28', '/32'],
        correctIndex: 1,
        explanation: '255.255.255.0 共有 24 個連續 1，故為 /24。',
      },
    ],
  },
  {
    id: 'database',
    label: '資料庫基礎',
    questions: [
      {
        id: 'db-1',
        prompt: '哪個 SQL 指令用於查詢資料？',
        options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'],
        correctIndex: 2,
        explanation: 'SELECT 用於讀取資料表中的資料。',
      },
      {
        id: 'db-2',
        prompt: '主鍵（Primary Key）的主要目的為何？',
        options: ['提升畫面美觀', '唯一識別每筆資料', '壓縮資料庫大小', '加速網路傳輸'],
        correctIndex: 1,
        explanation: '主鍵確保每筆資料唯一，避免重複或無法定位資料。',
      },
      {
        id: 'db-3',
        prompt: '若要過濾查詢結果，應使用哪個子句？',
        options: ['GROUP BY', 'ORDER BY', 'WHERE', 'HAVING'],
        correctIndex: 2,
        explanation: 'WHERE 用於先過濾列，再進行排序或分組。',
      },
      {
        id: 'db-4',
        prompt: '以下哪個描述最符合「索引」的用途？',
        options: ['儲存備份檔案', '加速查詢定位資料', '限制欄位長度', '建立外鍵關聯'],
        correctIndex: 1,
        explanation: '索引可降低掃描成本，提升查詢速度。',
      },
    ],
  },
  {
    id: 'security',
    label: '資訊安全',
    questions: [
      {
        id: 'sec-1',
        prompt: '為降低密碼外洩風險，最推薦儲存方式是？',
        options: ['明文儲存', 'Base64 編碼', '雜湊加鹽（salted hash）', '存成圖片'],
        correctIndex: 2,
        explanation: '密碼應使用雜湊演算法並加鹽，避免明文與彩虹表攻擊。',
      },
      {
        id: 'sec-2',
        prompt: 'HTTPS 的主要作用是？',
        options: ['提高 CPU 效能', '加密傳輸內容與驗證身分', '減少網站功能', '替代 DNS'],
        correctIndex: 1,
        explanation: 'HTTPS（TLS）提供傳輸加密、完整性與伺服器身分驗證。',
      },
      {
        id: 'sec-3',
        prompt: '二步驟驗證（2FA）屬於哪一類安全機制？',
        options: ['授權管理', '多因子驗證', '資料備份', '流量壓縮'],
        correctIndex: 1,
        explanation: '2FA 透過兩種不同因子驗證，降低帳號被盜風險。',
      },
      {
        id: 'sec-4',
        prompt: '最小權限原則（Least Privilege）強調的是？',
        options: ['每個帳號都給管理員權限', '權限越多越方便', '僅授予執行工作所需最低權限', '忽略角色管理'],
        correctIndex: 2,
        explanation: '最小權限原則可降低誤用與被入侵後的影響範圍。',
      },
    ],
  },
]
