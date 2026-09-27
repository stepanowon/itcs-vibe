import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { toKoreanDayOfWeek } from '../lib/dayOfWeek';
import './WorkLogDetailPage.css';

function WorkLogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['work-log', id],
    queryFn: () => client.get(`/work-logs/${id}`).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.delete(`/work-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-logs'] });
      queryClient.removeQueries({ queryKey: ['work-log', id] });
      navigate('/work-logs');
    },
  });

  const handleDelete = () => {
    if (window.confirm('삭제하시겠습니까?')) {
      deleteMutation.mutate();
    }
  };

  if (isPending) return <p>불러오는 중...</p>;
  if (isError) {
    return <p role="alert">{error?.response?.data?.message ?? '업무일지를 불러올 수 없습니다.'}</p>;
  }

  return (
    <div className="worklog-detail-page">
      <div className="worklog-detail-card">
        <div className="worklog-detail-header">
          <p className="worklog-detail-date">{data.logDate} ({toKoreanDayOfWeek(data.dayOfWeek)}요일)</p>
          <span className={`badge ${data.isCompleted ? 'badge-done' : 'badge-progress'}`}>{data.isCompleted ? '완료' : '진행중'}</span>
        </div>
        <h1>{data.title}</h1>

        <section>
          <h2>업무 내용</h2>
          <p>{data.content}</p>
        </section>
        {data.issueSolution && <section><h2>문제점 및 해결방안</h2><p>{data.issueSolution}</p></section>}
        {data.tomorrowPlan && <section><h2>내일 계획</h2><p>{data.tomorrowPlan}</p></section>}

        {deleteMutation.isError && (
          <p role="alert">{deleteMutation.error?.response?.data?.message ?? '삭제 중 오류가 발생했습니다.'}</p>
        )}

        <div className="worklog-detail-actions">
          <button type="button" className="worklog-detail-delete" onClick={handleDelete} disabled={deleteMutation.isPending}>삭제</button>
          <Link to={`/work-logs/${id}/edit`} className="worklog-detail-edit">수정</Link>
        </div>
      </div>
    </div>
  );
}
export default WorkLogDetailPage;
