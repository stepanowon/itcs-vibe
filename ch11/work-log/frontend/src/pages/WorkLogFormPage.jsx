import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import './WorkLogFormPage.css';

const emptyForm = {
  logDate: new Date().toISOString().slice(0, 10),
  title: '',
  content: '',
  issueSolution: '',
  isCompleted: false,
  tomorrowPlan: '',
};

function WorkLogFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);

  const { data: existing, isPending: isLoadingExisting } = useQuery({
    queryKey: ['work-log', id],
    queryFn: () => client.get(`/work-logs/${id}`).then((res) => res.data),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (existing) {
      setForm({
        logDate: existing.logDate,
        title: existing.title ?? '',
        content: existing.content ?? '',
        issueSolution: existing.issueSolution ?? '',
        isCompleted: existing.isCompleted ?? false,
        tomorrowPlan: existing.tomorrowPlan ?? '',
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      id
        ? client.patch(`/work-logs/${id}`, payload).then((res) => res.data)
        : client.post('/work-logs', payload).then((res) => res.data),
    onSuccess: (saved) => navigate(`/work-logs/${saved.id}`),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      logDate: form.logDate,
      title: form.title,
      content: form.content,
      issueSolution: form.issueSolution || undefined,
      isCompleted: form.isCompleted === true || form.isCompleted === 'true',
      tomorrowPlan: form.tomorrowPlan || undefined,
    };
    saveMutation.mutate(payload);
  };

  if (id && isLoadingExisting) return <p>불러오는 중...</p>;

  return (
    <div className="worklog-form-page">
      <h1>{id ? '업무일지 수정' : '업무일지 작성'}</h1>
      <form onSubmit={handleSubmit} className="worklog-form">
        <label>작성일자
          <input type="date" name="logDate" value={form.logDate} onChange={handleChange} required />
        </label>
        <label>제목
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>
        <label>업무 내용
          <textarea name="content" value={form.content} onChange={handleChange} required />
        </label>
        <label>문제점 및 해결방안
          <textarea name="issueSolution" value={form.issueSolution} onChange={handleChange} />
        </label>
        <fieldset>
          <legend>완료여부</legend>
          <label><input type="radio" name="isCompleted" value="true" checked={form.isCompleted === true || form.isCompleted === 'true'} onChange={handleChange} /> 완료</label>
          <label><input type="radio" name="isCompleted" value="false" checked={form.isCompleted === false || form.isCompleted === 'false'} onChange={handleChange} /> 진행중</label>
        </fieldset>
        <label>내일 계획
          <textarea name="tomorrowPlan" value={form.tomorrowPlan} onChange={handleChange} />
        </label>
        <div className="worklog-form-actions">
          <button type="button" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" disabled={saveMutation.isPending}>저장</button>
        </div>
      </form>

      {saveMutation.isError && (
        <div className="worklog-form-error-overlay">
          <div className="worklog-form-error-box" role="alert">
            <p>{saveMutation.error?.response?.data?.message ?? '저장 중 오류가 발생했습니다.'}</p>
            <button type="button" onClick={() => saveMutation.reset()}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default WorkLogFormPage;
