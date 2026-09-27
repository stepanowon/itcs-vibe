import { useState } from 'react'
import { useAuthStore } from '../store/authStore.js'
import { useLeaveRequestsManage, useApproveLeaveRequest, useRejectLeaveRequest } from '../hooks/useLeaveRequestsManage.js'
import { Button, Badge, Modal, useToast } from '../components/ui/index.js'
import { LEAVE_STATUS_LABEL as STATUS_LABEL, LEAVE_UNIT_LABEL as UNIT_LABEL } from '../constants/labels.js'
import { getErrorMessage } from '../utils/apiError.js'

export default function LeaveRequestsManagePage() {
  const [filter, setFilter] = useState('pending')
  const [target, setTarget] = useState(null) // { item, action: 'approve' | 'reject' }
  const user = useAuthStore((state) => state.user)
  const { data: leaveRequests = [], isLoading } = useLeaveRequestsManage(filter === 'pending' ? 'pending' : undefined)
  const approveMutation = useApproveLeaveRequest()
  const rejectMutation = useRejectLeaveRequest()
  const { showToast } = useToast()

  const isProcessing = approveMutation.isPending || rejectMutation.isPending

  const closeConfirm = () => setTarget(null)

  const handleConfirm = () => {
    if (!target) return
    const mutation = target.action === 'approve' ? approveMutation : rejectMutation
    mutation.mutate(target.item.id, {
      onSuccess: closeConfirm,
      onError: (err) => {
        if (err.response?.status === 409) {
          showToast('이미 처리된 신청입니다', 'error')
        } else {
          showToast(getErrorMessage(err, '처리에 실패했습니다'), 'error')
        }
        closeConfirm()
      },
    })
  }

  return (
    <main>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h1 className="mb-0">연차 승인 관리</h1>

        <fieldset className="d-flex align-items-center gap-2">
          <legend className="visually-hidden">상태 필터</legend>
          <span className="text-body-secondary small">상태 필터</span>
          <div className="btn-group" role="group">
            <input
              type="radio"
              id="filter-pending"
              className="btn-check"
              name="status-filter"
              checked={filter === 'pending'}
              onChange={() => setFilter('pending')}
            />
            <label className="btn btn-outline-success btn-sm" htmlFor="filter-pending">
              대기중
            </label>
            <input
              type="radio"
              id="filter-all"
              className="btn-check"
              name="status-filter"
              checked={filter === 'all'}
              onChange={() => setFilter('all')}
            />
            <label className="btn btn-outline-success btn-sm" htmlFor="filter-all">
              전체
            </label>
          </div>
        </fieldset>
      </div>

      {isLoading && <p>불러오는 중...</p>}
      {!isLoading && leaveRequests.length === 0 && <p>연차 신청 내역이 없습니다</p>}

      <div className="d-flex flex-column gap-3">
        {leaveRequests.map((item) => {
          const isSelf = item.requesterId === user?.id
          const isPending = item.status === 'pending'
          return (
            <div key={item.id} className="card shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                  <div className="d-flex gap-3">
                    <div
                      className="rounded-circle bg-success-subtle text-success fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 44, height: 44 }}
                    >
                      {item.requesterName?.[0] ?? '?'}
                    </div>
                    <div>
                      <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                        <p className="fw-semibold mb-0">{item.requesterName}</p>
                        <Badge status={item.status}>{STATUS_LABEL[item.status]}</Badge>
                      </div>
                      <p className="mb-1 text-body-secondary small">
                        {item.startDate} ~ {item.endDate} ({item.days}일{item.halfDay ? `, ${UNIT_LABEL[item.halfDay]}` : ''})
                      </p>
                      <p className="mb-0">{item.reason}</p>
                      {!isPending && item.processorName && (
                        <p className="mb-0 mt-1 text-body-secondary small">처리자: {item.processorName}</p>
                      )}
                    </div>
                  </div>
                  {isPending && (
                    <div className="d-flex flex-column align-items-end gap-1">
                      <div className="d-flex gap-2">
                        <Button variant="primary" disabled={isSelf} onClick={() => setTarget({ item, action: 'approve' })}>
                          승인
                        </Button>
                        <Button variant="danger" disabled={isSelf} onClick={() => setTarget({ item, action: 'reject' })}>
                          반려
                        </Button>
                      </div>
                      {isSelf && <p className="text-body-secondary small mb-0">본인이 신청한 연차는 처리할 수 없습니다</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={!!target} onClose={closeConfirm} title={target?.action === 'approve' ? '연차 승인 확인' : '연차 반려 확인'}>
        {target && (
          <div>
            <p>신청자: {target.item.requesterName}</p>
            <p>
              기간: {target.item.startDate} ~ {target.item.endDate} ({target.item.days}일
              {target.item.halfDay ? `, ${UNIT_LABEL[target.item.halfDay]}` : ''})
            </p>
            <p>사유: {target.item.reason}</p>
            <p>이 신청을 {target.action === 'approve' ? '승인' : '반려'}하시겠습니까?</p>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={closeConfirm}>
                취소
              </Button>
              <Button variant="primary" onClick={handleConfirm} disabled={isProcessing}>
                {target.action === 'approve' ? '승인 확정' : '반려 확정'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  )
}
