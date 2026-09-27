import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import './SignupPage.css';

const INITIAL_FORM = {
  name: '',
  department: '',
  email: '',
  password: '',
};

function SignupPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationFn: (payload) => client.post('/auth/signup', payload).then((res) => res.data),
    onSuccess: () => navigate('/login'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signupMutation.mutate(form);
  };

  return (
    <div className="signup-page">
      <h1>회원가입</h1>
      <form className="signup-form" onSubmit={handleSubmit}>
        <label htmlFor="name">이름</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} required />

        <label htmlFor="department">부서</label>
        <input id="department" name="department" value={form.department} onChange={handleChange} required />

        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">패스워드</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          value={form.password}
          onChange={handleChange}
          required
        />

        {signupMutation.isError && (
          <p role="alert" className="signup-error">
            {signupMutation.error?.response?.data?.message ?? '가입 중 오류가 발생했습니다.'}
          </p>
        )}

        <button type="submit" disabled={signupMutation.isPending}>
          가입하기
        </button>
      </form>
      <p className="signup-login-link">
        이미 계정이 있나요? <Link to="/login">로그인하기</Link>
      </p>
    </div>
  );
}

export default SignupPage;
