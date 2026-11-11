// IndexedDB에 ISS 좌표를 저장한다. 키는 timestamp(ms)이므로 시간 범위 조회/삭제가 쉽다.
const DB_NAME = 'iss-tracker'
const DB_VERSION = 1
const STORE = 'positions'

export const RETENTION_MS = 4 * 60 * 60 * 1000

let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'timestamp' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
    })
  }
  return dbPromise
}

function run(mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const result = work(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(result?.result)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      }),
  )
}

export function savePosition({ timestamp, lat, lon }) {
  return run('readwrite', (store) => store.put({ timestamp, lat, lon }))
}

// 보관 기간(4시간)이 지난 좌표를 삭제한다.
export function pruneOldPositions(now = Date.now()) {
  return run('readwrite', (store) => store.delete(IDBKeyRange.upperBound(now - RETENTION_MS, true)))
}

// 오래된 좌표를 정리한 뒤, 최근 4시간 좌표를 시간순으로 반환한다.
export async function loadRecentPositions(now = Date.now()) {
  await pruneOldPositions(now)
  const rows = await run('readonly', (store) => store.getAll(IDBKeyRange.lowerBound(now - RETENTION_MS)))
  return rows ?? []
}
