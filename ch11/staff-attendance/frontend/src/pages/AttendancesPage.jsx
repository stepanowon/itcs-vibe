import { useState } from 'react'
import { useAllAttendances, useAllLeaveRequestsByMonth, useUsersList } from '../hooks/useAllAttendances.js'
import { LEAVE_STATUS_LABEL as STATUS_LABEL } from '../constants/labels.js'
import { formatMonth as currentMonth, formatTime } from '../utils/date.js'

function buildSummary(users, attendances, leaveRequests) {
  return users.map((u) => {
    const userAttendances = attendances.filter((a) => a.userId === u.id)
    const leaveDays = leaveRequests
      .filter((lr) => lr.requesterId === u.id && lr.status === 'approved')
      .reduce((sum, lr) => sum + Number(lr.days), 0)
    return {
      ...u,
      workedDays: userAttendances.length,
      incompleteCount: userAttendances.filter((a) => !a.checkOutAt).length,
      leaveDays,
    }
  })
}

export default function AttendancesPage() {
  const [month, setMonth] = useState(currentMonth())
  const [target, setTarget] = useState('all')

  const { data: users = [] } = useUsersList()
  const { data: attendances = [] } = useAllAttendances({ month, userId: target === 'all' ? undefined : target })
  const { data: leaveRequests = [] } = useAllLeaveRequestsByMonth(month)

  const selectedUser = target === 'all' ? null : users.find((u) => u.id === target)

  return (
    <main>
      <h1>전체 근태 현황</h1>

      <div className="row g-3 mb-3" style={{ maxWidth: 480 }}>
        <div className="col-6">
          <label className="form-label">조회 월</label>
          <input type="month" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="col-6">
          <label className="form-label">대상</label>
          <select className="form-select" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="all">전체 직원</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {target === 'all' ? (
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>사번</th>
              <th>이름</th>
              <th>출근일수</th>
              <th>미체크아웃</th>
              <th>연차사용</th>
            </tr>
          </thead>
          <tbody>
            {buildSummary(users, attendances, leaveRequests).map((row) => (
              <tr key={row.id}>
                <td>{row.employeeNo}</td>
                <td>{row.name}</td>
                <td>{row.workedDays}일</td>
                <td>{row.incompleteCount}건</td>
                <td>{row.leaveDays}일</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <section>
          <h2>
            {selectedUser?.name}({selectedUser?.employeeNo}) - {month} 상세
          </h2>
          {attendances.length === 0 ? (
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
                {attendances.map((a) => (
                  <tr key={a.id}>
                    <td>{a.workDate}</td>
                    <td>{a.checkInAt ? formatTime(a.checkInAt) : '--:--'}</td>
                    <td>{a.checkOutAt ? formatTime(a.checkOutAt) : '--:--'}</td>
                    <td>{a.checkOutAt ? '정상' : '미완료'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>연차 사용 내역</h2>
          <ul>
            {leaveRequests
              .filter((lr) => lr.requesterId === target)
              .map((lr) => (
                <li key={lr.id}>
                  {lr.startDate} ~ {lr.endDate} ({lr.days}일, {STATUS_LABEL[lr.status]})
                </li>
              ))}
          </ul>
        </section>
      )}
    </main>
  )
}
