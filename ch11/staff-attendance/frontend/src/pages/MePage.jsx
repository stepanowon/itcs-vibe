import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/users.js'
import { Card, Button, Badge, Input, useToast } from '../components/ui/index.js'
import { useChangePassword } from '../hooks/useChangePassword.js'
import { ROLE_LABEL } from '../constants/labels.js'
import { getErrorMessage } from '../utils/apiError.js'

export default function MePage() {
  const { data: me } = useQuery({ queryKey: ['users', 'me'], queryFn: getMe })
  const { showToast } = useToast()
  const { mutate, isPending } = useChangePassword()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다')
      return
    }

    mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          showToast('비밀번호가 변경되었습니다')
          resetForm()
        },
        onError: (err) => {
          if (err.response?.data?.code === 'INVALID_CURRENT_PASSWORD') {
            setError('현재 비밀번호가 일치하지 않습니다')
            return
          }
          setError(getErrorMessage(err, '비밀번호 변경에 실패했습니다'))
        },
      },
    )
  }

  return (
    <main>
      <h1>내 정보</h1>
      <div className="mb-3">
        <Card>
          <div className="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom">
            <div
              className="rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 64, height: 64, fontSize: '1.5rem' }}
            >
              {me?.name?.[0] ?? '?'}
            </div>
            <div>
              <h2 className="h5 mb-1">{me?.name}</h2>
              <div className="d-flex align-items-center flex-wrap gap-2">
                {me?.role && <Badge status={me.role}>{ROLE_LABEL[me.role] ?? me.role}</Badge>}
                <span className="text-body-secondary small">{me?.email}</span>
              </div>
            </div>
          </div>
          <div className="row row-cols-1 row-cols-sm-3 g-3">
            {[
              { label: '사번', value: me?.employeeNo },
              { label: '입사일', value: me?.hireDate },
              { label: '역할', value: me?.role },
            ].map(({ label, value }) => (
              <div className="col" key={label}>
                <div className="bg-body-tertiary rounded-3 p-3 h-100">
                  <p className="text-uppercase text-body-secondary small mb-1">{label}</p>
                  <p className="fw-semibold mb-0">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="비밀번호 변경">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <Input
            label="현재 비밀번호"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="새 비밀번호"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="새 비밀번호 확인"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" disabled={isPending}>
            변경
          </Button>
        </form>
      </Card>
    </main>
  )
}
