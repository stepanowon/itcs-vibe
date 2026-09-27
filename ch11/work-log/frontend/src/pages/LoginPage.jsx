import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import './LoginPage.css';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginMutation = useMutation({
    mutationFn: (payload) => client.post('/auth/login', payload).then((res) => res.data),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken);
      navigate('/work-logs');
    },
  });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(form);
  };

  return (
    <div className="login-page">
      <h1>업무일지</h1>
      <h2>로그인</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">이메일</label>
        <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />

        <label htmlFor="password">패스워드</label>
        <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required />

        {loginMutation.isError && (
          <p role="alert" className="login-error">
            {loginMutation.error?.response?.data?.message ?? '이메일 또는 패스워드가 일치하지 않습니다.'}
          </p>
        )}

        <button type="submit" disabled={loginMutation.isPending}>
          로그인
        </button>
      </form>
      <p className="login-signup-link">
        계정이 없나요? <Link to="/signup">회원가입하기</Link>
      </p>
    </div>
  );
}

export default LoginPage;
