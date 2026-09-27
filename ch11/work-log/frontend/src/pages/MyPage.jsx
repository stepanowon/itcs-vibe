import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import './MyPage.css';

function MyPage() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['me'],
    queryFn: () => client.get('/users/me').then((res) => res.data),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload) => client.patch('/users/me/password', payload),
    onSuccess: () => setPasswordForm({ currentPassword: '', newPassword: '' }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => client.post('/auth/logout', { refreshToken: useAuthStore.getState().refreshToken }),
    onSettled: () => {
      clearAuth();
      navigate('/login');
    },
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    changePasswordMutation.reset();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    changePasswordMutation.mutate(passwordForm);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isPending) return <p>불러오는 중...</p>;
  if (isError) {
    return <p role="alert">{error?.response?.data?.message ?? '내 정보를 불러올 수 없습니다.'}</p>;
  }

  return (
    <div className="mypage">
      <section className="mypage-profile">
        <h1>마이페이지</h1>
        <dl>
          <dt>이름</dt><dd>{data.name}</dd>
          <dt>부서</dt><dd>{data.department}</dd>
          <dt>이메일</dt><dd>{data.email}</dd>
        </dl>
        <p>작성한 업무일지 {data.workLogCount}건</p>
        <button type="button" onClick={handleLogout} disabled={logoutMutation.isPending}>로그아웃</button>
      </section>

      <section className="mypage-password">
        <h2>패스워드 변경</h2>
        <form onSubmit={handlePasswordSubmit}>
          <label>기존 패스워드
            <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
          </label>
          <label>새 패스워드
            <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} required minLength={8} />
          </label>
          {changePasswordMutation.isError && (
            <p role="alert">{changePasswordMutation.error?.response?.data?.message ?? '패스워드 변경 중 오류가 발생했습니다.'}</p>
          )}
          {changePasswordMutation.isSuccess && <p>패스워드가 변경되었습니다.</p>}
          <button type="submit" disabled={changePasswordMutation.isPending}>변경하기</button>
        </form>
      </section>
    </div>
  );
}
export default MyPage;
