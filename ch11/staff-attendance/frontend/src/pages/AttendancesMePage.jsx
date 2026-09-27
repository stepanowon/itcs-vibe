import { useState } from 'react'
import { Badge } from '../components/ui/index.js'
import { useMyAttendancesList, useMyLeaveRequestsByMonth } from '../hooks/useMyAttendances.js'
import { formatMonth as currentMonth, formatTime } from '../utils/date.js'

// 승인된 연차의 기간(startDate~endDate)을 날짜별로 펼쳐서, 조회 월에 속하고
// 출퇴근 기록이 없는 날짜만 반환한다.
function leaveOnlyDates(approvedLeaves, month, attendanceDates) {
  const dates = []
  for (const leave of approvedLeaves) {
    let cur = new Date(`${leave.startDate}T00:00:00Z`)
    const end = new Date(`${leave.endDate}T00:00:00Z`)
    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10)
      if (dateStr.startsWith(month) && !attendanceDates.has(dateStr)) {
        dates.push(dateStr)
      }
      cur = new Date(cur.getTime() + 86400000)
    }
  }
  return dates
}

export default function AttendancesMePage() {
  const [month, setMonth] = useState(currentMonth())
  const { data: attendances = [] } = useMyAttendancesList(month)
  const { data: leaveRequests = [] } = useMyLeaveRequestsByMonth(month)

  const approvedLeaves = leaveRequests.filter((item) => item.status === 'approved')

  const attendanceDates = new Set(attendances.map((item) => item.workDate))
  const leaveRows = leaveOnlyDates(approvedLeaves, month, attendanceDates).map((workDate) => ({
    id: `leave-${workDate}`,
    workDate,
    checkInAt: null,
    checkOutAt: null,
    isLeave: true,
  }))
  const attendanceRows = [...attendances, ...leaveRows].sort((a, b) => a.workDate.localeCompare(b.workDate))

  return (
    <main>
      <h1>내 근태 현황</h1>

      <div className="mb-3" style={{ maxWidth: 220 }}>
        <label className="form-label">조회 월</label>
        <input type="month" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <h2>출퇴근 기록</h2>
      {attendanceRows.length === 0 ? (
        <p>조회된 근태 기록이 없습니다</p>
      ) : (
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>날짜</th>
              <th>체크인</th>
              <th>체크아웃</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRows.map((item) => (
              <tr key={item.id}>
                <td>{item.workDate}</td>
                <td>{formatTime(item.checkInAt)}</td>
                <td>{formatTime(item.checkOutAt)}</td>
                <td>
                  {item.isLeave ? (
                    <Badge status="inactive">연차</Badge>
                  ) : item.checkOutAt ? (
                    <Badge status="approved">정상</Badge>
                  ) : (
                    <Badge status="warning">미완료</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>연차 사용 내역</h2>
      <table className="table table-striped align-middle">
        <thead>
          <tr>
            <th>기간</th>
            <th>사용일수</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {approvedLeaves.map((item) => (
            <tr key={item.id}>
              <td>{item.startDate} ~ {item.endDate}</td>
              <td>{item.days}일</td>
              <td>
                <Badge status="approved">승인됨</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
