import { useState } from 'react'
import { Button, Card, Badge, useToast } from '../components/ui/index.js'
import { useMyLeaveBalance, useMyLeaveRequestsList, useCreateLeaveRequest } from '../hooks/useMyLeaveRequests.js'
import { LEAVE_STATUS_LABEL as STATUS_LABEL, LEAVE_UNIT_LABEL as UNIT_LABEL } from '../constants/labels.js'
import { formatDate, addDays } from '../utils/date.js'

function tomorrow() {
  return formatDate(addDays(new Date(), 1))
}

function calcDays(unit, startDate, endDate) {
  if (unit !== 'full') return startDate ? 0.5 : 0
  if (!startDate || !endDate) return 0
  const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1
  return diff > 0 ? diff : 0
}

export default function LeaveRequestsPage() {
  const { showToast } = useToast()
  const { data: balance } = useMyLeaveBalance()
  const { data: leaveRequests = [] } = useMyLeaveRequestsList()
  const createLeaveRequest = useCreateLeaveRequest()

  const [unit, setUnit] = useState('full')
  const [startDate, setStartDate] = useState(tomorrow)
  const [endDate, setEndDate] = useState(tomorrow)
  const [reason, setReason] = useState('')

  const isHalfDay = unit !== 'full'
  const invalidRange = !isHalfDay && startDate && endDate && startDate > endDate
  const days = calcDays(unit, startDate, endDate)

  function handleUnitChange(nextUnit) {
    setUnit(nextUnit)
    if (nextUnit !== 'full') setEndDate(startDate)
  }

  function handleStartDateChange(value) {
    setStartDate(value)
    if (isHalfDay) setEndDate(value)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (invalidRange) return

    createLeaveRequest.mutate(
      { startDate, endDate: isHalfDay ? startDate : endDate, reason, halfDay: isHalfDay ? unit : undefined },
      {
        onSuccess: () => {
          showToast('연차 신청이 접수되었습니다')
          setUnit('full')
          setStartDate(tomorrow())
          setEndDate(tomorrow())
          setReason('')
        },
      },
    )
  }

  const submitError = createLeaveRequest.isError
    ? createLeaveRequest.error?.response?.data?.message || '연차 신청에 실패했습니다'
    : null

  return (
    <main>
      <h1>연차 신청</h1>
      <p>잔여 연차: {balance?.remainingDays ?? '-'}일</p>

      <div className="mb-4">
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">시작일</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">종료일</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isHalfDay}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">구분</label>
              <select className="form-select" value={unit} onChange={(e) => handleUnitChange(e.target.value)}>
                <option value="full">종일</option>
                <option value="am">오전</option>
                <option value="pm">오후</option>
              </select>
            </div>

            {invalidRange && (
              <div className="alert alert-danger" role="alert">
                ⚠ 시작일은 종료일보다 늦을 수 없습니다
              </div>
            )}

            <p>신청 일수: {days}일</p>

            <div className="mb-3">
              <label className="form-label">사유</label>
              <textarea
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            {submitError && (
              <div className="alert alert-danger" role="alert">
                ⚠ {submitError}
              </div>
            )}

            <p className="alert alert-light border small">※ 잔여 연차일수 내에서만 신청할 수 있습니다</p>

            <Button type="submit" disabled={invalidRange} loading={createLeaveRequest.isPending}>
              신청
            </Button>
          </form>
        </Card>
      </div>

      <Card title="내 연차 신청 내역">
        <table className="table table-striped align-middle mb-0">
          <thead>
            <tr>
              <th>기간</th>
              <th>구분</th>
              <th>사유</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map((item) => (
              <tr key={item.id}>
                <td>{item.startDate} ~ {item.endDate}</td>
                <td>{UNIT_LABEL[item.halfDay ?? 'full']}</td>
                <td>{item.reason}</td>
                <td>
                  <Badge status={item.status}>{STATUS_LABEL[item.status] ?? item.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  )
}
