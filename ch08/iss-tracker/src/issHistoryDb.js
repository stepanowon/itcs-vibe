const DB_NAME = 'iss-tracker'
const STORE = 'points'
const RETENTION_MS = 4 * 60 * 60 * 1000 // 4시간

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        const store = req.result.createObjectStore(STORE, { keyPath: 'timestamp' })
        store.createIndex('timestamp', 'timestamp')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

// timestamp: 초 단위 UNIX time (open-notify 응답과 동일 단위)
export async function addPoint({ timestamp, lat, lon }) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').put({ timestamp, lat, lon })
    req.onsuccess = resolve
    req.onerror = () => reject(req.error)
  })
  await pruneOld(db)
  db.close()
}

async function pruneOld(db) {
  const cutoff = Date.now() / 1000 - RETENTION_MS / 1000
  const store = tx(db, 'readwrite')
  const range = IDBKeyRange.upperBound(cutoff)
  await new Promise((resolve, reject) => {
    const req = store.index('timestamp').openCursor(range)
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getRecentPoints() {
  const db = await openDb()
  const cutoff = Date.now() / 1000 - RETENTION_MS / 1000
  const points = await new Promise((resolve, reject) => {
    const range = IDBKeyRange.lowerBound(cutoff)
    const req = tx(db, 'readonly').index('timestamp').getAll(range)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return points.sort((a, b) => a.timestamp - b.timestamp)
}
