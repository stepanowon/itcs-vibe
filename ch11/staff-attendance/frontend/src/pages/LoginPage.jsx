import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input } from '../components/ui/index.js'
import { useLogin } from '../hooks/useLogin.js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const { mutate, isPending } = useLogin()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')
    mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate('/dashboard', { replace: true })
        },
        onError: (err) => {
          if (err.response?.status === 403) {
            setFormError('비활성화된 계정입니다')
            return
          }
          setFormError('이메일 또는 비밀번호가 올바르지 않습니다')
        },
      },
    )
  }

  return (
    <main className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-3">
      <h1 className="h3 mb-4">로그인</h1>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Card>
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}
            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={isPending}>
              로그인
            </Button>
          </form>
        </Card>
        <p className="text-center mt-3">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </main>
  )
}
