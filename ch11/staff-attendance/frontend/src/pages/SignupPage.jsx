import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input, useToast } from '../components/ui/index.js'
import { useSignup } from '../hooks/useSignup.js'
import { getErrorMessage, isDuplicateEmployeeNoError } from '../utils/apiError.js'

const INITIAL_FORM = {
  email: '',
  name: '',
  employeeNo: '',
  hireDate: '',
  password: '',
  passwordConfirm: '',
}

export default function SignupPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [employeeNoError, setEmployeeNoError] = useState('')
  const { mutate, isPending } = useSignup()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (field === 'employeeNo') setEmployeeNoError('')
  }

  const isFormFilled = Object.values(form).every((value) => value.trim() !== '')
  const isPasswordMatched = form.password === form.passwordConfirm
  const canSubmit = isFormFilled && isPasswordMatched && !isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return

    const { email, name, employeeNo, hireDate, password } = form
    mutate(
      { email, name, employeeNo, hireDate, password },
      {
        onSuccess: (data) => {
          if (import.meta.env.DEV) console.log('[signup] success', data.role)
          showToast('가입이 완료되었습니다', 'success')
          navigate('/login')
        },
        onError: (err) => {
          if (isDuplicateEmployeeNoError(err)) {
            setEmployeeNoError(err.response.data.message)
            return
          }
          showToast(getErrorMessage(err, '가입에 실패했습니다'), 'error')
        },
      },
    )
  }

  return (
    <main className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-3">
      <h1 className="h3 mb-4">회원가입</h1>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Card>
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
            <Input label="비밀번호" type="password" value={form.password} onChange={handleChange('password')} />
            <Input
              label="비밀번호 확인"
              type="password"
              value={form.passwordConfirm}
              onChange={handleChange('passwordConfirm')}
              error={form.passwordConfirm && !isPasswordMatched ? '비밀번호가 일치하지 않습니다' : ''}
            />
            <div className="alert alert-light border small">※ 최초 가입자는 자동으로 manager 권한이 부여됩니다</div>
            <Button type="submit" disabled={!canSubmit}>
              가입하기
            </Button>
          </form>
        </Card>
        <p className="text-center mt-3">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </main>
  )
}
