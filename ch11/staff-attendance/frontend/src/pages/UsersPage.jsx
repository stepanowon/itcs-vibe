import { useState, useEffect } from 'react'
import { Button, Card, Input, Modal, Badge, useToast } from '../components/ui/index.js'
import { useUsers, useCreateManager, useLeaveBalances, useLeavePolicy, useUpdateLeavePolicy } from '../hooks/useUsers.js'
import { getErrorMessage, isDuplicateEmployeeNoError } from '../utils/apiError.js'

const INITIAL_FORM = {
  email: '',
  name: '',
  employeeNo: '',
  hireDate: '',
  password: '',
}

const STATUS_LABEL = { active: '활성', inactive: '비활성' }

export default function UsersPage() {
  const { data: users = [] } = useUsers()
  const { data: leaveBalances = [] } = useLeaveBalances()
  const { data: leavePolicy } = useLeavePolicy()
  const { mutate, isPending } = useCreateManager()
  const updateLeavePolicy = useUpdateLeavePolicy()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [employeeNoError, setEmployeeNoError] = useState('')
  const [baseDaysDraft, setBaseDaysDraft] = useState('')

  useEffect(() => {
    if (leavePolicy) setBaseDaysDraft(String(leavePolicy.baseDays))
  }, [leavePolicy])

  const handleSaveBaseDays = () => {
    const value = Number(baseDaysDraft)
    if (Number.isNaN(value)) return
    updateLeavePolicy.mutate(value, {
      onSuccess: () => showToast('공통 연차일수가 변경되었습니다. 전체 직원의 총 연차일수가 재계산되었습니다', 'success'),
      onError: (err) => showToast(getErrorMessage(err, '변경에 실패했습니다'), 'error'),
    })
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (field === 'employeeNo') setEmployeeNoError('')
  }

  const closeModal = () => {
    setOpen(false)
    setForm(INITIAL_FORM)
    setEmployeeNoError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutate(form, {
      onSuccess: (data) => {
        if (import.meta.env.DEV) console.log('[users] manager created', data.id)
        showToast('관리자 계정이 생성되었습니다', 'success')
        closeModal()
      },
      onError: (err) => {
        if (isDuplicateEmployeeNoError(err)) {
          setEmployeeNoError(err.response.data.message)
          return
        }
        showToast(getErrorMessage(err, '생성에 실패했습니다'), 'error')
      },
    })
  }

  return (
    <main>
      <h1 className="mb-3">사용자 관리</h1>
      <Button onClick={() => setOpen(true)}>관리자 계정 생성</Button>

      <div className="mt-3">
        <Card title="공통 연차일수 설정">
          <p className="text-body-secondary small">
            해당연도 입사자는 0일, 전년도 입사자는 공통 연차일수만큼, 그 이전 입사자는 공통 연차일수+(지난 햇수-1)만큼 총 연차일수를 자동으로 부여받습니다. 저장하면 전체 직원에게 즉시 재계산되어 반영됩니다.
          </p>
          <div className="d-flex gap-2 align-items-center">
            <input
              type="number"
              step="0.5"
              min="0"
              className="form-control"
              style={{ width: 120 }}
              value={baseDaysDraft}
              onChange={(e) => setBaseDaysDraft(e.target.value)}
            />
            <Button onClick={handleSaveBaseDays} disabled={updateLeavePolicy.isPending}>
              저장
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-3">
        <Card>
          <table className="table table-striped align-middle mb-0">
            <thead>
              <tr>
                <th>사번</th>
                <th>이름</th>
                <th>역할</th>
                <th>입사일</th>
                <th>상태</th>
                <th>총 연차일수</th>
                <th>사용/잔여 연차</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const balance = leaveBalances.find((b) => b.userId === user.id)
                return (
                  <tr key={user.id}>
                    <td>{user.employeeNo}</td>
                    <td>{user.name}</td>
                    <td>
                      <Badge status={user.role}>{user.role === 'manager' ? '관리자' : '직원'}</Badge>
                    </td>
                    <td>{user.hireDate}</td>
                    <td>
                      <Badge status={user.status}>{STATUS_LABEL[user.status] ?? user.status}</Badge>
                    </td>
                    <td>{balance?.totalDays ?? '-'}</td>
                    <td>{balance ? `${balance.usedDays} / ${balance.remainingDays}` : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal open={open} onClose={closeModal} title="관리자 계정 생성">
        <form onSubmit={handleSubmit}>
          <Input label="이메일" type="email" value={form.email} onChange={handleChange('email')} />
          <Input label="이름" value={form.name} onChange={handleChange('name')} />
          <Input
            label="사번"
            value={form.employeeNo}
            onChange={handleChange('employeeNo')}
            error={employeeNoError}
          />
          <Input label="입사일" type="date" value={form.hireDate} onChange={handleChange('hireDate')} />
          <Input
            label="초기 비밀번호"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
          />
          <div className="d-flex justify-content-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              생성
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  )
}
