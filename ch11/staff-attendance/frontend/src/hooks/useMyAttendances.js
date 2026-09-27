import { useQuery } from '@tanstack/react-query'
import { getMyAttendances } from '../api/attendances.js'
import { getMyLeaveRequests } from '../api/leaveRequests.js'

export function useMyAttendancesList(month) {
  return useQuery({ queryKey: ['attendances', 'me', month], queryFn: () => getMyAttendances(month) })
}

export function useMyLeaveRequestsByMonth(month) {
  return useQuery({ queryKey: ['leaveRequests', 'me', month], queryFn: () => getMyLeaveRequests(month) })
}
