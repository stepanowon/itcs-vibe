import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { toKoreanDayOfWeek } from '../lib/dayOfWeek';
import './WorkLogListPage.css';

const LIMIT = 20;
const emptyFilters = { isCompleted: 'all', page: 1 };

function WorkLogListPage() {
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const queryParams = {
    isCompleted: appliedFilters.isCompleted === 'all' ? undefined : appliedFilters.isCompleted === 'true',
    page: appliedFilters.page,
    limit: LIMIT,
  };

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['work-logs', queryParams],
    queryFn: () => client.get('/work-logs', { params: queryParams }).then((res) => res.data),
    placeholderData: keepPreviousData,
  });

  const handleApply = () => setAppliedFilters({ ...draftFilters, page: 1 });
  const goToPage = (page) => setAppliedFilters((prev) => ({ ...prev, page }));

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="worklog-list-page">
      <div className="worklog-filter">
        <p className="worklog-filter-title">필터</p>
        <div className="filter-fields">
          <label className="filter-field">
            <span className="filter-field-label">완료여부</span>
            <select
              value={draftFilters.isCompleted}
              onChange={(e) => setDraftFilters((p) => ({ ...p, isCompleted: e.target.value }))}
            >
              <option value="all">전체</option>
              <option value="true">완료</option>
              <option value="false">진행중</option>
            </select>
          </label>
          <button type="button" className="filter-apply" onClick={handleApply}>
            적용
          </button>
        </div>
      </div>

      {isPending && <p>불러오는 중...</p>}
      {isError && <p role="alert">{error?.response?.data?.message ?? '목록을 불러오지 못했습니다.'}</p>}

      {!isPending && !isError && items.length === 0 && (
        <p className="worklog-empty">조건에 맞는 업무일지가 없습니다.</p>
      )}

      {!isPending && !isError && items.length > 0 && (
        <>
          <ul className="worklog-cards">
            {items.map((item) => (
              <li key={item.id} className="worklog-card-item">
                <Link to={`/work-logs/${item.id}`} className="worklog-card">
                  <span className="worklog-date">
                    {item.logDate} ({toKoreanDayOfWeek(item.dayOfWeek)})
                  </span>
                  <span className="worklog-title">{item.title}</span>
                  <span className="worklog-badges">
                    <span className={`badge ${item.isCompleted ? 'badge-done' : 'badge-progress'}`}>
                      {item.isCompleted ? '완료' : '진행중'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <table className="worklog-table">
            <thead>
              <tr>
                <th>작성일자</th>
                <th>제목</th>
                <th>완료</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="worklog-row">
                  <td className="worklog-row-linked">
                    <Link to={`/work-logs/${item.id}`} className="stretched-link">
                      {item.logDate} ({toKoreanDayOfWeek(item.dayOfWeek)})
                    </Link>
                  </td>
                  <td className="worklog-row-linked worklog-row-title">
                    <Link to={`/work-logs/${item.id}`} className="stretched-link">
                      {item.title}
                    </Link>
                  </td>
                  <td>{item.isCompleted ? '완료' : '진행중'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="worklog-pagination">
            <button type="button" disabled={appliedFilters.page <= 1} onClick={() => goToPage(appliedFilters.page - 1)}>
              이전
            </button>
            <span>
              {appliedFilters.page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={appliedFilters.page >= totalPages}
              onClick={() => goToPage(appliedFilters.page + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default WorkLogListPage;
