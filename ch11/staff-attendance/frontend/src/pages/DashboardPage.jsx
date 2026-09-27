import { Card, Button, useToast } from '../components/ui/index.js'
import { useAttendanceToday } from '../hooks/useAttendanceToday.js'
import { formatDate, formatTime } from '../utils/date.js'
import { getErrorMessage } from '../utils/apiError.js'

function todayLabel() {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const now = new Date()
  return `${formatDate(now)} (${days[now.getDay()]})`
}

export default function DashboardPage() {
  const { showToast } = useToast()
  const { todayRecord, workedDays, remainingDays, checkIn, checkOut } = useAttendanceToday()

  const checkedIn = Boolean(todayRecord?.checkInAt)

  const handleError = (err) => {
    showToast(getErrorMessage(err, '요청에 실패했습니다'), 'error')
  }

  return (
    <main>
      <h1>대시보드</h1>
      <p className="text-body-secondary">{todayLabel()}</p>

      <div className="mb-3">
        <Card title="오늘의 근태">
          <p className="mb-1">체크인 시각 {formatTime(todayRecord?.checkInAt)}</p>
          <p className="mb-3">체크아웃 시각 {formatTime(todayRecord?.checkOutAt)}</p>
          <div className="d-flex gap-2">
            <Button onClick={() => checkIn(undefined, { onError: handleError })} disabled={checkedIn}>
              {checkedIn ? `체크인 완료(${formatTime(todayRecord.checkInAt)})` : '출근 체크인'}
            </Button>
            <Button onClick={() => checkOut(undefined, { onError: handleError })} disabled={!checkedIn}>
              퇴근 체크아웃
            </Button>
          </div>
        </Card>
      </div>

      <Card title="이번 달 요약">
        <p className="mb-1">출근일수: {workedDays}일</p>
        <p className="mb-0">잔여 연차: {remainingDays ?? 0}일</p>
      </Card>
    </main>
  )
}
